import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ContentStatus, VideoSourceType, VideoResolution, AssetType } from "@/app/generated/prisma";
import { requireRole, CONTENT_MANAGEMENT_ROLES } from "@/lib/admin-auth";

export async function POST(request: Request) {
  try {
    const { user: currentUser, error } = await requireRole(request, CONTENT_MANAGEMENT_ROLES);
    if (error) return error;

    const payload = await request.json();
    const {
      type, title, slug, description, storyline, releaseYear, maturityRatingCode,
      tmdbId, categories = [], images = [], trailers = [], movieVideoUrl, movieDuration,
      seasonNumber, episodeNumber, episodeTitle, episodeDescription,
      episodeVideoUrl, episodeDuration, isExistingShow, existingShowId,
      isFeatured, featuredOrder,
    } = payload;

    if (!isExistingShow && (!title || !slug)) {
      return NextResponse.json({ error: "Title and slug are required for new releases." }, { status: 400 });
    }

    // 1. Resolve Prerequisite Entities
    const defaultLanguage = await prisma.languageRegistry.findFirst({ where: { iso6391: "en" } });
    const maturityRating = await prisma.maturityRating.findFirst({ where: { code: maturityRatingCode || "TV-MA" } });
    const activeUploader = await prisma.user.findUnique({ where: { id: currentUser.id } });

    if (!defaultLanguage || !activeUploader || !maturityRating) {
      return NextResponse.json({ error: "Prerequisite database configuration missing." }, { status: 412 });
    }

    const canUpload = activeUploader.role === "ADMIN" || activeUploader.role === "SUPERADMIN" || activeUploader.role === "CONTENT_MANAGER" || activeUploader.isCreator;
    if (!canUpload) {
      return NextResponse.json({ error: "You do not have permission to upload content" }, { status: 403 });
    }

    // 2. Map & Upsert Categories
    const resolvedCategories = await Promise.all(
      (categories || []).map(async (name: string) => {
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
        const content = await tx.content.create({
          data: {
            title, slug, description, storyline,
            releaseYear: Number(releaseYear || 2026),
            status: ContentStatus.READY,
            maturityRatingId: maturityRating.id,
            tmdbId: tmdbId ? Number(tmdbId) : null,
            isFeatured: isFeatured || false,
            featuredOrder: featuredOrder || 0,
            createdById: activeUploader.id,
            updatedById: activeUploader.id,
            categories: {
              create: resolvedCategories.map((cat, idx) => ({
                category: { connect: { id: cat.id } },
                isPrimary: idx === 0,
              })),
            },
          },
        });

        const video = await tx.video.create({ data: { durationSeconds: Number(movieDuration || 7200) } });
        const videoType = movieVideoUrl && movieVideoUrl.includes(".m3u8") ? VideoSourceType.HLS : VideoSourceType.MP4;
        await tx.videoSource.create({
          data: {
            videoId: video.id, url: movieVideoUrl, type: videoType,
            resolution: VideoResolution.P1080, codec: "h264", audioCodec: "aac",
            fps: 24.0, aspectRatio: "16:9",
          },
        });

        await tx.movie.create({
          data: { contentId: content.id, videoId: video.id, durationTotal: Number(movieDuration || 7200), cutVariant: "Theatrical" },
        });

        if (images?.length > 0) {
          await tx.imageAsset.createMany({
            data: images.map((img: any) => ({
              url: img.url, type: img.type as AssetType, languageId: defaultLanguage.id,
              contentId: content.id, displayOrder: Number(img.displayOrder || 0),
            })),
            skipDuplicates: true,
          });
        }

        if (trailers?.length > 0) {
          await tx.trailer.createMany({
            data: trailers.map((tr: any) => ({ contentId: content.id, title: tr.title, hlsManifestUrl: tr.hlsManifestUrl })),
            skipDuplicates: true,
          });
        }

        return { contentId: content.id };
      });
      return NextResponse.json({ success: true, data: dbResult });
    }

    // =========================================================================
    // SHOW EPISODE TRANSACTION PIPELINE
    // =========================================================================
    if (type === "SHOW") {
      const dbResult = await prisma.$transaction(async (tx) => {
        let showContent = null;

        if (existingShowId) {
          const existingShow = await tx.show.findUnique({
            where: { id: existingShowId },
            include: { content: true }
          });
          if (existingShow) {
            showContent = existingShow.content;
          } else {
            showContent = await tx.content.findUnique({ where: { id: existingShowId } });
          }
        }

        if (!showContent && slug) {
          showContent = await tx.content.findUnique({ where: { slug } });
        }

        if (!showContent) {
          showContent = await tx.content.create({
            data: {
              title: title || "Untitled Show",
              slug: slug || `show-${Date.now()}`,
              description, storyline,
              releaseYear: Number(releaseYear || 2026),
              status: ContentStatus.READY,
              maturityRatingId: maturityRating.id,
              tmdbId: tmdbId ? Number(tmdbId) : null,
              isFeatured: isFeatured || false,
              featuredOrder: featuredOrder || 0,
              createdById: activeUploader.id,
              updatedById: activeUploader.id,
              categories: {
                create: resolvedCategories.map((cat, idx) => ({
                  category: { connect: { id: cat.id } },
                  isPrimary: idx === 0,
                })),
              },
            },
          });
          await tx.show.create({ data: { contentId: showContent.id } });
        }

        // Save Images
        if (images?.length > 0) {
          await tx.imageAsset.createMany({
            data: images.map((img: any) => ({
              url: img.url, type: img.type as AssetType, languageId: defaultLanguage.id,
              contentId: showContent!.id, displayOrder: Number(img.displayOrder || 0),
            })),
            skipDuplicates: true,
          });
        }

        // Save Trailers for Shows
        if (trailers?.length > 0) {
          await tx.trailer.createMany({
            data: trailers.map((tr: any) => ({
              contentId: showContent!.id,
              title: tr.title,
              hlsManifestUrl: tr.hlsManifestUrl,
            })),
            skipDuplicates: true,
          });
        }

        const show = await tx.show.findUniqueOrThrow({ where: { contentId: showContent.id } });
        const baseSlug = showContent.slug || slug || "show";

        let season = await tx.season.findFirst({
          where: { showId: show.id, seasonNumber: Number(seasonNumber || 1) },
        });

        if (!season) {
          season = await tx.season.create({
            data: {
              showId: show.id,
              seasonNumber: Number(seasonNumber || 1),
              title: `Season ${seasonNumber || 1}`,
              slug: `${baseSlug}-season-${seasonNumber || 1}`.toLowerCase(),
            },
          });
        }

        const video = await tx.video.create({ data: { durationSeconds: Number(episodeDuration || 2700) } });
        const videoType = episodeVideoUrl && episodeVideoUrl.includes(".m3u8") ? VideoSourceType.HLS : VideoSourceType.MP4;
        await tx.videoSource.create({
          data: {
            videoId: video.id, url: episodeVideoUrl, type: videoType,
            resolution: VideoResolution.P1080, codec: "h264", audioCodec: "aac",
            fps: 24.0, aspectRatio: "16:9",
          },
        });

        const episodeSlug = `${baseSlug}-s${seasonNumber || 1}-e${episodeNumber || 1}`.toLowerCase();
        const finalEpisodeTitle = episodeTitle || `${showContent.title} - S${seasonNumber || 1} E${episodeNumber || 1}`;

        const episode = await tx.episode.upsert({
          where: { slug: episodeSlug },
          update: { title: finalEpisodeTitle, description: episodeDescription || description, videoId: video.id },
          create: {
            seasonId: season.id, videoId: video.id, episodeNumber: Number(episodeNumber || 1),
            title: finalEpisodeTitle, slug: episodeSlug, description: episodeDescription || description,
          },
        });

        return { contentId: showContent.id, episodeId: episode.id };
      });
      return NextResponse.json({ success: true, data: dbResult });
    }

    return NextResponse.json({ error: "Invalid media type." }, { status: 400 });
  } catch (error: any) {
    console.error("Content metadata transaction failed:", error);
    return NextResponse.json({ error: error.message || "An error occurred." }, { status: 500 });
  }
}