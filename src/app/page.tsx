import React from 'react';
import HomeClient from './HomeClient';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const allVideos = await prisma.video.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return <HomeClient initialVideos={allVideos} />;
}
