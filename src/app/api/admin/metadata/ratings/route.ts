import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // Adjust this import to your prisma client path

export async function GET() {
  try {
    const ratings = await prisma.maturityRating.findMany({
      orderBy: { severityRank: 'asc' },
    });
    return NextResponse.json(ratings);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch ratings" }, { status: 500 });
  }
}