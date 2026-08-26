import React from "react";
import prisma from "@/lib/prisma";
import LibraryPageClient from "@/components/LibraryPageClient";
import { HomepageItem } from "@/types/homepage";
import { GenreOption } from "@/components/GenreSelector";

export const dynamic = "force-dynamic";

export default async function ShowsPage() {
  let shows: HomepageItem[] = [];
  let genres: GenreOption[] = [];

  try {
    const rawContent = await prisma.content.findMany({
      where: { show: { isNot: null } },
      include: {
        images: true,
        trailers: true,
        maturityRating: true,
        categories: { include: { category: true } },
        cast: { include: { person: true }, orderBy: { displayOrder: "asc" } },
        show: { include: { seasons: { include: { episodes: true } } } },
      },
    });

    const allCategories = await prisma.category.findMany({ orderBy: { name: "asc" } });

    shows = rawContent.map((content): HomepageItem => {
      const showData = content.show;
      const episodes = showData?.seasons.flatMap((s) => s.episodes || []) || [];
      const sortedEpisodes = [...episodes].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      const poster = content.images.find((i) => i.type === "POSTER")?.url || "";

      return {
        id: content.id,
        title: content.title,
        slug: content.slug,
        description: content.description || "",
        releaseYear: content.releaseYear || 0,
        maturityRating: content.maturityRating?.code || "NR",
        createdAt: content.createdAt.toISOString(),
        episodeDates: sortedEpisodes.map((e) => e.createdAt.toISOString()),
        latestEpisodeDate: sortedEpisodes[0]?.createdAt.toISOString() || null,
        thumbnailUrl: poster,
        backdropUrl: content.images.find((i) => i.type === "BACKDROP")?.url || poster,
        trailerUrl: content.trailers[0]?.hlsManifestUrl ?? null,
        categories: content.categories.map((x) => x.category.name),
        cast: content.cast.map((c) => ({ name: c.person.name, character: c.character, displayOrder: c.displayOrder })),
        isTvShow: true,
        seasonCount: showData?.seasons.length || 0,
        popularityScore: Number(content.popularityScore || 0),
        rating: Number(content.popularityScore || 0),
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
            videoUrl: null,
          })),
        })),
      };
    });

    // Filter genres to ONLY those that actually have shows
    const showGenres = new Set<string>();
    shows.forEach((s) => s.categories?.forEach((c) => showGenres.add(c.toLowerCase())));
    genres = allCategories
      .filter((cat) => showGenres.has(cat.name.toLowerCase()))
      .map((cat) => ({ name: cat.name, slug: cat.slug }));

    shows.sort(() => Math.random() - 0.5);
  } catch (err) {
    console.error("Error fetching shows:", err);
  }

  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#000" }}>
      <LibraryPageClient items={shows} genres={genres} type="shows" title="Shows" />
    </main>
  );
}