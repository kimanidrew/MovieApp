import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import prisma from '@/lib/prisma';
import Link from 'next/link';

import VideoGrid from '@/components/VideoGrid';

export const metadata = {
  title: 'Movies - MovieFlix',
  description: 'Explore the vast blockbusters natively hosted in your personalized MovieFlix DB.',
};

export const dynamic = 'force-dynamic';

export default async function MoviesPage() {
  const movies = await prisma.video.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return (
    <main style={{ display: 'flex', flexDirection: 'column' }}>

      <div className="animate-in" style={{ flex: 1, padding: '10rem 4% 4rem' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '3rem', fontWeight: 700 }}>Blockbuster Movies</h1>
        <VideoGrid videos={movies} isTvPage={false} />
      </div>

    </main>
  );
}
