import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ContentStatus, VideoSourceType, VideoResolution, AssetType } from "@/app/generated/prisma";
import { getAuthenticatedUser } from "@/lib/auth";
import { slugify } from "@/lib/slug";

export async function POST(request: Request) {
  try {
    const currentUser = await getAuthenticatedUser(request);
    if (!currentUser) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    if (!currentUser.isCreator) {
      return NextResponse.json({ error: "You are not a creator" }, { status: 403 });
    }

    const payload = await request.json();
    const {
      type, title, description, storyline, releaseYear, maturityRatingCode,
      categories = [], images = [], trailers = [], videoUrl, durationSeconds,
      seasonNumber, episodeNumber, episodeTitle, episodeDescription,
    } = payload;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    if (!videoUrl) {
      return NextResponse.json({ error: "Video URL is required" }, { status: 400 });
    }

    // 1. Resolve Prerequisite Entities
    const defaultLanguage = await prisma.languageRegistry.findFirst({ where: { iso6391: "en" } });
    const maturityRating = await prisma.maturityRating.findFirst({ where: { code: maturityRatingCode || "TV-MA" } });
    const activeUploader = await prisma.user.findUnique({ where: { id: currentUser.id } });

    if (!defaultLanguage || !activeUploader || !maturityRating) {
      return NextResponse.json({ error: "Prerequisite database configuration missing." }, { status: 412 });
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

    // Generate unique slug
    const baseSlug = slugify(title);
    let slug = baseSlug;
    let counter = 1;
    while (true) {
      const exists = await prisma.content.findUnique({ where: { slug }, select: { id: true } });
      if (!exists) break;
      counter++;
      slug = `${baseSlug}-${counter}`;
    }

    // =========================================================================
    // MOVIE TRANSACTION PIPELINE
    // =========================================================================
    if (type === "MOVIE") {
      const dbResult = await prisma.$transaction(async (tx) => {
        const content = await tx.content.create({
          data: {
            title, slug, description, storyline,
            releaseYear: Number(releaseYear || new Date().getFullYear()),
            status: ContentStatus.READY,
            maturityRatingId: maturityRating.id,
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

        const video = await tx.video.create({ data: { durationSeconds: Number(durationSeconds || 7200) } });
        const videoType = videoUrl && videoUrl.includes(".m3u8") ? VideoSourceType.HLS : VideoSourceType.MP4;
        await tx.videoSource.create({
          data: {
            videoId: video.id, url: videoUrl, type: videoType,
            resolution: VideoResolution.P1080, codec: "h264", audioCodec: "aac",
            fps: 24.0, aspectRatio: "16:9",
          },
        });

        await tx.movie.create({
          data: { contentId: content.id, videoId: video.id, durationTotal: Number(durationSeconds || 7200), cutVariant: "Theatrical" },
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

        return { contentId: content.id, slug };
      });
      return NextResponse.json({ success: true, data: dbResult });
    }

    // =========================================================================
    // SHOW EPISODE TRANSACTION PIPELINE
    // =========================================================================
    if (type === "SHOW") {
      const dbResult = await prisma.$transaction(async (tx) => {
        // Check if show already exists by slug
        let showContent = await tx.content.findUnique({ where: { slug } });

        if (!showContent) {
          showContent = await tx.content.create({
            data: {
              title, slug, description, storyline,
              releaseYear: Number(releaseYear || new Date().getFullYear()),
              status: ContentStatus.READY,
              maturityRatingId: maturityRating.id,
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

        // Save Trailers
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
        const baseSlug = showContent.slug || slug;

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

        const video = await tx.video.create({ data: { durationSeconds: Number(durationSeconds || 2700) } });
        const videoType = videoUrl && videoUrl.includes(".m3u8") ? VideoSourceType.HLS : VideoSourceType.MP4;
        await tx.videoSource.create({
          data: {
            videoId: video.id, url: videoUrl, type: videoType,
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

        return { contentId: showContent.id, episodeId: episode.id, slug };
      });
      return NextResponse.json({ success: true, data: dbResult });
    }

    return NextResponse.json({ error: "Invalid media type." }, { status: 400 });
  } catch (error: any) {
    console.error("Creator content transaction failed:", error);
    return NextResponse.json({ error: error.message || "An error occurred." }, { status: 500 });
  }
}