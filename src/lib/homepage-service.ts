import { prisma } from "@/lib/prisma";
import { RowRenderStyle, RowDataSource } from "@/app/generated/prisma";
import { Video } from "@/types/video";
import { HomepageData, HomepageItem, HomepageSection } from "@/types/homepage";

// Content include without the typed images filter to avoid type inference issues
const contentInclude = {
  images: true,
  categories: { include: { category: true } },
  cast: { include: { person: true }, orderBy: { displayOrder: "asc" as const } },
  maturityRating: true,
  trailers: true,
  movies: { include: { video: { include: { sources: true } } } },
  show: { include: { seasons: { include: { episodes: true } } } },
};

export async function getHomepageData(profileId: string): Promise<HomepageData> {
  // 1. Fetch profile info
  const profile = await prisma.profile.findUnique({
    where: { id: profileId },
    include: {
      user: { include: { subscriptions: { include: { plan: true }, orderBy: { createdAt: "desc" as const }, take: 1 } } },
    },
  });

  const profileData = {
    id: profile?.id || profileId,
    name: profile?.name || "Guest",
    avatarUrl: profile?.avatarUrl || null,
    membership: profile?.user?.subscriptions?.[0]?.plan?.name || null,
    role: profile?.user?.role || null,
  };

  // 2. Fetch static rows from DB
  const staticRows = await prisma.homepageRow.findMany({
    where: { isActive: true },
    orderBy: { displayOrder: "asc" as const },
  });

  // 3. Fetch all categories for dynamic rows
  const allCategories = await prisma.category.findMany({ orderBy: { name: "asc" as const } });
  const recommendationRows = await getPersonalizedRecommendationRows(profileId);

  const mixedRows: any[] = [];

  // ALWAYS add a Billboard row so hero content shows on the homepage
  mixedRows.push({
    id: "billboard-hero",
    title: "Featured",
    displayOrder: 10,
    renderStyle: "HERO_BILLBOARD" as RowRenderStyle,
    sourceType: "BILLBOARD" as RowDataSource,
    isActive: true,
    categoryId: null,
    collectionId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Add a "Featured" row from admin-set featured content
  const featuredRow = await getFeaturedRow();
  if (featuredRow) {
    mixedRows.push(featuredRow);
  }

  allCategories.forEach((cat, index) => {
    mixedRows.push({
      id: `cat-${cat.id}`,
      title: cat.name,
      displayOrder: 100 + index,
      renderStyle: "STANDARD_POSTER" as RowRenderStyle,
      sourceType: "CATEGORY_ROW" as RowDataSource,
      isActive: true,
      categoryId: cat.id,
      collectionId: null,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Insert "Because You Watched" row at index * 3 (i.e. after every 3rd category)
    if ((index + 1) % 3 === 0 && recommendationRows.length > 0) {
      mixedRows.push(recommendationRows.shift());
    }
  });

  // Append any remaining recommendation rows at the end
  while (recommendationRows.length > 0) {
    mixedRows.push(recommendationRows.shift());
  }

  const allRows = [...staticRows, ...mixedRows];

  // 4. Resolve all rows into sections
  const resolvedRows = await Promise.all(
    allRows.map(async (row: any) => {
      let content: HomepageItem[] = [];
      let rowSubtitle: string | null = null;

      try {
        // Handle the admin-featured row that carries pre-resolved items
        if (row._featuredItems && row._featuredItems.length > 0) {
          content = row._featuredItems;
        } else {
          switch (row.sourceType) {
            case "BILLBOARD":
              const billboard = await getBillboardContent();
              content = billboard ? [billboard] : [];
              break;
            case "CONTINUE_WATCHING":
              content = await getContinueWatching(profileId);
              break;
            case "CATEGORY_ROW":
              if (row.categoryId) content = await getCategoryContent(row.categoryId);
              break;
            case "SIMILAR_TO_HISTORY":
              const similarData = await getSimilarToWatchHistory(profileId, row.triggerContentId);
              content = similarData.items;
              rowSubtitle = similarData.triggerTitle ? `Because you watched ${similarData.triggerTitle}` : null;
              break;
            case "TRENDING":
              const trending = await prisma.content.findMany({
                where: { status: { in: ["PUBLISHED", "READY"] } },
                orderBy: { popularityScore: "desc" as const },
                take: 15,
                include: contentInclude,
              });
              content = trending.map(mapContentToVideo);
              break;
            case "POPULAR":
              const popular = await prisma.content.findMany({
                where: { status: { in: ["PUBLISHED", "READY"] } },
                orderBy: { viewCount: "desc" as const },
                take: 15,
                include: contentInclude,
              });
              content = popular.map(mapContentToVideo);
              break;
            case "NEW_RELEASES":
              const newReleases = await prisma.content.findMany({
                where: { status: { in: ["PUBLISHED", "READY"] } },
                orderBy: { publishedAt: "desc" as const },
                take: 15,
                include: contentInclude,
              });
              content = newReleases.map(mapContentToVideo);
              break;
            case "RECOMMENDED":
              const recommended = await getRecommendedContent(profileId);
              content = recommended;
              break;
          }
        }
      } catch (error) {
        console.error(`Error loading row ${row.title}:`, error);
      }

      return { ...row, content, rowSubtitle };
    })
  );

  // 5. Build sections from resolved rows (skip empty ones)
  const sections: HomepageSection[] = resolvedRows
    .filter((row: any) => row.content.length > 0)
    .map((row: any) => ({
      id: row.id,
      title: row.title,
      subtitle: row.rowSubtitle,
      type: row.sourceType,
      renderStyle: row.renderStyle,
      items: row.content,
      hasMore: row.content.length >= 15,
      viewAllHref: getViewAllHref(row.sourceType, row.categoryId),
    }));

  // 6. Determine featured content
  const featured = await getFeaturedContent();

  return {
    profile: profileData,
    featured,
    sections,
  };
}

// --- Mapper Helper ---

function mapContentToVideo(c: any): HomepageItem {
  const movie = c.movies?.[0];
  const show = c.show;
  const poster = c.images?.find((i: any) => i.type === 'POSTER')?.url || "";
  const backdrop = c.images?.find((i: any) => i.type === 'BACKDROP')?.url || poster;
  const trailerUrl = c.trailers?.[0]?.hlsManifestUrl || null;

  return {
    id: c.id,
    title: c.title,
    slug: c.slug,
    description: c.description || "",
    releaseYear: c.releaseYear || 0,
    maturityRating: c.maturityRating?.code || "NR",
    createdAt: c.createdAt?.toISOString() || new Date().toISOString(),
    thumbnailUrl: poster,
    backdropUrl: backdrop,
    trailerUrl,
    categories: c.categories?.map((cat: any) => cat.category.name) || [],
    cast: c.cast?.map((cast: any) => ({
      name: cast.person.name,
      character: cast.character,
      displayOrder: cast.displayOrder
    })) || [],
    isTvShow: !!show,
    duration: movie?.durationTotal || undefined,
    videoSources: movie?.video?.sources?.map((s: any) => ({
      url: s.url,
      quality: s.resolution || "1080p",
    })) || [],
    seasons: show?.seasons?.map((s: any) => ({
      id: s.id,
      seasonNumber: s.seasonNumber,
      title: s.title,
      slug: s.slug,
      episodes: s.episodes?.map((e: any) => ({
        id: e.id,
        episodeNumber: e.episodeNumber,
        title: e.title,
        description: e.description,
        createdAt: e.createdAt?.toISOString() || new Date().toISOString(),
        videoUrl: null,
      })) || [],
    })) || [],
  };
}

// --- Helpers ---

function getViewAllHref(sourceType: string, categoryId?: string | null): string | undefined {
  switch (sourceType) {
    case "CATEGORY_ROW":
      return categoryId ? `/movies?category=${categoryId}` : "/movies";
    case "TRENDING":
    case "POPULAR":
    case "NEW_RELEASES":
    case "RECOMMENDED":
    case "CONTINUE_WATCHING":
      return "/movies";
    default:
      return undefined;
  }
}

async function getPersonalizedRecommendationRows(profileId: string) {
  const history = await prisma.watchHistory.findMany({
    where: { profileId },
    orderBy: { updatedAt: "desc" as const },
    take: 3,
    include: {
      video: {
        include: {
          movie: { include: { content: { include: contentInclude } } },
          episode: { include: { season: { include: { show: { include: { content: { include: contentInclude } } } } } } }
        }
      }
    }
  });

  // If there's watch history, create personalized "Because You Watched" rows
  if (history.length > 0) {
    return history.map(h => {
      const content = (h as any).video?.movie?.content || (h as any).video?.episode?.season?.show?.content;
      return {
        id: `rec-${content?.id}`,
        title: content ? `Because You Watched "${content.title}"` : "Because You Watched",
        displayOrder: 999,
        renderStyle: "STANDARD_POSTER" as RowRenderStyle,
        sourceType: "SIMILAR_TO_HISTORY" as RowDataSource,
        isActive: true,
        triggerContentId: content?.id,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    });
  }

  // Fallback: Create a "Because You Watched" row from popular content
  // so the row always appears even without watch history
  const popular = await prisma.content.findMany({
    where: { status: { in: ["PUBLISHED", "READY"] } },
    orderBy: { popularityScore: "desc" as const },
    take: 5,
    include: contentInclude,
  });

  if (popular.length === 0) return [];

  const firstContent = popular[0];
  return [{
    id: "rec-popular-fallback",
    title: `Because You Watched "${firstContent.title}"`,
    displayOrder: 999,
    renderStyle: "STANDARD_POSTER" as RowRenderStyle,
    sourceType: "SIMILAR_TO_HISTORY" as RowDataSource,
    isActive: true,
    triggerContentId: firstContent.id,
    createdAt: new Date(),
    updatedAt: new Date()
  }];
}

async function getBillboardContent(): Promise<Video | null> {
  // Prefer manually featured content, fallback to highest popularity
  // Include READY status since the admin save API creates content as READY
  const c = await prisma.content.findFirst({
    where: { status: { in: ["PUBLISHED", "READY"] }, isFeatured: true },
    orderBy: [{ featuredOrder: "asc" as const }, { popularityScore: "desc" as const }],
    include: contentInclude
  }) || await prisma.content.findFirst({
    where: { status: { in: ["PUBLISHED", "READY"] } },
    orderBy: { popularityScore: "desc" as const },
    include: contentInclude
  });
  return c ? mapContentToVideo(c) : null;
}

async function getFeaturedContent(): Promise<HomepageItem | null> {
  // 1. Use manually featured content if exists (based on admin schema feature flag)
  // Include READY status since the admin save API creates content as READY
  const featured = await prisma.content.findFirst({
    where: { status: { in: ["PUBLISHED", "READY"] }, isFeatured: true },
    orderBy: [{ featuredOrder: "asc" as const }, { popularityScore: "desc" as const }],
    include: contentInclude,
  });

  if (featured) return mapContentToVideo(featured);

  // 2. Fallback: use highest popularity published content
  const popular = await prisma.content.findFirst({
    where: { status: { in: ["PUBLISHED", "READY"] } },
    orderBy: { popularityScore: "desc" as const },
    include: contentInclude,
  });

  return popular ? mapContentToVideo(popular) : null;
}

async function getFeaturedRow() {
  // Fetch all admin-featured content for a dedicated "Featured" row
  const featuredItems = await prisma.content.findMany({
    where: { status: { in: ["PUBLISHED", "READY"] }, isFeatured: true },
    orderBy: [{ featuredOrder: "asc" as const }, { popularityScore: "desc" as const }],
    take: 15,
    include: contentInclude,
  });

  if (featuredItems.length === 0) return null;

  return {
    id: "featured-row",
    title: "Featured",
    displayOrder: 50,
    renderStyle: "WIDE_BACKDROP" as RowRenderStyle,
    sourceType: "CURATED_COLLECTION" as RowDataSource,
    isActive: true,
    categoryId: null,
    collectionId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    _featuredItems: featuredItems.map(mapContentToVideo),
  };
}

async function getContinueWatching(profileId: string): Promise<HomepageItem[]> {
  const history = await prisma.watchHistory.findMany({
    where: { profileId, isFinished: false },
    orderBy: { updatedAt: "desc" as const },
    take: 10,
    include: {
      video: {
        include: {
          movie: { include: { content: { include: contentInclude } } },
          episode: { include: { season: { include: { show: { include: { content: { include: contentInclude } } } } } } },
        },
      },
    },
  });

  return history
    .map((h: any) => {
      const content = h.video?.movie?.content || h.video?.episode?.season?.show?.content;
      if (!content) return null;
      const item = mapContentToVideo(content);
      const duration = h.video?.durationSeconds || 0;
      item.progress = duration > 0 ? Math.min(100, Math.round((h.lastTime / duration) * 100)) : 0;
      item.duration = duration;
      return item;
    })
    .filter(Boolean) as HomepageItem[];
}

async function getCategoryContent(categoryId: string): Promise<HomepageItem[]> {
  const content = await prisma.content.findMany({
    where: { categories: { some: { categoryId } }, status: { in: ["PUBLISHED", "READY"] } },
    take: 15,
    include: contentInclude,
  });
  return content.map(mapContentToVideo);
}

async function getRecommendedContent(profileId: string): Promise<HomepageItem[]> {
  const recommendations = await prisma.recommendationScore.findMany({
    where: { profileId },
    orderBy: { predictedScore: "desc" as const },
    take: 15,
    include: {
      targetContent: { include: contentInclude },
    },
  });

  return recommendations.map((r: any) => mapContentToVideo(r.targetContent));
}

async function getSimilarToWatchHistory(profileId: string, triggerContentId?: string) {
  let watchedContent: any;

  if (triggerContentId) {
    watchedContent = await prisma.content.findUnique({ where: { id: triggerContentId }, include: contentInclude });
  } else {
    const history = await prisma.watchHistory.findFirst({
      where: { profileId },
      orderBy: { updatedAt: "desc" as const },
      include: {
        video: {
          include: {
            movie: { include: { content: { include: contentInclude } } },
            episode: { include: { season: { include: { show: { include: { content: { include: contentInclude } } } } } } }
          }
        }
      }
    });
    watchedContent = (history as any)?.video?.movie?.content || (history as any)?.video?.episode?.season?.show?.content;
  }

  if (!watchedContent) return { items: [], triggerTitle: null };

  const categoryIds = await prisma.contentCategory.findMany({
    where: { contentId: watchedContent.id }
  }).then(list => list.map(c => c.categoryId));

  const similar = await prisma.content.findMany({
    where: {
      categories: { some: { categoryId: { in: categoryIds } } },
      NOT: { id: watchedContent.id },
      status: { in: ["PUBLISHED", "READY"] },
    },
    take: 10,
    include: contentInclude
  });

  return { items: similar.map(mapContentToVideo), triggerTitle: watchedContent.title };
}