import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const rows = await prisma.homepageRow.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: "asc" },
      include: {
        collection: {
          include: {
            items: {
              orderBy: { displayOrder: "asc" },
              include: {
                content: {
                  include: {
                    maturityRating: true,
                    images: { orderBy: { displayOrder: "asc" } },
                    categories: { 
                      include: { 
                        category: true 
                      } 
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    const filteredRows = rows.filter(
      (row) => (row.collection?.items?.length ?? 0) > 0
    );

    return NextResponse.json({ success: true, rows: filteredRows });
  } catch (error) {
    console.error("[HOME_ROWS_GET_ERROR]:", error);
    return NextResponse.json(
      { success: false, error: "Row compilation failed" }, 
      { status: 500 }
    );
  }
}