// src/lib/content-create.ts

import prisma from "@/lib/prisma";
import { generateUniqueContentSlug } from "@/lib/content";

interface CreateContentInput {
  title: string;
  description?: string;
  storyline?: string;
  releaseYear?: number;
  maturityRatingId: string;

  createdById: string;
  updatedById: string;

  imdbId?: string;
  tmdbId?: number;
  tvdbId?: string;
  traktId?: number;

  keywords?: string[];
}

export async function createContent(data: CreateContentInput) {
  const slug = await generateUniqueContentSlug(data.title);

  return prisma.content.create({
    data: {
      title: data.title,
      slug,

      description: data.description,
      storyline: data.storyline,

      releaseYear: data.releaseYear,

      maturityRating: {
        connect: {
          id: data.maturityRatingId,
        },
      },

      createdBy: {
        connect: {
          id: data.createdById,
        },
      },

      updatedBy: {
        connect: {
          id: data.updatedById,
        },
      },

      imdbId: data.imdbId,
      tmdbId: data.tmdbId,
      tvdbId: data.tvdbId,
      traktId: data.traktId,

      keywords: data.keywords ?? [],

      status: "READY",
    },

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
          video: {
            include: {
              sources: true,
            },
          },
        },
      },

      show: {
        include: {
          seasons: {
            include: {
              episodes: {
                include: {
                  video: true,
                },
              },
            },
          },
        },
      },
    },
  });
}