import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import prisma from '@/lib/prisma';
import Link from 'next/link';

import VideoGrid from '@/components/VideoGrid';

export const metadata = {
  title: 'TV Shows - MovieFlix',
  description: 'Explore the vast TV catalog hosted in your personalized MovieFlix DB.',
};

export const dynamic = 'force-dynamic';

export default async function TvShowsPage() {
  const shows = await prisma.video.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#141414', color: '#fff' }}>
      <Navbar />
      
      <div className="animate-in" style={{ flex: 1, padding: '10rem 4% 4rem' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '3rem', fontWeight: 700 }}>TV Shows</h1>
        <VideoGrid videos={shows} isTvPage={true} />
      </div>

      <Footer />
    </main>
  );
}
