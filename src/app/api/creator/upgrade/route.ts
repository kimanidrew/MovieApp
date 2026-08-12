import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const currentUser = await getAuthenticatedUser(request);
    if (!currentUser) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const user = await prisma.user.update({
      where: { id: currentUser.id },
      data: { isCreator: true },
      select: { id: true, email: true, role: true, isCreator: true },
    });

    await prisma.creatorProfile.upsert({
      where: { userId: currentUser.id },
      update: { channelName: user.email.split("@")[0] },
      create: { userId: currentUser.id, channelName: user.email.split("@")[0], bio: "New creator on MovieFlix" },
    });

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message || "Unable to activate creator access" }, { status: 500 });
  }
}
