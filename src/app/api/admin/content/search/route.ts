import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRole, CONTENT_MANAGEMENT_ROLES } from "@/lib/admin-auth";

export async function GET(request: Request) {
  try {
    const { user, error } = await requireRole(request, CONTENT_MANAGEMENT_ROLES);
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";

    const contents = await prisma.content.findMany({
      where: {
        status: { in: ["PUBLISHED", "READY"] },
        ...(query ? { title: { contains: query, mode: "insensitive" } } : {}),
      },
      select: {
        id: true,
        title: true,
        slug: true,
        releaseYear: true,
        tmdbId: true,
        show: { select: { id: true } },
        movies: { select: { id: true } },
        images: { where: { type: "POSTER" }, take: 1, select: { url: true } },
      },
      take: 20,
      orderBy: { title: "asc" },
    });

    const formatted = contents.map((item) => ({
      id: item.id,
      title: item.title,
      slug: item.slug,
      releaseYear: item.releaseYear,
      tmdbId: item.tmdbId,
      type: item.movies.length > 0 ? "MOVIE" : "SHOW",
      posterUrl: item.images[0]?.url || "",
    }));

    return NextResponse.json({ results: formatted });
  } catch (error) {
    console.error("Content search error:", error);
    return NextResponse.json({ error: "Failed to search content" }, { status: 500 });
  }
}