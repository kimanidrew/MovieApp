import React from "react";
import prisma from "@/lib/prisma";
import PageBackground from "@/components/PageBackground";
import ContentPageClient from "@/components/ContentPageClient";
import { Video } from "@/types/video";

export const dynamic = "force-dynamic";

export default async function ShowsPage() {
  let shows: Video[] = [];
  let categories: string[] = [];

  try {
    const rawContent = await prisma.content.findMany({
      where: { show: { isNot: null } },
      include: {
        images: true, trailers: true, maturityRating: true,
        categories: { include: { category: true } },
        cast: { include: { person: true }, orderBy: { displayOrder: "asc" } },
        show: { 
          include: { seasons: { include: { episodes: { include: { video: { include: { sources: true } } } } } } } 
        },
      },
    });

    shows = rawContent.map((content): Video => {
      const showData = content.show;
      const episodes = showData?.seasons.flatMap(s => s.episodes || []) || [];
      
      const sortedEpisodes = [...episodes].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      return {
        id: content.id,
        title: content.title,
        slug: content.slug,
        description: content.description || "",
        releaseYear: content.releaseYear || 0,
        maturityRating: content.maturityRating?.code || "NR",
        createdAt: content.createdAt.toISOString(),
        episodeDates: sortedEpisodes.map(e => e.createdAt.toISOString()), 
        latestEpisodeDate: sortedEpisodes[0]?.createdAt.toISOString() || null,
        thumbnailUrl: content.images.find(i => i.type === "POSTER")?.url || "",
        backdropUrl: content.images.find(i => i.type === "BACKDROP")?.url || "",
        trailerUrl: content.trailers[0]?.hlsManifestUrl ?? null,
        categories: content.categories.map((x) => x.category.name),
        cast: content.cast.map((c) => ({ name: c.person.name, character: c.character, displayOrder: c.displayOrder })),
        isTvShow: true,
        seasonCount: showData?.seasons.length || 0,
        seasons: showData?.seasons.map((s) => ({
          id: s.id,
          seasonNumber: s.seasonNumber,
          slug: s.slug,
          episodes: s.episodes.map((e) => ({
            id: e.id,
            episodeNumber: e.episodeNumber,
            title: e.title,
            description: e.description,
            createdAt: e.createdAt.toISOString(),
            videoUrl: e.video?.sources[0]?.url ?? null,
          })),
        })),
      };
    });

    // Randomize the order of shows
    shows.sort(() => Math.random() - 0.5);

    categories = Array.from(new Set(shows.flatMap((s) => s.categories))).sort();
  } catch (err) {
    console.error("Error fetching shows:", err);
  }

  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <PageBackground overlayOpacity={0.82} />
      <ContentPageClient items={shows} categories={categories} type="shows" />
    </main>
  );
}