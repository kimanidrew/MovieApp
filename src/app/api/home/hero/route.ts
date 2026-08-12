import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get("profileId");

    let maxMaturityOrder = 999;
    if (profileId) {
      const profile = await prisma.profile.findUnique({
        where: { id: profileId },
        include: { maxMaturity: true }
      });
      if (profile?.maxMaturity) maxMaturityOrder = profile.maxMaturity.severityRank;
    }

    const hero = await prisma.content.findFirst({
      where: {
        status: "PUBLISHED",
        maturityRating: { severityRank: { lte: maxMaturityOrder } }
      },
      orderBy: [{ popularityScore: "desc" }],
      include: {
        maturityRating: true,
        images: { orderBy: { displayOrder: "asc" } },
        categories: { include: { category: true } }
      }
    });

    return NextResponse.json({ success: true, hero });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Hero collection failed" }, { status: 500 });
  }
}