import React from "react";
import prisma from "@/lib/prisma";
import PageBackground from "@/components/PageBackground";
import ContentPageClient from "@/components/ContentPageClient";
import { Video } from "@/types/video";

export const dynamic = "force-dynamic";

export default async function TVShowsPage() {
  let shows: Video[] = [];
  let categories: string[] = [];

  try {
    const rawShows = await prisma.show.findMany({
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
        seasons: {
          orderBy: { seasonNumber: "asc" },
          include: {
            episodes: {
              orderBy: { episodeNumber: "asc" },
              include: {
                video: { include: { sources: true } },
              },
            },
          },
        },
      },
      orderBy: { content: { createdAt: "desc" } },
    });

    shows = rawShows.map((show): Video => {
      const content = show.content;

      const randomImage = (type: string) => {
        const filtered = content.images.filter((i) => i.type === type);
        return filtered.length > 0
          ? filtered[Math.floor(Math.random() * filtered.length)].url
          : "";
      };

      return {
        id: show.id,
        title: content.title,
        description: content.description || "",
        releaseYear: content.releaseYear || 0,
        thumbnailUrl: randomImage("POSTER"),
        backdropUrl: randomImage("BACKDROP"),
        maturityRating: content.maturityRating.code,
        trailerUrl: content.trailers[0]?.hlsManifestUrl ?? null,
        categories: content.categories.map((x) => x.category.name),
        cast: content.cast.map((c) => ({
          name: c.person.name,
          character: c.character,
        })),
        seasonCount: show.seasons.length,
        totalEpisodes: show.seasons.reduce((acc, s) => acc + s.episodes.length, 0),
        seasons: show.seasons.map((season) => ({
          id: season.id,
          seasonNumber: season.seasonNumber,
          episodes: season.episodes.map((ep) => ({
            id: ep.id,
            episodeNumber: ep.episodeNumber,
            title: ep.title,
            description: ep.description || "",
            videoUrl: ep.video?.sources[0]?.url || "",
          })),
        })),
      };
    });

    categories = Array.from(new Set(shows.flatMap((s) => s.categories))).sort();
  } catch (err) {
    console.error("Error fetching TV shows:", err);
  }

  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <PageBackground overlayOpacity={0.82} />
      <ContentPageClient items={shows} categories={categories} type="tv" />
    </main>
  );
}