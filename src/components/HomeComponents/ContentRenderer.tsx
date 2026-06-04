"use client";

import React, { useEffect, useState } from "react";
import { Video } from "@/types/video";
import VideoSection from "./section/VideoSection";
import TrailerSection from "./section/TrailerSection";
import EngagementBlock from "./section/EngagementBlock";
import ShortsSection from "./section/ShortsSection";

export function ContentRenderer({
  videos,
  onSelect,
}: {
  videos: Video[];
  onSelect: (v: Video) => void;
}) {
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Track window scroll coordinates to condition visibility of the layout button
  useEffect(() => {
    const handleWindowScroll = () => {
      if (window.scrollY > 400) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    window.addEventListener("scroll", handleWindowScroll);
    return () => window.removeEventListener("scroll", handleWindowScroll);
  }, []);

  const scrollToTopTrack = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // Define content slices cleanly
  const categories = [
    { title: "Drama Movies", slice: videos.slice(0, 6) },
    { title: "Just For You", slice: videos.slice(2, 8) },
    { title: "Trending Now", slice: videos.slice(1, 10) },
    { title: "Top Picks", slice: videos.slice(3, 12) },
  ];

  const trailers = videos.slice(0, 5);
  const shorts = videos.slice(0, 13);

  // Custom video rows specifically reserved to render inside the dynamic engagement blocks
  const engagementVideos1 = videos.slice(0, 8); // Matches the "Just For You" video data pool
  const engagementVideos2 = videos.slice(0, 12); // Matches the "Top Picks" video data pool

  const layout: React.ReactNode[] = [];

  // 🔥 1. Inject widescreen trailers right at the very beginning before the first row
  layout.push(
    <TrailerSection key="trailers" videos={trailers} onSelect={onSelect} />,
  );

  // 2. Loop through and condition row layers
  categories.forEach((cat, i) => {
    // Only render standard categories as a plain VideoSection if they aren't upgrading to a Feature Row
    if (cat.title !== "Just For You" && cat.title !== "Top Picks") {
      layout.push(
        <VideoSection key={`cat-${i}`} title={cat.title} videos={cat.slice} />,
      );
    }

    // 🔥 Inject first engagement block with the "Just For You" title and slice right after the 2nd loop pass
    if (i === 1) {
      layout.push(
        <EngagementBlock
          key="engagement-1"
          title={`🔥 ${categories[1].title}`}
          videos={engagementVideos1}
          onSelect={onSelect}
        />,
      );
    }

    // 🔥 Inject 9:16 vertical mobile shorts carousel after the 3rd category row
    if (i === 2) {
      layout.push(
        <ShortsSection key="shorts" videos={shorts} onSelect={onSelect} />,
      );
    }

    // 🔥 Inject final engagement retention block with the "Top Picks" title and slice at the very bottom
    if (i === 3) {
      layout.push(
        <EngagementBlock
          key="engagement-2"
          title={`⭐ ${categories[3].title}`}
          videos={engagementVideos2}
          onSelect={onSelect}
        />,
      );
    }
  });

  return (
    <>
      {layout}

      {/* 🚀 PREMIUM FLOATING SCROLL TO TOP TRIGGER BUTTON WITH DYNAMIC TEXT PILL */}
      <button
        className={`scroll-to-top-btn ${showScrollTop ? "visible" : ""}`}
        onClick={scrollToTopTrack}
        aria-label="Scroll back to trailers section"
      >
        <span className="btn-arrow">▲</span>
        <span className="btn-text">Back to Trailers</span>
      </button>

      <style>{`
        .scroll-to-top-btn {
          position: fixed;
          bottom: 32px;
          right: 32px;
          height: 48px;
          padding: 0 20px;
          border-radius: 24px; /* Premium pill structure shape */
          background: rgba(20, 20, 20, 0.65);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: #ffffff;
          font-family: 'Inter', system-ui, sans-serif;
          font-weight: 600;
          font-size: 0.88rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          cursor: pointer;
          z-index: 100;
          opacity: 0;
          pointer-events: none;
          transform: translateY(15px) scale(0.95);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
          transition: opacity 0.3s cubic-bezier(0.25, 1, 0.5, 1),
                      transform 0.3s cubic-bezier(0.25, 1, 0.5, 1),
                      background 0.2s,
                      border-color 0.2s,
                      box-shadow 0.2s;
        }

        .scroll-to-top-btn.visible {
          opacity: 1;
          pointer-events: auto;
          transform: translateY(0) scale(1);
        }

        .btn-arrow {
          font-size: 0.8rem;
          transition: transform 0.2s ease;
        }

        .btn-text {
          letter-spacing: -0.01em;
          white-space: nowrap;
        }

        .scroll-to-top-btn:hover {
          background: #e50914;
          border-color: #e50914;
          box-shadow: 0 0 25px rgba(229, 9, 20, 0.6);
          transform: translateY(-3px);
        }

        .scroll-to-top-btn:hover .btn-arrow {
          transform: translateY(-2px);
        }

        .scroll-to-top-btn:active {
          transform: translateY(0) scale(0.97);
        }

        /* Responsive collapse rules for mobile viewports */
        @media (max-width: 768px) {
          .scroll-to-top-btn {
            bottom: 24px;
            right: 24px;
            width: 46px;
            height: 46px;
            padding: 0;
            border-radius: 50%; /* Collapses back to a perfect arrow circle icon */
          }
          .btn-text {
            display: none; /* Hides textual string context beautifully */
          }
          .btn-arrow {
            font-size: 1rem;
          }
        }
      `}</style>
    </>
  );
}
