// ============================================================================
// app/api/content/[slug]/related/route.ts
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

interface RouteParams {
  params: Promise<{
    slug: string;
  }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams,
) {
  try {
    const { slug } = await params;

    const current = await prisma.content.findUnique({
      where: {
        slug,
      },
      include: {
        categories: true,
      },
    });

    if (!current) {
      return NextResponse.json(
        {
          error: "Content not found",
        },
        {
          status: 404,
        },
      );
    }

    const categoryIds = current.categories.map(
      (c) => c.categoryId,
    );

    const related = await prisma.content.findMany({
      where: {
        id: {
          not: current.id,
        },
        status: "PUBLISHED",

        categories: {
          some: {
            categoryId: {
              in: categoryIds,
            },
          },
        },
      },

      take: 20,

      orderBy: [
        {
          trendingScore: "desc",
        },
        {
          popularityScore: "desc",
        },
      ],

      include: {
        maturityRating: true,

        categories: {
          include: {
            category: true,
          },
        },

        images: true,

        movies: {
          include: {
            video: true,
          },
        },

        show: true,
      },
    });

    return NextResponse.json(
      related.map((content) => ({
        id: content.id,
        slug: content.slug,
        title: content.title,
        description: content.description,
        releaseYear: content.releaseYear,

        maturityRating:
          content.maturityRating.code,

        poster:
          content.images.find(
            (i) => i.type === "POSTER",
          )?.url ?? null,

        backdrop:
          content.images.find(
            (i) => i.type === "BACKDROP",
          )?.url ?? null,

        logo:
          content.images.find(
            (i) => i.type === "LOGO",
          )?.url ?? null,

        categories: content.categories.map(
          (c) => c.category.name,
        ),

        popularityScore:
          content.popularityScore,

        trendingScore:
          content.trendingScore,

        type:
          content.movies.length > 0
            ? "MOVIE"
            : "SHOW",
      })),
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Failed to load related content",
      },
      {
        status: 500,
      },
    );
  }
}