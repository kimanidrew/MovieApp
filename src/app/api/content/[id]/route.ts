// ============================================================================
// app/api/content/[id]/route.ts
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

// ============================================================================
// GET SINGLE CONTENT
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: RouteContext,
) {
  try {
    const { id } = await params;

    const content = await prisma.content.findUnique({
      where: {
        id,
      },
      include: {
        maturityRating: true,

        categories: {
          include: {
            category: true,
          },
        },

        languages: {
          include: {
            language: true,
          },
        },

        studios: {
          include: {
            studio: true,
          },
        },

        productionCos: {
          include: {
            productionCompany: true,
          },
        },

        countries: {
          include: {
            country: true,
          },
        },

        images: {
          orderBy: {
            displayOrder: "asc",
          },
        },

        trailers: true,

        cast: {
          include: {
            person: true,
          },
          orderBy: {
            displayOrder: "asc",
          },
        },

        crew: {
          include: {
            person: true,
          },
        },

        movies: {
          include: {
            video: {
              include: {
                sources: true,
                subtitles: true,
                audioTracks: true,
              },
            },
          },
        },

        show: {
          include: {
            seasons: {
              include: {
                episodes: {
                  include: {
                    video: {
                      include: {
                        sources: true,
                      },
                    },
                  },
                  orderBy: {
                    episodeNumber: "asc",
                  },
                },
              },
              orderBy: {
                seasonNumber: "asc",
              },
            },
          },
        },
      },
    });

    if (!content) {
      return NextResponse.json(
        {
          error: "Content not found",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json(content);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Failed to fetch content",
      },
      {
        status: 500,
      },
    );
  }
}

// ============================================================================
// UPDATE CONTENT
// ============================================================================

export async function PATCH(
  request: NextRequest,
  { params }: RouteContext,
) {
  try {
    const { id } = await params;

    const body = await request.json();

    const updated = await prisma.content.update({
      where: {
        id,
      },
      data: {
        title: body.title,
        description: body.description,
        storyline: body.storyline,
        releaseYear: body.releaseYear,
        status: body.status,
        popularityScore: body.popularityScore,
        trendingScore: body.trendingScore,
        publishedAt: body.publishedAt
          ? new Date(body.publishedAt)
          : undefined,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Failed to update content",
      },
      {
        status: 500,
      },
    );
  }
}

// ============================================================================
// SOFT DELETE CONTENT
// ============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: RouteContext,
) {
  try {
    const { id } = await params;

    await prisma.content.update({
      where: {
        id,
      },
      data: {
        deletedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Failed to delete content",
      },
      {
        status: 500,
      },
    );
  }
}