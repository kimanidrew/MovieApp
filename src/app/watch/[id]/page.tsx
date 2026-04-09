import React from 'react';
import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import HlsPlayer from './HlsPlayer';

export default async function WatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const video = await prisma.video.findUnique({
    where: { id }
  });

  if (!video) {
    notFound();
  }

  // Precedence: HLS > MP4 Fallback > Demo Buck Bunny
  const videoSrc = video.hlsManifestUrl || video.videoUrl || "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";

  return (
    <div className="watch-container" style={{ width: '100vw', height: '100vh', background: '#000', position: 'fixed', zIndex: 9999 }}>
      <HlsPlayer
        videoId={video.id}
        src={videoSrc}
        poster={video.thumbnailUrl || undefined}
        title={video.title}
        isProcessing={!video.hlsManifestUrl && !!video.videoUrl}
      />
    </div>
  );
}
