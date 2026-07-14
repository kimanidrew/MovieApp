import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const profileId = req.nextUrl.searchParams.get("profileId");
    if (!profileId) return NextResponse.json({ success: false, error: "profileId required" }, { status: 400 });

    const history = await prisma.watchHistory.findMany({
      where: { profileId },
      orderBy: { updatedAt: "desc" },
      take: 15,
      include: {
        video: {
          include: {
            movie: { include: { content: { include: { images: true } } } },
            episode: { include: { season: { include: { show: { include: { content: { include: { images: true } } } } } } } }
          }
        }
      }
    });

    return NextResponse.json({ success: true, items: history });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch watch track" }, { status: 500 });
  }
}