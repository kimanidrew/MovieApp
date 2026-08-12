import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { getVideoById } from "@/lib/videoService";
import { canUserWatchContent } from "@/lib/services/entitlementService";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const season = searchParams.get("season") || undefined;
    const ep = searchParams.get("ep") || searchParams.get("episode") || undefined;

    const user = await getAuthenticatedUser(request);
    const profileId = request.cookies.get("profile_id")?.value;

    // Resolve underlying contentId for the video/movie/episode
    let contentId: string = id;
    const movie = await prisma.movie.findFirst({
      where: { OR: [{ id }, { videoId: id }] },
      select: { contentId: true },
    });

    if (movie) {
      contentId = movie.contentId;
    } else {
      const episode = await prisma.episode.findFirst({
        where: { OR: [{ id }, { videoId: id }] },
        include: { season: { include: { show: { select: { contentId: true } } } } },
      });
      if (episode?.season?.show?.contentId) {
        contentId = episode.season.show.contentId;
      }
    }

    // Perform Server-Side Authorization Check
    const entitlement = await canUserWatchContent(user?.id || null, profileId || null, contentId);

    if (!entitlement.canWatch) {
      return NextResponse.json(
        {
          error: "Unauthorized: Content access locked",
          entitlement,
        },
        { status: 403 }
      );
    }

    // Fetch video sources
    const video = await getVideoById(id, { season, ep });

    // Filter video sources based on entitlement allowedMaxResolution
    const allowedResolutionRank: Record<string, number> = {
      P240: 1,
      P360: 2,
      P480: 3,
      P720: 4,
      P1080: 5,
      UHD_4K: 6,
      UHD_8K: 7,
    };

    const maxRank = allowedResolutionRank[entitlement.allowedMaxResolution || "P1080"] || 5;

    const filteredSources = (video.sources || []).filter((src: any) => {
      const srcRank = allowedResolutionRank[src.resolution] || 5;
      return srcRank <= maxRank;
    });

    // Return authorized video stream payload with temporary playback token
    const playbackToken = `TOKEN_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

    return NextResponse.json({
      ...video,
      sources: filteredSources,
      playbackToken,
      adsEnabled: entitlement.adsEnabled ?? true,
      entitlement,
    });
  } catch (error) {
    console.error("API Error in /api/videos/[id]:", error);
    return NextResponse.json({ error: "Failed to fetch authorized video stream" }, { status: 500 });
  }
}
