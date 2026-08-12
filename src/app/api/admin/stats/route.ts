import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(request: Request) {
  try {
    const { user, error } = await requireAdmin(request);
    if (error) return error;

    const [totalContent, totalMovies, totalShows, totalUsers, totalProfiles, totalSubscriptions, totalWatchHistory, featuredCount, recentContent] = await Promise.all([
      prisma.content.count(),
      prisma.movie.count(),
      prisma.show.count(),
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.profile.count({ where: { deletedAt: null } }),
      prisma.subscription.count({ where: { status: "ACTIVE" } }),
      prisma.watchHistory.count(),
      prisma.content.count({ where: { isFeatured: true } }),
      prisma.content.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          title: true,
          slug: true,
          status: true,
          isFeatured: true,
          releaseYear: true,
          createdAt: true,
          images: { where: { type: "POSTER" }, take: 1, select: { url: true } },
          movies: { select: { id: true } },
          show: { select: { id: true } },
        },
      }),
    ]);

    return NextResponse.json({
      stats: {
        totalContent,
        totalMovies,
        totalShows,
        totalUsers,
        totalProfiles,
        totalSubscriptions,
        totalWatchHistory,
        featuredCount,
      },
      recentContent: recentContent.map((c: any) => ({
        id: c.id,
        title: c.title,
        slug: c.slug,
        status: c.status,
        isFeatured: c.isFeatured,
        releaseYear: c.releaseYear,
        createdAt: c.createdAt,
        posterUrl: c.images?.[0]?.url || "",
        type: c.movies?.length ? "MOVIE" : c.show ? "SHOW" : "UNKNOWN",
      })),
    });
  } catch (error: any) {
    console.error("Admin stats error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch stats" }, { status: 500 });
  }
}