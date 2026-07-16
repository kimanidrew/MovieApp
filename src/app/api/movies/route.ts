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
              // Removed the 'take: 1' if you want to check multiple sources 
              // for a fallback, or keep it if you only ever need the first one.
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
      // Accessing sources from the video relation
      const sources = m.video.sources || [];
      const hlsSource = sources.find((s) => s.type === 'HLS')?.url || null;
      
      // Fallback: If you have a specific field for videoUrl on the source 
      // or if it's meant to be the first source found
      const fallbackUrl = sources[0]?.url || null; 

      return {
        id: m.video.id,
        title: m.content.title,
        description: m.content.description,
        thumbnailUrl: m.content.images[0]?.url || null,
        videoUrl: fallbackUrl,
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