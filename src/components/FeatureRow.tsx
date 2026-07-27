"use client";

import React, { useEffect, useState, useRef } from "react";
import FeatureCard from "./FeatureCard";
import { Video } from "@/types/video"; // Importing the shared type

export default function FeatureRow({
  title,
  videos,
}: {
  title: string;
  videos: Video[];
}) {
  const [history, setHistory] = useState<any>({});
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);

  useEffect(() => {
    try {
      setHistory(JSON.parse(localStorage.getItem("movieflix-history") || "{}"));
    } catch {}

    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  const handleScroll = () => {
    if (containerRef.current) {
      setShowLeftArrow(containerRef.current.scrollLeft > 10);
    }
  };

  const scroll = (direction: "left" | "right") => {
    if (containerRef.current) {
      const { scrollLeft, clientWidth } = containerRef.current;
      const scrollAmount = clientWidth * 0.8;
      const targetScroll =
        direction === "left"
          ? scrollLeft - scrollAmount
          : scrollLeft + scrollAmount;

      containerRef.current.scrollTo({
        left: targetScroll,
        behavior: "smooth",
      });
    }
  };

  return (
    <>
      <section className="feature-row-section">
        <h2 className="feature-row-title">{title}</h2>

        <div
          className="edge-fade-mask mask-left"
          style={{ opacity: showLeftArrow ? 1 : 0 }}
        />
        <div className="edge-fade-mask mask-right" />

        {showLeftArrow && (
          <button
            className="carousel-arrow arrow-left"
            onClick={() => scroll("left")}
            aria-label="Scroll left"
          >
            ‹
          </button>
        )}

        <button
          className="carousel-arrow arrow-right"
          onClick={() => scroll("right")}
          aria-label="Scroll right"
        >
          ›
        </button>

        <div
          ref={containerRef}
          className="feature-row-container"
          onScroll={handleScroll}
        >
          {videos.map((video, index) => {
            const hist = history[video.id];
            const progress =
              hist && hist.duration > 0
                ? Math.min(100, (hist.time / hist.duration) * 100)
                : 0;

            return (
              <div
                key={`feature-snap-${video.id}`}
                className="feature-snap-item"
              >
                <FeatureCard
                  video={video}
                  index={index}
                  progress={progress}
                  isHovered={hoveredId === video.id}
                  isLoading={isLoading}
                  onHover={() => setHoveredId(video.id)}
                  onLeave={() => setHoveredId(null)}
                  onClick={() => setSelectedVideo(video)}
                />
              </div>
            );
          })}
        </div>
      </section>


      <style jsx>{`
        .feature-row-section { padding: 2rem 0; position: relative; clear: both; }
        .feature-row-title { padding: 0 4%; margin-bottom: 0.25rem; font-size: 1.75rem; font-weight: 800; color: #fff; }
        .feature-row-container { display: flex; gap: 1.5rem; padding: 1.5rem 4% 2.5rem 4%; margin-top: -0.5rem; overflow-x: auto; scrollbar-width: none; scroll-snap-type: x mandatory; }
        .feature-row-container::-webkit-scrollbar { display: none; }
        .feature-snap-item { scroll-snap-align: start; flex-shrink: 0; }
        .edge-fade-mask { position: absolute; top: 0; bottom: 0; width: 5%; pointer-events: none; z-index: 40; transition: opacity 0.3s ease-in-out; }
        .mask-left { left: 0; background: linear-gradient(to right, #0a0a0a 20%, transparent 100%); }
        .mask-right { right: 0; background: linear-gradient(to left, #0a0a0a 20%, transparent 100%); }
        .carousel-arrow { position: absolute; top: 55%; transform: translateY(-50%); width: 56px; height: 120px; background: rgba(20, 20, 20, 0.4); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.04); color: #fff; font-size: 2.5rem; display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 60; }
        .arrow-left { left: 0; border-radius: 0 10px 10px 0; }
        .arrow-right { right: 0; border-radius: 10px 0 0 10px; }
        .carousel-arrow:hover { background: rgba(236, 72, 153, 0.85); box-shadow: 0 0 25px rgba(236, 72, 153, 0.45); }
        @media (max-width: 768px) { .carousel-arrow, .edge-fade-mask { display: none; } }
      `}</style>
    </>
  );
}