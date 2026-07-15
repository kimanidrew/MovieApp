// src/app/api/admin/media/save/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      type, // "MOVIE" | "SHOW"
      title,
      slug,
      description,
      storyline,
      releaseYear,
      maturityRatingCode, // e.g., "TV-MA"
      tmdbId,
      keywords,
      images, // Array: { url, type: "POSTER"|"BACKDROP", displayOrder, langCode: "en" }
      trailers, // Array: { title, hlsManifestUrl }
      // Movie Variant Data
      movieVideoId,
      movieDuration,
      // Show/Episode Data
      seasonNumber,
      episodeNumber,
      episodeTitle,
      episodeDescription,
      episodeVideoId,
      episodeDuration,
    } = body;

    // Hardcoded creator ID for auditing. Replace with session auth validation in production.
    const systemUser = await prisma.user.findFirst({ where: { role: "SUPERADMIN" } });
    if (!systemUser) throw new Error("A system SUPERADMIN user must exist to audit writes.");

    // Resolve or build Maturity Rating context
    const ratingNode = await prisma.maturityRating.upsert({
      where: { code: maturityRatingCode },
      update: {},
      create: { code: maturityRatingCode, system: "TVPG", severityRank: 40 },
    });

    // Default language relation container
    const langRegistry = await prisma.languageRegistry.upsert({
      where: { iso6391: "en" },
      update: {},
      create: { iso6391: "en", name: "English" },
    });

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create base content metadata container
      const content = await tx.content.create({
        data: {
          title,
          slug,
          description,
          storyline,
          releaseYear: parseInt(releaseYear),
          maturityRatingId: ratingNode.id,
          tmdbId: parseInt(tmdbId),
          keywords: keywords || [],
          createdById: systemUser.id,
          updatedById: systemUser.id,
          status: "READY",
          images: {
            create: images.map((img: any) => ({
              url: img.url,
              type: img.type,
              displayOrder: img.displayOrder,
              languageId: langRegistry.id,
            })),
          },
          trailers: {
            create: trailers.map((t: any) => ({
              title: t.title,
              hlsManifestUrl: t.hlsManifestUrl,
            })),
          },
        },
      });

      // 2. Branch structural variant based on content type
      if (type === "MOVIE") {
        const videoNode = await tx.video.create({
  data: {
    durationSeconds: parseInt(movieDuration) || 0,
    sources: {
      create: [
        {
          type: "HLS",
          url: `https://customer-media.cloudflarestream.com/${movieVideoId}/manifest/video.m3u8`,
          codec: "hvc1",
          audioCodec: "mp4a",
          fps: 23.976,
          aspectRatio: "16:9",
        }
      ],
    },
  },
});

        await tx.movie.create({
          data: {
            contentId: content.id,
            durationTotal: parseInt(movieDuration) || 0,
            videoId: videoNode.id,
          },
        });
      } else if (type === "SHOW") {
        const showNode = await tx.show.create({
          data: { contentId: content.id },
        });

        const seasonNode = await tx.season.upsert({
          where: {
            showId_seasonNumber: {
              showId: showNode.id,
              seasonNumber: parseInt(seasonNumber),
            },
          },
          update: {},
          create: {
            showId: showNode.id,
            seasonNumber: parseInt(seasonNumber),
            slug: `${slug}-s${seasonNumber}`,
          },
        });


        const epVideoNode = await tx.video.create({
  data: {
    durationSeconds: parseInt(episodeDuration) || 0,
    sources: {
      // Changed from a single object to an array of objects
      create: [
        {
          type: "HLS",
          url: `https://customer-media.cloudflarestream.com/${episodeVideoId}/manifest/video.m3u8`,
          codec: "hvc1",
          audioCodec: "mp4a",
          fps: 23.976,
          aspectRatio: "16:9",
        }
      ],
    },
  },
});

        await tx.episode.create({
          data: {
            seasonId: seasonNode.id,
            episodeNumber: parseInt(episodeNumber),
            title: episodeTitle || `Episode ${episodeNumber}`,
            slug: `${slug}-s${seasonNumber}-e${episodeNumber}`,
            description: episodeDescription,
            videoId: epVideoNode.id,
          },
        });
      }

      return content;
    });

    return NextResponse.json({ success: true, contentId: result.id });
  } catch (error: any) {
    console.error("Database Transaction Failure:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}