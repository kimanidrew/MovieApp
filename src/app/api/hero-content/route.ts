import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type"); // "movie" or "tv"

  try {
    let whereClause: any = {};
    if (type === "movies") {
      whereClause = { movies: { some: {} } };
    } else if (type === "shows") {
      whereClause = { show: { isNot: null } };
    }

    const count = await prisma.trailer.count({ where: { content: whereClause } });
    if (count === 0) return NextResponse.json({ trailer: null });

    const skip = Math.floor(Math.random() * count);
    const trailers = await prisma.trailer.findMany({
      skip,
      take: 1,
      where: { content: whereClause },
      include: {
        content: {
          include: {
            images: true, // Fetches all images associated with content
            maturityRating: true,
            categories: { include: { category: true } },
            show: {
              include: {
                seasons: { include: { episodes: true } }
              }
            }
          }
        }
      },
    });

    const trailer = trailers[0];
    if (!trailer) return NextResponse.json({ trailer: null });

    // Helper to find specific asset URLs
    const getAssetUrl = (type: string) => 
      trailer.content.images.find((img) => img.type === type)?.url || null;

    // Serialize & Flatten data
    const serialized = {
      ...trailer,
      content: {
        ...trailer.content,
        viewCount: trailer.content.viewCount?.toString(),
        watchSeconds: trailer.content.watchSeconds?.toString(),
        
        // Explicitly extract Poster and Backdrop for your components
        posterUrl: getAssetUrl("POSTER"),
        backdropUrl: getAssetUrl("BACKDROP"),
        logoUrl: getAssetUrl("LOGO"),
        
        maturityRating: trailer.content.maturityRating?.code || "NR",
        categories: trailer.content.categories.map((c) => c.category.name),
        
        // Keep the original image array for secondary needs
        images: trailer.content.images.map((img) => ({
          url: img.url,
          type: img.type
        })),

        seasons: trailer.content.show?.seasons.map((season) => ({
          id: season.id,
          seasonNumber: season.seasonNumber,
          title: season.title,
          episodes: season.episodes.map((ep) => ({
            id: ep.id,
            episodeNumber: ep.episodeNumber,
            title: ep.title,
            description: ep.description,
          }))
        })) || []
      }
    };

    return NextResponse.json({ trailer: serialized });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Failed to fetch content" }, { status: 500 });
  }
}