import React from "react";
import prisma from "@/lib/prisma";
import PageBackground from "@/components/PageBackground";
import ContentPageClient from "@/components/ContentPageClient";
import { Video } from "@/types/video";

export const dynamic = "force-dynamic";

export default async function MoviesPage() {
  let movies: Video[] = [];
  let categories: string[] = [];

  try {
    const rawContent = await prisma.content.findMany({
      where: {
        movies: { some: {} }
      },
      include: {
        images: true,
        trailers: true,
        maturityRating: true,
        categories: { include: { category: true } },
        cast: { include: { person: true }, orderBy: { displayOrder: "asc" } },
        movies: { include: { video: { include: { sources: true } } } },
      },
    });

    movies = rawContent.map((content): Video => {
      const movieData = content.movies[0];
      
      const randomImage = (type: string) => {
        const filtered = content.images.filter((i) => i.type === type);
        return filtered.length > 0 ? filtered[Math.floor(Math.random() * filtered.length)].url : "";
      };

      return {
        id: content.id,
        title: content.title,
        slug: content.slug,
        description: content.description || "",
        releaseYear: content.releaseYear || 0,
        maturityRating: content.maturityRating?.code || "NR",
        createdAt: content.createdAt.toISOString(),
        thumbnailUrl: randomImage("POSTER"),
        backdropUrl: randomImage("BACKDROP"),
        trailerUrl: content.trailers[0]?.hlsManifestUrl ?? movieData?.video?.sources[0]?.url ?? null,
        categories: content.categories.map((x) => x.category.name),
        cast: content.cast.map((c) => ({ name: c.person.name, character: c.character, displayOrder: c.displayOrder })),
        isTvShow: false,
        videoSources: movieData?.video?.sources.map((s) => ({
          url: s.url,
          quality: s.resolution || "1080p",
        })) || [],
      };
    });

    // Randomize the order of movies
    movies.sort(() => Math.random() - 0.5);

    categories = Array.from(new Set(movies.flatMap((m) => m.categories))).sort();
  } catch (err) {
    console.error("Error fetching movies:", err);
  }

  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <ContentPageClient items={movies} categories={categories} type="movies" />
    </main>
  );
}