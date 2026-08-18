import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRole, CONTENT_MANAGEMENT_ROLES } from "@/lib/admin-auth";

export async function GET(request: Request) {
  try {
    const { user, error } = await requireRole(request, CONTENT_MANAGEMENT_ROLES);
    if (error) return error;

    const languages = await prisma.languageRegistry.findMany({
      orderBy: { name: "asc" },
      select: { id: true, iso6391: true, name: true, nativeName: true },
    });

    return NextResponse.json(languages);
  } catch (error) {
    console.error("Fetch languages error:", error);
    return NextResponse.json({ error: "Failed to fetch languages" }, { status: 500 });
  }
}