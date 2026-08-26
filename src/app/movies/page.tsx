import React from "react";
import prisma from "@/lib/prisma";
import LibraryPageClient from "@/components/LibraryPageClient";
import { HomepageItem } from "@/types/homepage";
import { GenreOption } from "@/components/GenreSelector";

export const dynamic = "force-dynamic";

export default async function MoviesPage() {
  let movies: HomepageItem[] = [];
  let genres: GenreOption[] = [];

  try {
    const rawContent = await prisma.content.findMany({
      where: { movies: { some: {} } },
      include: {
        images: true,
        trailers: true,
        maturityRating: true,
        categories: { include: { category: true } },
        cast: { include: { person: true }, orderBy: { displayOrder: "asc" } },
        movies: { include: { video: { include: { sources: true } } } },
      },
    });

    const allCategories = await prisma.category.findMany({ orderBy: { name: "asc" } });

    movies = rawContent.map((content): HomepageItem => {
      const movieData = content.movies[0];
      const poster = content.images.filter((i) => i.type === "POSTER");
      const backdrop = content.images.filter((i) => i.type === "BACKDROP");
      const pick = (arr: any[]) => (arr.length ? arr[Math.floor(Math.random() * arr.length)].url : "");

      return {
        id: content.id,
        title: content.title,
        slug: content.slug,
        description: content.description || "",
        releaseYear: content.releaseYear || 0,
        maturityRating: content.maturityRating?.code || "NR",
        createdAt: content.createdAt.toISOString(),
        thumbnailUrl: pick(poster),
        backdropUrl: pick(backdrop),
        trailerUrl: content.trailers[0]?.hlsManifestUrl ?? null,
        categories: content.categories.map((x) => x.category.name),
        cast: content.cast.map((c) => ({ name: c.person.name, character: c.character, displayOrder: c.displayOrder })),
        isTvShow: false,
        popularityScore: Number(content.popularityScore || 0),
        rating: Number(content.popularityScore || 0),
        duration: movieData?.durationTotal || undefined,
      };
    });

    // Filter genres to ONLY those that actually have movies
    const movieGenres = new Set<string>();
    movies.forEach((m) => m.categories?.forEach((c) => movieGenres.add(c.toLowerCase())));
    genres = allCategories
      .filter((cat) => movieGenres.has(cat.name.toLowerCase()))
      .map((cat) => ({ name: cat.name, slug: cat.slug }));

    movies.sort(() => Math.random() - 0.5);
  } catch (err) {
    console.error("Error fetching movies:", err);
  }

  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#000" }}>
      <LibraryPageClient items={movies} genres={genres} type="movies" title="Movies" />
    </main>
  );
}