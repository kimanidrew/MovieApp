// app/api/watch-history/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { profileId, videoId, lastTime, isFinished } = body;

    if (!profileId || !videoId) {
      return NextResponse.json(
        {
          success: false,
          error: "profileId and videoId are required",
        },
        {
          status: 400,
        }
      );
    }

    const history = await prisma.watchHistory.upsert({
      where: {
        profileId_videoId: {
          profileId,
          videoId,
        },
      },
      update: {
        lastTime: Number(lastTime ?? 0),
        isFinished: Boolean(isFinished),
        completedAt: isFinished ? new Date() : null,
      },
      create: {
        profileId,
        videoId,
        lastTime: Number(lastTime ?? 0),
        isFinished: Boolean(isFinished),
        completedAt: isFinished ? new Date() : null,
      },
      include: {
        video: true,
      },
    });

    return NextResponse.json({
      success: true,
      history,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to update watch history.",
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
          error: "profileId is required",
        },
        {
          status: 400,
        }
      );
    }

    const history = await prisma.watchHistory.findMany({
      where: {
        profileId,
      },
      orderBy: {
        updatedAt: "desc",
      },
      include: {
        video: {
          include: {
            movie: {
              include: {
                content: true,
              },
            },
            episode: {
              include: {
                season: {
                  include: {
                    show: {
                      include: {
                        content: true,
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

    return NextResponse.json({
      success: true,
      history,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to load watch history.",
      },
      {
        status: 500,
      }
    );
  }
}