// app/api/search/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const query = req.nextUrl.searchParams.get("q")?.trim() || "";

    if (!query) {
      return NextResponse.json({
        success: true,
        results: [],
      });
    }

    const results = await prisma.content.findMany({
      where: {
        deletedAt: null,
        status: "PUBLISHED",
        OR: [
          {
            title: {
              contains: query,
              mode: "insensitive",
            },
          },
          {
            description: {
              contains: query,
              mode: "insensitive",
            },
          },
          {
            storyline: {
              contains: query,
              mode: "insensitive",
            },
          },
          {
            keywords: {
              has: query,
            },
          },
          {
            categories: {
              some: {
                category: {
                  name: {
                    contains: query,
                    mode: "insensitive",
                  },
                },
              },
            },
          },
          {
            cast: {
              some: {
                person: {
                  name: {
                    contains: query,
                    mode: "insensitive",
                  },
                },
              },
            },
          },
        ],
      },

      orderBy: [
        {
          popularityScore: "desc",
        },
        {
          trendingScore: "desc",
        },
      ],

      take: 50,

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
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      count: results.length,
      results,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: "Search failed.",
      },
      {
        status: 500,
      }
    );
  }
}