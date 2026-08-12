// app/api/watch-history/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@/app/generated/prisma";

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

    const history = await prisma.$transaction(async (tx) => {
      const existing = await tx.watchHistory.findUnique({
        where: { profileId_videoId: { profileId, videoId } },
      });

      const nextHistory = await tx.watchHistory.upsert({
        where: { profileId_videoId: { profileId, videoId } },
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
        include: { video: true },
      });

      const video = await tx.video.findUnique({
        where: { id: videoId },
        include: {
          movie: { include: { content: true } },
          episode: { include: { season: { include: { show: { include: { content: true } } } } } },
        },
      });

      const content = video?.movie?.content ?? video?.episode?.season?.show?.content;
      if (content && !existing) {
        await tx.content.update({
          where: { id: content.id },
          data: {
            playCount: { increment: 1 },
            viewCount: { increment: 1 },
            watchSeconds: { increment: Math.max(1, Math.floor(Number(lastTime ?? 0))) },
          },
        });

        const creatorProfile = await tx.creatorProfile.findUnique({ where: { userId: content.createdById } });
        if (creatorProfile) {
          await tx.creatorProfile.update({
            where: { id: creatorProfile.id },
            data: { currentBalance: { increment: new Prisma.Decimal("0.10") } },
          });
        }

        await tx.earningsEvent.create({
          data: {
            creatorId: content.createdById,
            contentId: content.id,
            amount: new Prisma.Decimal("0.10"),
            sourceType: "VIEW",
            watchHistoryId: nextHistory.id,
          },
        });
      }

      return nextHistory;
    });

    return NextResponse.json({ success: true, history });
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