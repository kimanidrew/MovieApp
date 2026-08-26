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
        description: true,
        storyline: true,
        releaseYear: true,
        tmdbId: true,
        imdbId: true,
        popularityScore: true,
        maturityRating: { select: { code: true } },
        categories: { select: { category: { select: { name: true } } } },
        images: { select: { url: true, type: true, displayOrder: true } },
        cast: { select: { character: true, displayOrder: true, person: { select: { name: true } } } },
        crew: { select: { job: true, department: true, person: { select: { name: true } } } },
        trailers: { select: { title: true, hlsManifestUrl: true } },
        show: { select: { id: true } },
      },
      take: 8,
    });

    const formattedShows = shows.map((item) => ({
      id: item.show?.id,
      contentId: item.id,
      tmdbId: item.tmdbId ? item.tmdbId.toString() : "",
      imdbId: item.imdbId || "",
      slug: item.slug,
      title: item.title,
      description: item.description || "",
      storyline: item.storyline || "",
      releaseYear: item.releaseYear ? item.releaseYear.toString() : "2026",
      maturityRatingCode: item.maturityRating?.code || "TV-MA",
      popularityScore: item.popularityScore || 0,
      posterUrl: item.images.find((img) => img.type === "POSTER")?.url || item.images[0]?.url || "",
      backdropUrl: item.images.find((img) => img.type === "BACKDROP")?.url || "",
      categories: item.categories.map((c) => c.category.name),
      images: item.images.map((img) => ({ url: img.url, type: img.type, displayOrder: img.displayOrder })),
      cast: item.cast.map((c) => ({ name: c.person.name, character: c.character, displayOrder: c.displayOrder })),
      crew: item.crew.map((c) => ({ name: c.person.name, job: c.job, department: c.department })),
      trailers: item.trailers.map((t) => ({ title: t.title, hlsManifestUrl: t.hlsManifestUrl })),
    }));

    return NextResponse.json({ results: formattedShows });
  } catch (error) {
    console.error("Search shows error:", error);
    return NextResponse.json({ error: "Failed to search" }, { status: 500 });
  }
}