"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import { Video } from "@/types/video";
import { normalizeUrl } from "@/utils/normalizeUrl";

export default function ShortsSection({
  videos,
  onSelect,
}: {
  videos: Video[];
  onSelect: (v: Video) => void;
}) {
  const [hoveredShort, setHoveredShort] = useState<string | null>(null);
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});
  const shortsContainerRef = useRef<HTMLDivElement>(null);

  // Smooth carousel shifting algorithm
  const scrollShorts = (direction: "left" | "right") => {
    if (shortsContainerRef.current) {
      const { scrollLeft, clientWidth } = shortsContainerRef.current;
      // Scroll by roughly half the client width for a fluid shifting rhythm
      const offset = direction === "left" ? -clientWidth / 2 : clientWidth / 2;
      shortsContainerRef.current.scrollTo({
        left: scrollLeft + offset,
        behavior: "smooth",
      });
    }
  };

  return (
    <>
      <section className="section-container">
        {/* SHORTS ROW INTERACTIVE HEADER */}
        <div className="shorts-header-row">
          <h2 className="section-heading">Quick Bites & Shorts</h2>
          <div className="carousel-controls">
            <button
              onClick={() => scrollShorts("left")}
              className="arrow-btn"
              aria-label="Scroll left"
            >
              ‹
            </button>
            <button
              onClick={() => scrollShorts("right")}
              className="arrow-btn"
              aria-label="Scroll right"
            >
              ›
            </button>
          </div>
        </div>

        {/* SNAP HORIZONTAL SCROLL TRACK */}
        <div ref={shortsContainerRef} className="shorts-row-scroll">
          {videos.map((video) => {
            const isHovered = hoveredShort === video.id;
            const isImageBroken = brokenImages[video.id];

            return (
              <div
                key={`short-${video.id}`}
                className="vertical-short-card"
                style={{
                  transform: isHovered ? "scale(1.05)" : "scale(1)",
                  boxShadow: isHovered
                    ? "0 12px 30px rgba(0,0,0,0.85)"
                    : "none",
                }}
                onMouseEnter={() => setHoveredShort(video.id)}
                onMouseLeave={() => setHoveredShort(null)}
                onClick={() => onSelect(video)}
              >
                {/* BACKDROP IMAGE CARRIER */}
                {!isImageBroken && (
                  <Image
                    src={normalizeUrl(video.thumbnailUrl)}
                    alt=""
                    fill
                    unoptimized
                    className="short-image-style"
                    style={{
                      transform: isHovered ? "scale(1.1)" : "scale(1)",
                    }}
                    onError={() =>
                      setBrokenImages((p) => ({ ...p, [video.id]: true }))
                    }
                  />
                )}

                {/* AMBIENT GRADIENT & METADATA OVERLAYS */}
                <div className="shorts-gradient-overlay" />

                <div className="shorts-meta-container">
                  <p className="shorts-title-text">{video.title}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <style>{`
        .section-container {
          margin: 3rem 0;
          padding: 0 4%;
          font-family: 'Inter', system-ui, sans-serif;
        }

        .shorts-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .section-heading {
          font-size: 1.75rem;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: #ffffff;
          margin: 0;
        }

        .carousel-controls {
          display: flex;
          gap: 0.5rem;
        }

        .arrow-btn {
          background: rgba(255, 255, 255, 0.08);
          color: #ffffff;
          border: none;
          width: 38px;
          height: 38px;
          border-radius: 50%;
          font-size: 1.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.2s ease, transform 0.2s ease;
        }

        .arrow-btn:hover {
          background: rgba(255, 255, 255, 0.18);
          transform: scale(1.05);
        }

        .shorts-row-scroll {
          display: flex;
          gap: 1.25rem;
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          padding-bottom: 1.5rem;
          scrollbar-width: none; /* Empties standard Firefox scroll track footprint */
        }

        .shorts-row-scroll::-webkit-scrollbar {
          display: none; /* Empties standard Chrome/Safari track footprints */
        }

        .vertical-short-card {
          position: relative;
          flex: 0 0 210px; /* Fixed standard block base width for uniform columns */
          aspect-ratio: 9/16;
          border-radius: 12px;
          overflow: hidden;
          cursor: pointer;
          scroll-snap-align: start;
          background: #141414; /* Crisp fallback grid tone if loading parameters break */
          border: 1px solid rgba(255, 255, 255, 0.03);
          transition: transform 0.25s cubic-bezier(0.25, 1, 0.5, 1), box-shadow 0.25s ease-out;
        }

        .short-image-style {
          object-fit: cover;
          transition: transform 0.4s cubic-bezier(0.25, 1, 0.5, 1);
        }

        .shorts-gradient-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(0, 0, 0, 0.95) 0%, rgba(0, 0, 0, 0.3) 45%, transparent 100%);
          z-index: 1;
          pointer-events: none;
        }

        .shorts-content-badge {
          position: absolute;
          top: 12px;
          left: 12px;
          background: linear-gradient(to right, #3b82f6, #ec4899);
          color: #ffffff;
          padding: 0.2rem 0.5rem;
          border-radius: 4px;
          font-size: 0.72rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          z-index: 2;
          box-shadow: 0 2px 8px rgba(236, 72, 153, 0.4);
        }

        .shorts-meta-container {
          position: absolute;
          bottom: 16px;
          left: 14px;
          right: 14px;
          z-index: 2;
        }

        .shorts-title-text {
          margin: 0;
          color: #ffffff;
          font-size: 0.95rem;
          font-weight: 600;
          line-height: 1.35;
          letter-spacing: -0.01em;
          text-shadow: 0 1px 3px rgba(0, 0, 0, 0.6);
          display: -webkit-box;
          WebkitLineClamp: 2;
          WebkitBoxOrient: vertical;
          overflow: hidden;
        }

        /* Fluid sizing profiles for compact phone resolutions */
        @media (max-width: 480px) {
          .vertical-short-card {
            flex: 0 0 170px;
          }
          .section-heading {
            font-size: 1.4rem;
          }
        }
      `}</style>
    </>
  );
}
