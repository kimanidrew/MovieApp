import { NextResponse } from "next/server";
import prisma from "@/lib/prisma"; 

export async function GET(request: Request) {
  try {
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
      id: item.show?.id, // The unique Show ID
      contentId: item.id, // The Master Content ID
      tmdbId: item.tmdbId,
      slug: item.slug,   // Required for lookups
      title: item.title,
      releaseYear: item.releaseYear,
      posterUrl: item.images[0]?.url || "",
    }));

    return NextResponse.json({ results: formattedShows });
  } catch (error) {
    return NextResponse.json({ error: "Failed to search" }, { status: 500 });
  }
}