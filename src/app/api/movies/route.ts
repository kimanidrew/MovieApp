import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const moviesRaw = await prisma.movie.findMany({
      include: {
        content: {
          include: {
            images: {
              where: { type: 'POSTER' },
              take: 1,
            },
          },
        },
        video: {
          include: {
            sources: {
              where: { type: 'HLS' },
              take: 1,
            },
          },
        },
      },
      orderBy: {
        content: {
          createdAt: 'desc',
        },
      },
    });

    const movies = moviesRaw.map((m) => {
      // If there is no HLS source but there's a videoUrl in the video record, fallback to it
      const hlsSource = m.video.sources[0]?.url || null;
      const videoUrl = m.video.videoUrl || null; 

      return {
        id: m.video.id,
        title: m.content.title,
        description: m.content.description,
        thumbnailUrl: m.content.images[0]?.url || null,
        videoUrl: videoUrl,
        hlsManifestUrl: hlsSource,
        releaseYear: m.content.releaseYear,
      };
    });

    return NextResponse.json(movies);
  } catch (error) {
    console.error('Error fetching movies API:', error);
    return NextResponse.json({ error: 'Failed to fetch movies' }, { status: 500 });
  }
}