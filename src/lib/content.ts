// src/lib/content.ts

import prisma from "@/lib/prisma";
import { slugify } from "@/lib/slug";

export async function generateUniqueContentSlug(
  title: string,
): Promise<string> {
  const baseSlug = slugify(title);

  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const exists = await prisma.content.findUnique({
      where: {
        slug,
      },
      select: {
        id: true,
      },
    });

    if (!exists) {
      return slug;
    }

    counter++;
    slug = `${baseSlug}-${counter}`;
  }
}

export async function generateUniqueSeasonSlug(
  showTitle: string,
  seasonNumber: number,
): Promise<string> {
  const baseSlug = slugify(`${showTitle}-season-${seasonNumber}`);

  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const exists = await prisma.season.findUnique({
      where: {
        slug,
      },
      select: {
        id: true,
      },
    });

    if (!exists) {
      return slug;
    }

    counter++;
    slug = `${baseSlug}-${counter}`;
  }
}

export async function generateUniqueEpisodeSlug(
  showTitle: string,
  seasonNumber: number,
  episodeNumber: number,
  title: string,
): Promise<string> {
  const baseSlug = slugify(
    `${showTitle}-s${seasonNumber}e${episodeNumber}-${title}`,
  );

  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const exists = await prisma.episode.findUnique({
      where: {
        slug,
      },
      select: {
        id: true,
      },
    });

    if (!exists) {
      return slug;
    }

    counter++;
    slug = `${baseSlug}-${counter}`;
  }
}