import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized session" }, { status: 401 });
    }

    const rentals = await prisma.rental.findMany({
      where: {
        userId: user.id,
        isActive: true,
        expiresAt: { gt: new Date() },
      },
      include: {
        content: {
          include: { images: true },
        },
      },
      orderBy: { expiresAt: "desc" },
    });

    const formattedRentals = rentals.map((r) => ({
      ...r,
      price: r.price.toString(),
    }));

    return NextResponse.json({ rentals: formattedRentals });
  } catch (error) {
    return NextResponse.json({ error: "Failed to load rentals" }, { status: 500 });
  }
}
