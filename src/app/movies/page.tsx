import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import getBaseUrl from '@/lib/getBaseUrl';
import Link from 'next/link';
import prisma from '@/lib/prisma';

import VideoGrid from '@/components/VideoGrid';

export const metadata = {
  title: 'Movies - MovieFlix',
  description: 'Explore the vast blockbusters natively hosted in your personalized MovieFlix DB.',
};

export const dynamic = 'force-dynamic';

export default async function MoviesPage() {
  const moviesRaw = await prisma.movie.findMany({
    include: {
      content: {
        include: {
          images: {
            where: { type: 'POSTER' },
            take: 1
          }
        }
      },
      video: {
        include: {
          sources: {
            where: { type: 'HLS' },
            take: 1
          }
        }
      }
    },
    orderBy: {
      content: {
        createdAt: 'desc'
      }
    }
  });

  const movies = moviesRaw.map(m => ({
    id: m.video.id,
    title: m.content.title,
    description: m.content.description,
    thumbnailUrl: m.content.images[0]?.url || null,
    hlsManifestUrl: m.video.sources[0]?.url || null,
    releaseYear: m.content.releaseYear
  }));

  return (
    <main style={{ display: 'flex', flexDirection: 'column' }}>

      <div className="animate-in" style={{ flex: 1, padding: '10rem 4% 4rem' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '3rem', fontWeight: 700 }}>Blockbuster Movies</h1>
        <VideoGrid videos={movies} isTvPage={false} />
      </div>

    </main>
  );
}
