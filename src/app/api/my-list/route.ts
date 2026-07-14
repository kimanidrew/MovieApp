// app/api/my-list/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { profileId, contentId } = body;

    if (!profileId || !contentId) {
      return NextResponse.json(
        {
          success: false,
          error: "profileId and contentId are required.",
        },
        {
          status: 400,
        }
      );
    }

    const exists = await prisma.myListItem.findUnique({
      where: {
        profileId_contentId: {
          profileId,
          contentId,
        },
      },
    });

    if (exists) {
      return NextResponse.json({
        success: true,
        alreadyExists: true,
        item: exists,
      });
    }

    const item = await prisma.myListItem.create({
      data: {
        profileId,
        contentId,
      },
    });

    return NextResponse.json({
      success: true,
      item,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to add to My List.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const profileId = req.nextUrl.searchParams.get("profileId");
    const contentId = req.nextUrl.searchParams.get("contentId");

    if (!profileId || !contentId) {
      return NextResponse.json(
        {
          success: false,
          error: "profileId and contentId are required.",
        },
        {
          status: 400,
        }
      );
    }

    await prisma.myListItem.delete({
      where: {
        profileId_contentId: {
          profileId,
          contentId,
        },
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to remove from My List.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const profileId = req.nextUrl.searchParams.get("profileId");

    if (!profileId) {
      return NextResponse.json(
        {
          success: false,
          error: "profileId is required.",
        },
        {
          status: 400,
        }
      );
    }

    const items = await prisma.myListItem.findMany({
      where: {
        profileId,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        content: {
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
                    sources: true,
                  },
                },
              },
            },

            show: {
              include: {
                seasons: {
                  include: {
                    episodes: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      items,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to load My List.",
      },
      {
        status: 500,
      }
    );
  }
}