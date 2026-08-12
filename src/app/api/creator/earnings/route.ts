import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const currentUser = await getAuthenticatedUser(request);
    if (!currentUser) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const creatorProfile = await prisma.creatorProfile.findUnique({
      where: { userId: currentUser.id },
    });

    if (!creatorProfile) {
      return NextResponse.json({ error: "Creator profile not found" }, { status: 404 });
    }

    const earnings = await prisma.earningsEvent.findMany({
      where: { creatorId: currentUser.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    const payouts = await prisma.creatorPayout.findMany({
      where: { creatorId: currentUser.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json({ creatorProfile, earnings, payouts });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message || "Unable to load earnings" }, { status: 500 });
  }
}
