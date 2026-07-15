import React from 'react';
import Footer from '@/components/Footer';
import getBaseUrl from '@/lib/getBaseUrl';
import Link from 'next/link';
import prisma from '@/lib/prisma';

import VideoGrid from '@/components/VideoGrid';

export const metadata = {
  title: 'TV Shows - MovieFlix',
  description: 'Explore the vast TV catalog hosted in your personalized MovieFlix DB.',
};

export const dynamic = 'force-dynamic';

export default async function TvShowsPage() {
  const showsRaw = await prisma.show.findMany({
    include: {
      content: {
        include: {
          images: {
            where: { type: 'POSTER' },
            take: 1
          }
        }
      },
      seasons: {
        include: {
          episodes: {
            include: {
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
              episodeNumber: 'asc'
            },
            take: 1
          }
        },
        orderBy: {
          seasonNumber: 'asc'
        },
        take: 1
      }
    },
    orderBy: {
      content: {
        createdAt: 'desc'
      }
    }
  });

  const shows = showsRaw.map(s => {
    const firstEpisode = s.seasons[0]?.episodes[0];
    return {
      id: firstEpisode?.video?.id || s.content.id,
      title: s.content.title,
      description: s.content.description,
      thumbnailUrl: s.content.images[0]?.url || null,
      hlsManifestUrl: firstEpisode?.video?.sources[0]?.url || null,
      releaseYear: s.content.releaseYear
    };
  });

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#141414', color: '#fff' }}>
      
      
      <div className="animate-in" style={{ flex: 1, padding: '10rem 4% 4rem' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '3rem', fontWeight: 700 }}>TV Shows</h1>
        <VideoGrid videos={shows} isTvPage={true} />
      </div>

      <Footer />
    </main>
  );
}
