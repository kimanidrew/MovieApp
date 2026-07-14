// app/api/home/recommended/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const profileId = req.nextUrl.searchParams.get("profileId");

    if (!profileId) {
      return NextResponse.json(
        {
          success: false,
          error: "profileId is required",
        },
        {
          status: 400,
        }
      );
    }

    const recommendations = await prisma.recommendationScore.findMany({
      where: {
        profileId,
      },
      orderBy: {
        predictedScore: "desc",
      },
      take: 40,
      include: {
        targetContent: {
          include: {
            maturityRating: true,

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
                  include: {
                    episodes: {
                      orderBy: {
                        episodeNumber: "asc",
                      },
                    },
                  },
                },
              },
            },
          },
        },

        sourceContent: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      items: recommendations,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to load recommendations.",
      },
      {
        status: 500,
      }
    );
  }
}