"use client";

import React, { useEffect, useState } from "react"; // Added useEffect
import VideoModal from "../Modals/VideoModal";
import VideoCard from "../Cards/VideoCard";
import { Video } from "@/types/video";

interface VideoGridProps {
  videos: Video[];
  type?: "movie" | "tv";
}

export default function VideoGrid({ videos, type = "movie" }: VideoGridProps) {
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  // Add this useEffect to log the data whenever a video is selected
  useEffect(() => {
    if (selectedVideo) {
      console.log("Selected video data:", selectedVideo);
    }
  }, [selectedVideo]);

  return (
    <>
      <div className="grid-layout">
        {videos.map((video) => (
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
          videos={videos}
          type={type}
          onClose={() => setSelectedVideo(null)} 
        />
      )}

      <style jsx>{`
        .grid-layout { 
          display: grid; 
          grid-template-columns: repeat(4, 1fr); 
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