import React from "react";
import prisma from "@/lib/prisma";
import PageBackground from "@/components/PageBackground";
import ContentPageClient from "@/components/ContentPageClient";
import { Video } from "@/types/video";

export const dynamic = "force-dynamic";

export default async function GenrePage({ params }: { params: { slug: string } }) {
  let items: Video[] = [];
  let categories: string[] = [];
  let genreName = params.slug.replace(/-/g, " ");

  try {
    const rawContent = await prisma.content.findMany({
      where: {
        status: { in: ["PUBLISHED", "READY"] },
        categories: { some: { category: { slug: params.slug } } },
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

    items = rawContent.map((c: any): Video => {
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
        videoSources: movie?.video?.sources?.map((s: any) => ({
          url: s.url,
          quality: s.resolution || "1080p",
        })) || [],
      };
    });

    categories = Array.from(new Set(items.flatMap((i) => i.categories))).sort();
  } catch (err) {
    console.error("Error fetching genre content:", err);
  }

  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <PageBackground overlayOpacity={0.82} />
      <ContentPageClient items={items} categories={categories} type="home" title={genreName.charAt(0).toUpperCase() + genreName.slice(1)} />
    </main>
  );
}