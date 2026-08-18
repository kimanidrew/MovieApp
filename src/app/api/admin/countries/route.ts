import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRole, CONTENT_MANAGEMENT_ROLES } from "@/lib/admin-auth";

export async function GET(request: Request) {
  try {
    const { user, error } = await requireRole(request, CONTENT_MANAGEMENT_ROLES);
    if (error) return error;

    const countries = await prisma.country.findMany({
      orderBy: { name: "asc" },
      select: { id: true, isoAlpha2: true, name: true },
    });

    return NextResponse.json(countries);
  } catch (error) {
    console.error("Fetch countries error:", error);
    return NextResponse.json({ error: "Failed to fetch countries" }, { status: 500 });
  }
}