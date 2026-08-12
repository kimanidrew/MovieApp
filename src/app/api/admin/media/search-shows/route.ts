import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRole, CONTENT_MANAGEMENT_ROLES } from "@/lib/admin-auth";

export async function GET(request: Request) {
  try {
    const { user, error } = await requireRole(request, CONTENT_MANAGEMENT_ROLES);
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query) return NextResponse.json({ results: [] });

    const shows = await prisma.content.findMany({
      where: {
        show: { isNot: null },
        title: { contains: query, mode: "insensitive" },
      },
      select: {
        id: true,
        slug: true,
        title: true,
        tmdbId: true,
        releaseYear: true,
        show: { select: { id: true } },
        images: {
          where: { type: "POSTER" },
          take: 1,
          select: { url: true }
        }
      },
      take: 5,
    });

    const formattedShows = shows.map((item) => ({
      id: item.show?.id,
      contentId: item.id,
      tmdbId: item.tmdbId,
      slug: item.slug,
      title: item.title,
      releaseYear: item.releaseYear,
      posterUrl: item.images[0]?.url || "",
    }));

    return NextResponse.json({ results: formattedShows });
  } catch (error) {
    console.error("Search shows error:", error);
    return NextResponse.json({ error: "Failed to search" }, { status: 500 });
  }
}