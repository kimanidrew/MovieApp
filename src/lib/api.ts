// lib/api.ts
import { prisma } from "@/lib/prisma";
import { Video } from "@/types/video";

function mapToVideo(content: any): Video {
  const isTvShow = !!content.show;
  
  return {
    id: content.id,
    title: content.title,
    slug: content.slug,
    description: content.description || "",
    storyline: content.storyline,
    releaseYear: content.releaseYear || 0,
    maturityRating: content.maturityRating?.code || "NR",
    createdAt: content.createdAt.toISOString(),
    status: content.status,
    thumbnailUrl: content.images?.find((img: any) => img.type === "POSTER")?.url || "",
    backdropUrl: content.images?.find((img: any) => img.type === "BACKDROP")?.url || "",
    trailerUrl: content.trailers?.[0]?.hlsManifestUrl || null,
    categories: content.categories?.map((c: any) => c.category.name) || [],
    cast: content.cast?.map((c: any) => ({
      name: c.person.name,
      character: c.character,
      displayOrder: c.displayOrder
    })) || [],
    isTvShow,
    seasons: isTvShow ? content.show.seasons.map((s: any) => ({
      id: s.id,
      seasonNumber: s.seasonNumber,
      title: s.title,
      slug: s.slug,
      episodes: s.episodes.map((e: any) => ({
        id: e.id,
        episodeNumber: e.episodeNumber,
        title: e.title,
        description: e.description,
        createdAt: e.createdAt.toISOString(),
        videoUrl: e.video?.sources?.[0]?.url || null
      }))
    })) : undefined,
    videoSources: !isTvShow && content.movies?.[0]?.video?.sources ? 
      content.movies[0].video.sources.map((s: any) => ({
        url: s.url,
        quality: s.resolution,
        codec: s.codec,
        hdr: s.hdr
      })) : undefined
  };
}

export async function getAllVideos(): Promise<Video[]> {
  const contents = await prisma.content.findMany({
    include: {
      maturityRating: true,
      images: true,
      categories: { include: { category: true } },
      cast: { include: { person: true } },
      trailers: true,
      movies: { include: { video: { include: { sources: true } } } },
      show: { include: { seasons: { include: { episodes: { include: { video: { include: { sources: true } } } } } } } }
    },
    take: 50
  });
  return contents.map(mapToVideo);
}

// 1. Close the getContentById function body properly
export async function getContentById(id: string): Promise<Video | null> {
  const content = await prisma.content.findUnique({
    where: { id },
    include: {
      maturityRating: true,
      images: true,
      categories: { include: { category: true } },
      cast: { include: { person: true } },
      trailers: true,
      movies: { include: { video: { include: { sources: true } } } },
      show: { include: { seasons: { include: { episodes: { include: { video: { include: { sources: true } } } } } } } }
    }
  });

  if (!content) return null;
  return mapToVideo(content);
}

// 2. These exports go OUTSIDE of the functions above
export async function getShowById(id: string): Promise<Video | null> {
  return getContentById(id);
}

export async function getMovieById(id: string): Promise<Video | null> {
  return getContentById(id);
}