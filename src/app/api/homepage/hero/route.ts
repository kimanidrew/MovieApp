// ============================================================================
// app/api/homepage/hero/route.ts
// ============================================================================

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const hero = await prisma.content.findFirst({
      where: {
        status: "PUBLISHED",
      },
      orderBy: [
        {
          trendingScore: "desc",
        },
        {
          popularityScore: "desc",
        },
      ],
      include: {
        maturityRating: true,

        categories: {
          include: {
            category: true,
          },
        },

        images: true,

        movies: {
          include: {
            video: {
              include: {
                sources: true,
              },
            },
          },
        },

        show: {
          include: {
            seasons: true,
          },
        },

        trailers: true,

        cast: {
          take: 10,
          include: {
            person: true,
          },
        },
      },
    });

    if (!hero) {
      return NextResponse.json(
        {
          error: "No hero content found",
        },
        {
          status: 404,
        },
      );
    }

    const backdrop =
      hero.images.find((i) => i.type === "HERO_ART")?.url ??
      hero.images.find((i) => i.type === "BACKDROP")?.url ??
      hero.images.find((i) => i.type === "POSTER")?.url ??
      null;

    const logo =
      hero.images.find((i) => i.type === "LOGO")?.url ?? null;

    const poster =
      hero.images.find((i) => i.type === "POSTER")?.url ?? null;

    const trailer = hero.trailers[0];

    const movie = hero.movies[0];

    const video =
      movie?.video?.sources.find((s) => s.type === "HLS") ??
      movie?.video?.sources[0];

    return NextResponse.json({
      id: hero.id,
      title: hero.title,
      slug: hero.slug,
      description: hero.description,
      storyline: hero.storyline,

      releaseYear: hero.releaseYear,
      maturityRating: hero.maturityRating.code,

      poster,
      backdrop,
      logo,

      trailer: trailer
        ? {
            id: trailer.id,
            title: trailer.title,
            hls: trailer.hlsManifestUrl,
            duration: trailer.durationSeconds,
          }
        : null,

      video: video
        ? {
            url: video.url,
            resolution: video.resolution,
            codec: video.codec,
          }
        : null,

      categories: hero.categories.map((c) => ({
        id: c.category.id,
        name: c.category.name,
        slug: c.category.slug,
      })),

      cast: hero.cast.map((actor) => ({
        id: actor.person.id,
        name: actor.person.name,
        character: actor.character,
        avatar: actor.person.avatarUrl,
      })),

      type: movie ? "MOVIE" : "SHOW",

      popularityScore: hero.popularityScore,
      trendingScore: hero.trendingScore,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Failed to load hero content",
      },
      {
        status: 500,
      },
    );
  }
}