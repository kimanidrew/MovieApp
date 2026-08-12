import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, CONTENT_MANAGEMENT_ROLES } from "@/lib/admin-auth";

export async function GET(request: Request) {
  try {
    const { user, error } = await requireRole(request, CONTENT_MANAGEMENT_ROLES);
    if (error) return error;

    const ratings = await prisma.maturityRating.findMany({
      orderBy: { severityRank: "asc" },
    });
    return NextResponse.json(ratings);
  } catch (error) {
    console.error("Failed to fetch ratings:", error);
    return NextResponse.json({ error: "Failed to fetch ratings" }, { status: 500 });
  }
}