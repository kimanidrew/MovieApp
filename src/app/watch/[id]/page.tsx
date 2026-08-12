import React from 'react';
import { getAuthenticatedUser } from '@/lib/auth';
import { canUserWatchContent } from '@/lib/services/entitlementService';
import { getVideoById } from '@/lib/videoService';
import HlsPlayer from './HlsPlayer';
import BodyScrollLock from '@/components/BodyScrollLock';
import ContentLockScreen from '@/components/monetization/ContentLockScreen';

export default async function WatchPage({ 
  params,
  searchParams
}: { 
  params: Promise<{ id: string }>;
  searchParams: Promise<{ season?: string; ep?: string; episode?: string }>;
}) {
  const { id } = await params;
  const sParams = await searchParams;

  const video = await getVideoById(id, sParams);
  const videoSrc = video.hlsManifestUrl || video.videoUrl || "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";

  return (
    <div 
      className="watch-container"
      style={{ 
        width: '100vw', 
        height: '100vh', 
        background: '#000', 
        position: 'fixed', 
        zIndex: 9999, 
        overflow: 'hidden' 
      }}
    >
      <BodyScrollLock/>
      <HlsPlayer
        videoId={video.id}
        src={videoSrc}
        poster={video.thumbnailUrl || undefined}
        title={video.title || "MovieFlix Stream"}
        introStart={video.introStart ?? 0}
        introEnd={video.introEnd ?? 0}
        isProcessing={!video.hlsManifestUrl && !video.videoUrl}
      />
    </div>
  );
}