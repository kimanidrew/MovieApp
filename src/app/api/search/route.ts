import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const query = req.nextUrl.searchParams.get("q")?.trim() || "";
    if (!query) return NextResponse.json({ success: true, results: [] });

    const content = await prisma.content.findMany({
      where: {
        status: { in: ["PUBLISHED", "READY"] },
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
          { storyline: { contains: query, mode: "insensitive" } },
          { categories: { some: { category: { name: { contains: query, mode: "insensitive" } } } } },
          { cast: { some: { person: { name: { contains: query, mode: "insensitive" } } } } },
        ],
      },
      orderBy: [{ popularityScore: "desc" }],
      take: 50,
      include: {
        maturityRating: true,
        images: { orderBy: { displayOrder: "asc" } },
        categories: { include: { category: true } },
        movies: { include: { video: { include: { sources: { orderBy: { resolution: "desc" } } } } } },
        show: { include: { seasons: { orderBy: { seasonNumber: "asc" } } } },
      },
    });

    const results = content.map((c: any) => {
      const show = c.show;
      const poster = c.images?.find((i: any) => i.type === "POSTER")?.url || "";
      return {
        id: c.id,
        title: c.title,
        slug: c.slug,
        contentType: show ? "SHOW" : "MOVIE",
        isTvShow: !!show,
        thumbnailUrl: poster,
        releaseYear: c.releaseYear || 0,
        rating: Number(c.popularityScore || 0),
      };
    });

    const matchingGenres = await prisma.category.findMany({
      where: { name: { contains: query, mode: "insensitive" } },
      take: 5,
    }).then((cats) => cats.map((cat) => ({
      id: cat.id,
      title: cat.name,
      slug: cat.slug,
      contentType: "GENRE",
    })));

    return NextResponse.json({ success: true, count: results.length, results: [...matchingGenres, ...results] });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: "Search failed." }, { status: 500 });
  }
}