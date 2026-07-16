import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // Make sure your global prisma client imports from '@/app/generated/prisma'
import { ContentStatus, VideoSourceType, VideoResolution, AssetType } from "@/app/generated/prisma";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const {
      type, // "MOVIE" or "SHOW"
      title,
      slug,
      description,
      storyline,
      releaseYear,
      maturityRatingCode,
      tmdbId,
      categories,      // e.g. ["Action", "Sci-Fi"]
      images,          // Array of { url: string; type: "POSTER" | "BACKDROP"; displayOrder: number }
      trailers,        // Array of { title: string; hlsManifestUrl: string }
      movieVideoUrl,
      movieDuration,
      seasonNumber,
      episodeNumber,
      episodeTitle,
      episodeDescription,
      episodeVideoUrl,
      episodeDuration,
    } = payload;

    if (!title || !slug) {
      return NextResponse.json({ error: "Missing required core metadata identifiers." }, { status: 400 });
    }

    // 1. Resolve Prerequisite Entities
    const defaultLanguage = await prisma.languageRegistry.findFirst({
      where: { iso6391: "en" },
    });
    
    const maturityRating = await prisma.maturityRating.findFirst({
      where: { code: maturityRatingCode || "TV-MA" },
    });

    const activeAdminUser = await prisma.user.findFirst({
      where: { role: "ADMIN" },
    });

    if (!defaultLanguage || !activeAdminUser || !maturityRating) {
      return NextResponse.json(
        { 
          error: "Prerequisite database configuration missing. Ensure Language 'en', a Maturity Rating, and an Admin user exist." 
        }, 
        { status: 412 }
      );
    }

    // 2. Map & Upsert Categories
    const resolvedCategories = await Promise.all(
      categories.map(async (name: string) => {
        const normalizedSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        return prisma.category.upsert({
          where: { slug: normalizedSlug },
          update: {},
          create: { name, slug: normalizedSlug },
        });
      })
    );

    // =========================================================================
    // MOVIE TRANSACTION PIPELINE
    // =========================================================================
    if (type === "MOVIE") {
      const dbResult = await prisma.$transaction(async (tx) => {
        // Create base Content node
        const content = await tx.content.create({
          data: {
            title,
            slug,
            description,
            storyline,
            releaseYear: Number(releaseYear || 2026),
            status: ContentStatus.READY,
            maturityRatingId: maturityRating.id,
            tmdbId: tmdbId ? Number(tmdbId) : null,
            createdById: activeAdminUser.id,
            updatedById: activeAdminUser.id,
            categories: {
              create: resolvedCategories.map((cat, idx) => ({
                category: { connect: { id: cat.id } },
                isPrimary: idx === 0,
              })),
            },
          },
        });

        // Create Video Instance
        const video = await tx.video.create({
          data: {
            durationSeconds: Number(movieDuration || 7200),
          },
        });

        // Add Video Source pointing to R2 URL
        await tx.videoSource.create({
          data: {
            videoId: video.id,
            url: movieVideoUrl,
            type: VideoSourceType.MP4,
            resolution: VideoResolution.P1080,
            codec: "h264",
            audioCodec: "aac",
            fps: 24.0,
            aspectRatio: "16:9",
          },
        });

        // Create Movie linked to the content container & video instance
        const movie = await tx.movie.create({
          data: {
            contentId: content.id,
            videoId: video.id,
            durationTotal: Number(movieDuration || 7200),
            cutVariant: "Theatrical",
          },
        });

        // Add Multi-image assets to content node
        if (images && images.length > 0) {
          await tx.imageAsset.createMany({
            data: images.map((img: any) => ({
              url: img.url,
              type: img.type as AssetType,
              languageId: defaultLanguage.id,
              contentId: content.id,
              displayOrder: Number(img.displayOrder || 0),
            })),
          });
        }

        // Connect trailer items
        if (trailers && trailers.length > 0) {
          await tx.trailer.createMany({
            data: trailers.map((tr: any) => ({
              contentId: content.id,
              title: tr.title,
              hlsManifestUrl: tr.hlsManifestUrl,
            })),
          });
        }

        return { contentId: content.id, movieId: movie.id };
      });

      return NextResponse.json({ success: true, data: dbResult });
    }

    // =========================================================================
    // SHOW EPISODE TRANSACTION PIPELINE
    // =========================================================================
    if (type === "SHOW") {
      const dbResult = await prisma.$transaction(async (tx) => {
        // Query or create top-level Content entity for the Show
        let showContent = await tx.content.findUnique({
          where: { slug },
        });

        if (!showContent) {
          showContent = await tx.content.create({
            data: {
              title,
              slug,
              description,
              storyline,
              releaseYear: Number(releaseYear || 2026),
              status: ContentStatus.READY,
              maturityRatingId: maturityRating.id,
              tmdbId: tmdbId ? Number(tmdbId) : null,
              createdById: activeAdminUser.id,
              updatedById: activeAdminUser.id,
              categories: {
                create: resolvedCategories.map((cat, idx) => ({
                  category: { connect: { id: cat.id } },
                  isPrimary: idx === 0,
                })),
              },
            },
          });

          await tx.show.create({
            data: {
              contentId: showContent.id,
            },
          });
        }

        const show = await tx.show.findUniqueOrThrow({
          where: { contentId: showContent.id },
        });

        // Find or create structural Season relation
        let season = await tx.season.findFirst({
          where: { showId: show.id, seasonNumber: Number(seasonNumber || 1) },
        });

        if (!season) {
          season = await tx.season.create({
            data: {
              showId: show.id,
              seasonNumber: Number(seasonNumber || 1),
              title: `Season ${seasonNumber || 1}`,
              slug: `${slug}-season-${seasonNumber || 1}`,
            },
          });
        }

        // Create Video representation resource
        const video = await tx.video.create({
          data: {
            durationSeconds: Number(episodeDuration || 2700),
          },
        });

        await tx.videoSource.create({
          data: {
            videoId: video.id,
            url: episodeVideoUrl,
            type: VideoSourceType.MP4,
            resolution: VideoResolution.P1080,
            codec: "h264",
            audioCodec: "aac",
            fps: 24.0,
            aspectRatio: "16:9",
          },
        });

        // Save Custom Episode details
        const finalEpisodeTitle = episodeTitle || `${title} - Season ${seasonNumber} Episode ${episodeNumber}`;
        const episode = await tx.episode.create({
          data: {
            seasonId: season.id,
            videoId: video.id,
            episodeNumber: Number(episodeNumber || 1),
            title: finalEpisodeTitle,
            slug: `${slug}-s${seasonNumber}-e${episodeNumber}`,
            description: episodeDescription || description,
          },
        });

        // Link images and trailers to the master Content node
        if (images && images.length > 0) {
          await tx.imageAsset.createMany({
            data: images.map((img: any) => ({
              url: img.url,
              type: img.type as AssetType,
              languageId: defaultLanguage.id,
              contentId: showContent!.id,
              displayOrder: Number(img.displayOrder || 0),
            })),
          });
        }

        if (trailers && trailers.length > 0) {
          await tx.trailer.createMany({
            data: trailers.map((tr: any) => ({
              contentId: showContent!.id,
              title: tr.title,
              hlsManifestUrl: tr.hlsManifestUrl,
            })),
          });
        }

        return { contentId: showContent.id, episodeId: episode.id };
      });

      return NextResponse.json({ success: true, data: dbResult });
    }

    return NextResponse.json({ error: "Invalid media type format selected." }, { status: 400 });
  } catch (error: any) {
    console.error("Content metadata transaction failed:", error);
    return NextResponse.json({ error: error.message || "An error occurred writing to db." }, { status: 500 });
  }
}