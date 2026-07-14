// app/api/content/[slug]/play/route.ts

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
                episodes: {
                  orderBy: {
                    episodeNumber: "asc",
                  },
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
              },
            },
          },
        },
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

    if (content.movies.length > 0) {
      return NextResponse.json({
        success: true,
        type: "MOVIE",
        video: content.movies[0].video,
      });
    }

    if (
      content.show &&
      content.show.seasons.length > 0 &&
      content.show.seasons[0].episodes.length > 0
    ) {
      return NextResponse.json({
        success: true,
        type: "SHOW",
        season: content.show.seasons[0].seasonNumber,
        episode: content.show.seasons[0].episodes[0].episodeNumber,
        video: content.show.seasons[0].episodes[0].video,
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: "No playable video found.",
      },
      {
        status: 404,
      }
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to load playback.",
      },
      {
        status: 500,
      }
    );
  }
}