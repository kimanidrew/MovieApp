"use client";

import React, { useEffect, useState, useRef } from "react";
import VideoCard from "../Cards/VideoCard";
import { Video } from "@/types/video";

interface VideoGridProps {
  videos: Video[];
  type?: "movies" | "shows" | "home";
  isLoading?: boolean;
}

const ITEMS_PER_ROW = 4; // Matches your grid-template-columns

export default function VideoGrid({ videos, type = "movies", isLoading = false }: VideoGridProps) {
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_ROW);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Reset count when videos array changes
  useEffect(() => {
    setVisibleCount(ITEMS_PER_ROW);
  }, [videos]);

  // Infinite Scroll Logic
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleCount < videos.length) {
          setVisibleCount((prev) => prev + ITEMS_PER_ROW);
        }
      },
      { threshold: 0.1 }
    );

    if (sentinelRef.current) observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [videos.length, visibleCount]);

  // Calculate items to show
  const displayedVideos = videos.slice(0, visibleCount);

  return (
    <>
      <div className="grid-layout">
        {/* Shimmer Effect for Initial Loading */}
        {isLoading ? (
          Array.from({ length: 8 }).map((_, i) => <ShimmerCard key={`shimmer-${i}`} />)
        ) : (
          displayedVideos.map((video) => (
            <VideoCard 
              key={video.id}
              video={video} 
              type={type}
            />
          ))
        )}
      </div>

      {/* Sentinel element to trigger load on scroll */}
      {!isLoading && visibleCount < videos.length && (
        <div ref={sentinelRef} style={{ height: '20px', marginTop: '20px' }} />
      )}

      <style jsx>{`
        .grid-layout { 
          display: grid; 
          grid-template-columns: repeat(5, 1fr); 
          gap: 1.5rem; 
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

const ShimmerCard = () => (
  <div className="shimmer-card">
    <div className="shimmer-thumbnail" />
    <style jsx>{`
      .shimmer-card { 
        width: 100%; 
        aspect-ratio: 16/9; 
        background: #111; 
        border-radius: 8px; 
        overflow: hidden; 
      }
      .shimmer-thumbnail {
        width: 100%; 
        height: 100%;
        background: linear-gradient(90deg, #1a1a1a 0%, #2a2a2a 50%, #1a1a1a 100%);
        background-size: 200% 100%;
        animation: pulse 1.5s infinite ease-in-out;
      }
      @keyframes pulse { 
        0% { background-position: 200% 0; } 
        100% { background-position: -200% 0; } 
      }
    `}</style>
  </div>
);