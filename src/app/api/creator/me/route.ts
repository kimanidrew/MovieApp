import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Check if user is a creator
    if (!user.isCreator) {
      return NextResponse.json({ error: "You are not a creator" }, { status: 403 });
    }

    // Get creator profile
    const creatorProfile = await prisma.creatorProfile.findUnique({
      where: { userId: user.id },
    });

    // Get active profile from cookie
    const cookieHeader = request.headers.get("cookie") || "";
    const profileMatch = cookieHeader
      .split(";")
      .map((item) => item.trim())
      .find((item) => item.startsWith("profile_id="));
    const profileId = profileMatch ? decodeURIComponent(profileMatch.slice("profile_id=".length)) : null;

    let activeProfile = null;
    if (profileId) {
      activeProfile = await prisma.profile.findUnique({
        where: { id: profileId },
        include: { settings: true },
      });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        isCreator: user.isCreator,
      },
      creatorProfile,
      activeProfile,
    });
  } catch (error: any) {
    console.error("Creator me API error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}