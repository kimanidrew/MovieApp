import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const videos = await prisma.video.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, count: videos.length, videos });
  } catch (error: any) {
    console.error("Failed to fetch videos for mobile:", error);
    return NextResponse.json(
      { error: "Failed to fetch videos" },
      { status: 500 },
    );
  }
}
