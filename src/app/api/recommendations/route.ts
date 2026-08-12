import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get("videoId");
  const profileId = searchParams.get("profileId");

  if (!videoId) return NextResponse.json({ recommendations: [] });

  try {
    // 1. Try to find personalized recommendations
    let recommendations = await prisma.recommendationScore.findMany({
      where: { profileId: profileId || "" },
      orderBy: { predictedScore: "desc" },
      take: 6,
      include: { targetContent: true },
    });

    // 2. Fallback: If no recommendations exist for this user, get popular content
    if (recommendations.length === 0) {
      const popular = await prisma.content.findMany({
        orderBy: { popularityScore: "desc" },
        take: 6,
      });
      return NextResponse.json({ recommendations: popular });
    }

    return NextResponse.json({ 
      recommendations: recommendations.map(r => r.targetContent) 
    });
  } catch (error) {
    console.error("Recommendation fetch error:", error);
    return NextResponse.json({ recommendations: [] }, { status: 500 });
  }
}