// ============================================================================
// app/api/homepage/rows/route.ts
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const rows = await prisma.homepageRow.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        displayOrder: "asc",
      },
      include: {
        collection: {
          include: {
            items: {
              orderBy: {
                displayOrder: "asc",
              },
              include: {
                content: {
                  include: {
                    maturityRating: true,
                    categories: {
                      include: {
                        category: true,
                      },
                    },
                    images: {
                      orderBy: {
                        displayOrder: "asc",
                      },
                    },
                    movies: {
                      include: {
                        video: {
                          include: {
                            sources: {
                              orderBy: {
                                resolution: "desc",
                              },
                            },
                          },
                        },
                      },
                    },
                    show: {
                      include: {
                        seasons: {
                          orderBy: {
                            seasonNumber: "asc",
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    const formattedRows = rows.map((row) => ({
      id: row.id,
      title: row.title,
      renderStyle: row.renderStyle,
      sourceType: row.sourceType,

      items:
        row.collection?.items.map((item) => {
          const content = item.content;

          const poster =
            content.images.find((i) => i.type === "POSTER")?.url ?? null;

          const backdrop =
            content.images.find((i) => i.type === "BACKDROP")?.url ?? poster;

          const logo =
            content.images.find((i) => i.type === "LOGO")?.url ?? null;

          const movie = content.movies[0];

          return {
            id: content.id,
            title: content.title,
            slug: content.slug,
            description: content.description,
            storyline: content.storyline,
            releaseYear: content.releaseYear,
            maturityRating: content.maturityRating.code,

            poster,
            backdrop,
            logo,

            categories: content.categories.map(
              (c) => c.category.name,
            ),

            type: movie ? "MOVIE" : "SHOW",

            videoId: movie?.video.id ?? null,
            duration: movie?.durationTotal ?? null,

            popularityScore: content.popularityScore,
            playCount: Number(content.playCount),
            viewCount: Number(content.viewCount),
          };
        }) ?? [],
    }));

    return NextResponse.json(formattedRows);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Failed to load homepage rows",
      },
      {
        status: 500,
      },
    );
  }
}