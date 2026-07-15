import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get("profileId");

    // 1. Default to a safe fallback (lowest maturity) if no profile is provided,
    // or set to a very high number if you want to default to unrestricted.
    // Let's assume we restrict to the safest content if no profile is specified.
    let maxMaturityOrder = 0; 

    if (profileId) {
      const profile = await prisma.profile.findUnique({
        where: { id: profileId },
        include: { maturityRating: true }
      });
      
      if (profile?.maturityRating) {
        maxMaturityOrder = profile.maturityRating.displayOrder;
      }
    } else {
      // Fetch the lowest maturity rating displayOrder dynamically as a fallback
      const lowestRating = await prisma.maturityRating.findFirst({
        orderBy: { displayOrder: "asc" }
      });
      if (lowestRating) {
        maxMaturityOrder = lowestRating.displayOrder;
      }
    }

    // 2. Fetch the homepage rows and apply clean, null-safe filtering
    const rows = await prisma.homepageRow.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: "asc" },
      include: {
        collection: {
          include: {
            items: {
              where: {
                content: {
                  isNot: null, // Ensure content exists
                  maturityRating: {
                    // This matches items where the maturity rating is <= maxMaturityOrder
                    displayOrder: { lte: maxMaturityOrder }
                  }
                }
              },
              orderBy: { displayOrder: "asc" },
              include: {
                content: {
                  include: {
                    maturityRating: true,
                    images: { 
                      orderBy: { displayOrder: "asc" } 
                    },
                    categories: { 
                      include: { category: true } 
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    // 3. Filter out rows where the collection contains no valid (filtered) items
    const filteredRows = rows.filter(
      (row) => (row.collection?.items?.length ?? 0) > 0
    );

    return NextResponse.json({ success: true, data: filteredRows });
  } catch (error) {
    console.error("[HOMEPAGE_ROWS_GET_ERROR]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to compile homepage rows" },
      { status: 500 }
    );
  }
}