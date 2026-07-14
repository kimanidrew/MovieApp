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
        include: { maturityRating: true }
      });
      if (profile?.maturityRating) maxMaturityOrder = profile.maturityRating.displayOrder;
    }

    const rows = await prisma.homepageRow.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: "asc" },
      include: {
        collection: {
          include: {
            items: {
              where: { content: { maturityRating: { displayOrder: { lte: maxMaturityOrder } } } },
              orderBy: { displayOrder: "asc" },
              include: {
                content: {
                  include: {
                    maturityRating: true,
                    images: { orderBy: { displayOrder: "asc" } },
                    categories: { include: { category: true } }
                  }
                }
              }
            }
          }
        }
      }
    });

    const filteredRows = rows.filter(row => (row.collection?.items?.length ?? 0) > 0);

    return NextResponse.json({ success: true, rows: filteredRows });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: "Row compilation failed" }, { status: 500 });
  }
}