import React from "react";
import prisma from "@/lib/prisma";
import LibraryPageClient from "@/components/LibraryPageClient";
import { HomepageItem } from "@/types/homepage";
import { GenreOption } from "@/components/GenreSelector";

export const dynamic = "force-dynamic";

export default async function GenrePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let items: HomepageItem[] = [];
  let genres: GenreOption[] = [];

  try {
    const rawContent = await prisma.content.findMany({
      where: {
        status: { in: ["PUBLISHED", "READY"] },
        categories: { some: { category: { slug } } },
      },
      include: {
        images: true,
        trailers: true,
        maturityRating: true,
        categories: { include: { category: true } },
        cast: { include: { person: true }, orderBy: { displayOrder: "asc" } },
        movies: { include: { video: { include: { sources: true } } } },
        show: { include: { seasons: { include: { episodes: true } } } },
      },
    });

    const allCategories = await prisma.category.findMany({ orderBy: { name: "asc" } });
    genres = allCategories.map((cat) => ({ name: cat.name, slug: cat.slug }));

    items = rawContent.map((c: any): HomepageItem => {
      const movie = c.movies?.[0];
      const show = c.show;
      const poster = c.images.find((i: any) => i.type === "POSTER")?.url || "";
      const backdrop = c.images.find((i: any) => i.type === "BACKDROP")?.url || poster;

      return {
        id: c.id,
        title: c.title,
        slug: c.slug,
        description: c.description || "",
        releaseYear: c.releaseYear || 0,
        maturityRating: c.maturityRating?.code || "NR",
        createdAt: c.createdAt.toISOString(),
        thumbnailUrl: poster,
        backdropUrl: backdrop,
        trailerUrl: c.trailers?.[0]?.hlsManifestUrl ?? null,
        categories: c.categories?.map((x: any) => x.category.name) || [],
        cast: c.cast?.map((x: any) => ({
          name: x.person.name,
          character: x.character,
          displayOrder: x.displayOrder,
        })) || [],
        isTvShow: !!show,
        seasonCount: show?.seasons.length || 0,
        popularityScore: Number(c.popularityScore || 0),
        rating: Number(c.popularityScore || 0),
        videoSources: movie?.video?.sources?.map((s: any) => ({
          url: s.url,
          quality: s.resolution || "1080p",
        })) || [],
      };
    });

    items.sort(() => Math.random() - 0.5);
  } catch (err) {
    console.error("Error fetching genre content:", err);
  }

  const genreName = slug.replace(/-/g, " ");
  const title = genreName.charAt(0).toUpperCase() + genreName.slice(1);

  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#000" }}>
      <LibraryPageClient items={items} genres={genres} type="home" title={title} currentSlug={slug} />
    </main>
  );
}