// app/api/content/[slug]/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const content = await prisma.content.findUnique({
      where: {
        slug,
        deletedAt: null,
      },
      include: {
        maturityRating: true,

        movies: {
          include: {
            video: {
              include: {
                sources: {
                  orderBy: {
                    resolution: "desc",
                  },
                },
                subtitles: {
                  include: {
                    language: true,
                  },
                },
                audioTracks: {
                  include: {
                    language: true,
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
              include: {
                images: true,
                episodes: {
                  orderBy: {
                    episodeNumber: "asc",
                  },
                  include: {
                    video: {
                      include: {
                        sources: true,
                        subtitles: {
                          include: {
                            language: true,
                          },
                        },
                        audioTracks: {
                          include: {
                            language: true,
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

        images: {
          orderBy: {
            displayOrder: "asc",
          },
        },

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

        trailers: true,

        cast: {
          orderBy: {
            displayOrder: "asc",
          },
          include: {
            person: true,
          },
        },

        crew: {
          include: {
            person: true,
          },
        },

        awards: true,
      },
    });

    if (!content) {
      return NextResponse.json(
        {
          success: false,
          error: "Content not found",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json({
      success: true,
      data: content,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch content",
      },
      {
        status: 500,
      }
    );
  }
}