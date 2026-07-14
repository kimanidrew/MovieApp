// app/api/videos/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ContentStatus } from "@/app/generated/prisma";

// 👈 GLOBAL POLYFILL: Automatically intercepts BigInt fields and safely flattens them to strings for JSON transfers
if (!(BigInt.prototype as any).toJSON) {
  (BigInt.prototype as any).toJSON = function () {
    return this.toString();
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      type, // "TV_SHOW" | "MOVIE" | "EPISODE"
      title,
      description,
      releaseYear,
      category,
      introStart = 0,
      introEnd = 0,
      videoKey,
      tvShowId,
      seasonNumber,
      episodeNumber,
    } = body;

    // ------------------------------------------------------------------
    // DYNAMIC ADMIN CONTEXT RESOLUTION
    // ------------------------------------------------------------------
    const admin = await prisma.user.findFirst({
      where: { role: "ADMIN" },
    });

    if (!admin) {
      return NextResponse.json(
        { error: "Authorized database administrative user could not be resolved." },
        { status: 500 }
      );
    }

    // Validate global base maturity configuration
    const maturity = await prisma.maturityRating.findFirst();
    if (!maturity) {
      return NextResponse.json(
        { error: "No maturity rating configured." },
        { status: 500 }
      );
    }

    // ------------------------------------------------------------------
    // CATEGORY MANAGEMENT
    // ------------------------------------------------------------------
    let dbCategory = null;
    if (category) {
      dbCategory = await prisma.category.findFirst({
        where: { name: category },
      });

      if (!dbCategory) {
        dbCategory = await prisma.category.create({
          data: {
            name: category,
            slug: category.toLowerCase().replace(/\s+/g, "-"),
          },
        });
      }
    }

    // ------------------------------------------------------------------
    // ACTION 1: CREATE TV SHOW SERIES CONTAINER
    // ------------------------------------------------------------------
    if (type === "TV_SHOW") {
      const content = await prisma.content.create({
        data: {
          title,
          slug: `${title.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`,
          description,
          releaseYear: Number(releaseYear),
          status: ContentStatus.READY,
          maturityRating: { connect: { id: maturity.id } },
          createdBy: { connect: { id: admin.id } },
          updatedBy: { connect: { id: admin.id } },
          show: { create: {} },
          ...(dbCategory && {
            categories: {
              create: {
                category: { connect: { id: dbCategory.id } },
              },
            },
          }),
        },
        include: {
          show: true,
        },
      });

      // Will now serialize safely without throwing TypeError
      return NextResponse.json(content);
    }

    // ------------------------------------------------------------------
    // ATTACH MEDIA ASSET SOURCE (Required only for MOVIE & EPISODE)
    // ------------------------------------------------------------------
    if (!videoKey) {
      return NextResponse.json(
        { error: "Missing videoKey parameter for playable media content." },
        { status: 400 }
      );
    }

    const video = await prisma.video.create({
      data: {
        durationSeconds: 0,
        introStart: Number(introStart),
        introEnd: Number(introEnd),
        sources: {
          create: {
            url: `https://customer-xxxx.cloudflarestream.com/${videoKey}/manifest/video.m3u8`,
            codec: "h264",
            audioCodec: "aac",
            fps: 24,
            aspectRatio: "16:9",
          },
        },
      },
    });

    // ------------------------------------------------------------------
    // ACTION 2: INGEST FEATURE FILM (MOVIE)
    // ------------------------------------------------------------------
    if (type === "MOVIE") {
      const content = await prisma.content.create({
        data: {
          title,
          slug: `${title.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`,
          description,
          releaseYear: Number(releaseYear),
          status: ContentStatus.READY,
          maturityRating: { connect: { id: maturity.id } },
          createdBy: { connect: { id: admin.id } },
          updatedBy: { connect: { id: admin.id } },
          movies: {
            create: {
              durationTotal: 0,
              video: { connect: { id: video.id } },
            },
          },
          ...(dbCategory && {
            categories: {
              create: {
                category: { connect: { id: dbCategory.id } },
              },
            },
          }),
        },
      });

      return NextResponse.json(content);
    }

    // ------------------------------------------------------------------
    // ACTION 3: INGEST INDIVIDUAL EPISODE
    // ------------------------------------------------------------------
    if (type === "EPISODE") {
      if (!tvShowId || !seasonNumber || !episodeNumber) {
        return NextResponse.json(
          { error: "Missing lineage mapping fields (tvShowId, seasonNumber, or episodeNumber)." },
          { status: 400 }
        );
      }

      const parentShow = await prisma.show.findUnique({
        where: { id: tvShowId },
      });

      if (!parentShow) {
        return NextResponse.json(
          { error: `Target parent show with ID "${tvShowId}" does not exist.` },
          { status: 404 }
        );
      }

      let season = await prisma.season.findFirst({
        where: {
          showId: parentShow.id,
          seasonNumber: Number(seasonNumber),
        },
      });

      if (!season) {
        season = await prisma.season.create({
          data: {
            seasonNumber: Number(seasonNumber),
            slug: `${parentShow.id}-season-${seasonNumber}`,
            show: { connect: { id: parentShow.id } },
          },
        });
      }

      const episode = await prisma.episode.create({
        data: {
          title,
          slug: `${title.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`,
          episodeNumber: Number(episodeNumber),
          description,
          season: { connect: { id: season.id } },
          video: { connect: { id: video.id } },
        },
      });

      return NextResponse.json(episode);
    }

    return NextResponse.json(
      { error: "Invalid action classification type provided." },
      { status: 400 }
    );

  } catch (error) {
    console.error("Critical core-database ingestion failure:", error);
    return NextResponse.json(
      { error: "Failed to save media metadata structures safely." },
      { status: 500 }
    );
  }
}