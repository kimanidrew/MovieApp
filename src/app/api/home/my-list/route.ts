import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const profileId = req.nextUrl.searchParams.get("profileId");
    if (!profileId) return NextResponse.json({ success: false, error: "profileId missing" }, { status: 400 });

    const myList = await prisma.myList.findMany({
      where: { profileId },
      orderBy: { createdAt: "desc" },
      include: {
        content: {
          include: {
            maturityRating: true,
            images: { orderBy: { displayOrder: "asc" } }
          }
        }
      }
    });

    return NextResponse.json({ success: true, items: myList.map(m => m.content) });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to load watch list" }, { status: 500 });
  }
}