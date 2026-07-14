// app/api/movies/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      contentId,
      videoId,
      cutVariant,
      durationTotal,
    } = body;

    if (!contentId) {
      return NextResponse.json(
        {
          success: false,
          error: "contentId is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (!videoId) {
      return NextResponse.json(
        {
          success: false,
          error: "videoId is required.",
        },
        {
          status: 400,
        },
      );
    }

    const movie = await prisma.movie.create({
      data: {
        content: {
          connect: {
            id: contentId,
          },
        },

        video: {
          connect: {
            id: videoId,
          },
        },

        cutVariant: cutVariant || "Theatrical",

        durationTotal:
          Number(durationTotal) || 0,
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

            images: true,

            trailers: true,

            cast: {
              include: {
                person: true,
              },
            },

            crew: {
              include: {
                person: true,
              },
            },
          },
        },

        video: {
          include: {
            sources: {
              include: {
                regions: true,
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
    });

    return NextResponse.json({
      success: true,
      movie,
    });
  } catch (error: any) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      {
        status: 500,
      },
    );
  }
}

export async function GET() {
  try {
    const movies = await prisma.movie.findMany({
      orderBy: {
        content: {
          releaseYear: "desc",
        },
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

            languages: {
              include: {
                language: true,
              },
            },
          },
        },

        video: {
          include: {
            sources: {
              include: {
                regions: true,
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
    });

    return NextResponse.json(movies);
  } catch (error: any) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      {
        status: 500,
      },
    );
  }
}