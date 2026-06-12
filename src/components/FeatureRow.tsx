"use client";

import React, { useEffect, useState, useRef } from "react";
import VideoModal from "./VideoModal";
import FeatureCard from "./FeatureCard";

interface Video {
  id: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  videoUrl?: string | null;
  hlsManifestUrl?: string | null;
  releaseYear: number | null;
}

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
  }, [selectedVideo]);

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

        {/* 🎬 DISSOLVING EDGE GRADIENT MASKS */}
        <div
          className="edge-fade-mask mask-left"
          style={{ opacity: showLeftArrow ? 1 : 0 }}
        />
        <div className="edge-fade-mask mask-right" />

        {/* INTERACTIVE CAROUSEL ARROWS */}
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

        {/* CONTAINER TRACK ENGINE */}
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

      {selectedVideo && (
        <VideoModal
          video={selectedVideo}
          onClose={() => setSelectedVideo(null)}
        />
      )}

      <style>{`
        .feature-row-section {
          padding: 2rem 0;
          position: relative;
          clear: both;
        }

        .feature-row-title {
          padding: 0 4%;
          margin-bottom: 0.25rem;
          font-size: 1.75rem;
          font-weight: 800;
          letter-spacing: -0.03em;
          color: #fff;
          font-family: 'Inter', system-ui, sans-serif;
        }

        .feature-row-container {
          display: flex;
          gap: 1.5rem;
          padding: 1.5rem 4% 2.5rem 4%; 
          margin-top: -0.5rem;
          overflow-x: auto;
          overflow-y: visible;
          scrollbar-width: none;
          scroll-snap-type: x mandatory;
          scroll-behavior: smooth;
        }

        .feature-row-container::-webkit-scrollbar {
          display: none;
        }

        .feature-snap-item {
          scroll-snap-align: start;
          flex-shrink: 0;
        }

        /* 🎨 THEME HARDWARE-ACCELERATED EDGE FADE OVERLAYS */
        .edge-fade-mask {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 5%;
          pointer-events: none; /* Allows user mouse interaction to click right through the mask layer */
          z-index: 40; /* Sits completely flat above scroll rows but below controls/hover scale boundaries */
          transition: opacity 0.3s ease-in-out;
        }

        .mask-left {
          left: 0;
          background: linear-gradient(to right, #0a0a0a 20%, transparent 100%);
        }

        .mask-right {
          right: 0;
          background: linear-gradient(to left, #0a0a0a 20%, transparent 100%);
        }

        /* NAVIGATION ARROWS */
        .carousel-arrow {
          position: absolute;
          top: 55%;
          transform: translateY(-50%);
          width: 56px;
          height: 120px;
          background: rgba(20, 20, 20, 0.4);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.04);
          color: #ffffff;
          font-size: 2.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 60; 
          transition: background 0.2s ease, opacity 0.2s ease, color 0.2s ease, transform 0.2s;
          outline: none;
        }

        .arrow-left {
          left: 0;
          border-radius: 0 10px 10px 0;
        }

        .arrow-right {
          right: 0;
          border-radius: 10px 0 0 10px;
        }

        .carousel-arrow:hover {
          background: rgba(236, 72, 153, 0.85);
          color: #ffffff;
          box-shadow: 0 0 25px rgba(236, 72, 153, 0.45);
        }

        .carousel-arrow:active {
          transform: translateY(-50%) scale(0.95);
        }

        @media (max-width: 768px) {
          .carousel-arrow, .edge-fade-mask {
            display: none; 
          }
          .feature-row-container {
            padding-bottom: 1.5rem;
          }
        }
      `}</style>
    </>
  );
}
