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
    const rawMovies = await prisma.movie.findMany({
      include: {
        content: {
          include: {
            images: true,
            trailers: true,
            maturityRating: true,
            categories: { include: { category: true } },
            cast: { include: { person: true }, orderBy: { displayOrder: "asc" } },
          },
        },
        video: {
          include: {
            sources: true,
          },
        },
      },
      orderBy: { content: { createdAt: "desc" } },
    });

    movies = rawMovies.map((movie): Video => {
      const content = movie.content;
      const video = movie.video;

      const randomImage = (type: string) => {
        const filtered = content.images.filter((i) => i.type === type);
        return filtered.length > 0 
          ? filtered[Math.floor(Math.random() * filtered.length)].url 
          : "";
      };

      return {
        id: movie.id,
        title: content.title,
        description: content.description || "",
        releaseYear: content.releaseYear || 0,
        thumbnailUrl: randomImage("POSTER"),
        backdropUrl: randomImage("BACKDROP"),
        maturityRating: content.maturityRating?.code || "NR",
        trailerUrl: content.trailers[0]?.hlsManifestUrl ?? null,
        categories: content.categories.map((x) => x.category.name),
        cast: content.cast.map((c) => ({
          name: c.person.name,
          character: c.character,
        })),
        videoSources: video.sources.map((s) => ({
          url: s.url,
          // Map the Prisma enum/string to the quality string expected by the interface
          quality: s.resolution || "1080p",
        })),
      };
    });

    categories = Array.from(new Set(movies.flatMap((m) => m.categories))).sort();
  } catch (err) {
    console.error("Error fetching movies:", err);
  }

  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <PageBackground overlayOpacity={0.82} />
      <ContentPageClient 
        items={movies} 
        categories={categories} 
        type="movie" 
      />
    </main>
  );
}