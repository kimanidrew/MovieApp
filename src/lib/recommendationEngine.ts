import { prisma } from "@/lib/prisma";

export async function computeRecommendationScores(profileId: string) {
  // 1. Fetch User History
  // We must include the complex relation path to get to Categories
  const history = await prisma.watchHistory.findMany({
    where: { profileId },
    include: {
      video: {
        include: {
          movie: { include: { content: { include: { categories: { include: { category: true } } } } } },
          episode: { include: { season: { include: { show: { include: { content: { include: { categories: { include: { category: true } } } } } } } } } }
        }
      }
    },
    orderBy: { updatedAt: 'desc' },
    take: 20
  });

  // 2. Map Preferred Categories (Genres)
  const preferredCategories = new Map<string, number>();

  history.forEach(h => {
    // Determine if content is Movie or Episode
    const content = h.video.movie?.content || h.video.episode?.season.show.content;
    
    if (content?.categories) {
      content.categories.forEach(cc => {
        const catName = cc.category.name;
        preferredCategories.set(catName, (preferredCategories.get(catName) || 0) + 1);
      });
    }
  });

  // 3. Score Content
  // Fetch all content to rank
  const allContent = await prisma.content.findMany({
    include: { categories: { include: { category: true } } }
  });

  for (const item of allContent) {
    let score = 0;

    // Weight A: Category/Genre Affinity
    // If user watches a category frequently, boost score
    item.categories.forEach(cc => {
      const count = preferredCategories.get(cc.category.name) || 0;
      score += count * 2.0; 
    });

    // Weight B: Popularity Factor
    score += (item.popularityScore || 0) * 0.1;

    // Weight C: Avoid already watched content
    const isWatched = history.some(h => (h.video.movie?.contentId === item.id) || (h.video.episode?.season.show.contentId === item.id));
    if (isWatched) score -= 50.0; // Demote watched content

    // 4. Upsert Recommendation
    await prisma.recommendationScore.upsert({
      where: { 
        profileId_targetContentId: { profileId, targetContentId: item.id } 
      },
      update: { predictedScore: score, reasonCode: "CATEGORY_MATCH" },
      create: { 
        profileId, 
        targetContentId: item.id, 
        predictedScore: score, 
        reasonCode: "CATEGORY_MATCH" 
      }
    });
  }
}