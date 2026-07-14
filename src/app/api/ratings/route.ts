// app/api/ratings/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { profileId, contentId, value } = body;

    if (!profileId || !contentId || !value) {
      return NextResponse.json(
        {
          success: false,
          error: "profileId, contentId and value are required.",
        },
        {
          status: 400,
        }
      );
    }

    const rating = await prisma.rating.upsert({
      where: {
        profileId_contentId: {
          profileId,
          contentId,
        },
      },
      update: {
        value,
      },
      create: {
        profileId,
        contentId,
        value,
      },
    });

    return NextResponse.json({
      success: true,
      rating,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to save rating.",
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

    const ratings = await prisma.rating.findMany({
      where: {
        profileId,
      },
      include: {
        content: {
          include: {
            images: true,
            maturityRating: true,
            categories: {
              include: {
                category: true,
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      ratings,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch ratings.",
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

    await prisma.rating.delete({
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
        error: "Failed to delete rating.",
      },
      {
        status: 500,
      }
    );
  }
}