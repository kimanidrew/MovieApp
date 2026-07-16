"use client";

import React, { useState, useMemo } from "react";
import VideoModal from "../Modals/VideoModal";
import VideoCard from "../Cards/VideoCard";

// FIX: Added isTvPage to the interface
interface VideoGridProps {
  videos: any[];
  isTvPage?: boolean;
}

export default function VideoGrid({ videos, isTvPage }: VideoGridProps) {
  const [selectedVideo, setSelectedVideo] = useState<any | null>(null);

  const videoList = useMemo(() => {
    return videos.map((v) => ({
      ...v,
      images: v.images || v.content?.images || [], 
      releaseYear: v.content?.releaseYear || 2026,
      trailerUrl: v.trailerUrl || v.content?.trailers?.[0]?.hlsManifestUrl || null,
      videoSource: v.videoSource || v.videoSources?.[0]?.url || null,
      categories: v.categories || [],
    }));
  }, [videos]);

  return (
    <>
      <div className="grid-layout">
        {videoList.map((video) => (
          <VideoCard 
            key={video.id} 
            video={video} 
            onSelect={() => setSelectedVideo(video)} 
          />
        ))}
      </div>

      {selectedVideo && (
        <VideoModal 
          video={selectedVideo} 
          videos={videoList}
          onClose={() => setSelectedVideo(null)} 
        />
      )}

      <style jsx>{`
        .grid-layout { 
          display: grid; 
          grid-template-columns: repeat(3, 1fr); 
          gap: 1rem; 
        }

        @media (max-width: 1024px) {
          .grid-layout { grid-template-columns: repeat(2, 1fr); }
        }

        @media (max-width: 640px) {
          .grid-layout { grid-template-columns: 1fr; }
        }
      `}</style>
    </>
  );
}