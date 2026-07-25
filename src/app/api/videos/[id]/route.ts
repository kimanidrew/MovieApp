import { NextRequest, NextResponse } from "next/server";
import { getVideoById } from "@/lib/videoService";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const season = searchParams.get("season") || undefined;
    const ep = searchParams.get("ep") || searchParams.get("episode") || undefined;

    const video = await getVideoById(id, { season, ep });
    return NextResponse.json(video);
  } catch (error) {
    console.error("API Error in /api/videos/[id]:", error);
    return NextResponse.json({ error: "Failed to fetch video" }, { status: 500 });
  }
}

