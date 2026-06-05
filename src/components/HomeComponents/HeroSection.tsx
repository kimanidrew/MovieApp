"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Video } from "@/types/video";
import { normalizeUrl } from "@/utils/normalizeUrl";

export default function HeroSection({
  heroVideo,
  isContinueWatching,
  onOpen,
}: {
  heroVideo: Video;
  isContinueWatching: (id: string) => boolean;
  onOpen: (v: Video) => void;
}) {
  const [imageError, setImageError] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);

  // Read matching localStorage session keys to derive exact video continuation metrics
  useEffect(() => {
    try {
      const history = JSON.parse(
        localStorage.getItem("movieflix-history") || "{}",
      );
      const savedItem = history[heroVideo.id];
      if (savedItem && savedItem.duration > 0 && savedItem.time > 5) {
        const percentage = Math.min(
          100,
          (savedItem.time / savedItem.duration) * 100,
        );
        // Only render the bar if the video qualifies for "Continue Watching" threshold parameters
        if (percentage < 95) {
          setVideoProgress(percentage);
        }
      }
    } catch {
      setVideoProgress(0);
    }
  }, [heroVideo.id]);

  return (
    <>
      <section className="hero-section">
        {/* BACKGROUND LAYER: AUTO-PLAY STREAM OR PLAIN FALLBACK */}
        {heroVideo.videoUrl ? (
          <video
            src={normalizeUrl(heroVideo.videoUrl)}
            autoPlay
            muted
            loop
            playsInline
            className="hero-video-bg"
          />
        ) : (
          !imageError && (
            <Image
              src={normalizeUrl(heroVideo.thumbnailUrl)}
              alt=""
              fill
              priority
              quality={90}
              unoptimized
              style={{ objectFit: "cover" }}
              sizes="100vw"
              onError={() => setImageError(true)}
            />
          )
        )}

        {/* CINEMATIC GRADIENT MASK OVERLAYS */}
        <div className="hero-gradient-overlay" />

        {/* HERO CARD CONTAINER */}
        <div className="hero-content-card">
          <h1 className="hero-title">{heroVideo.title}</h1>

          {/* STREAM METADATA BADGES */}
          <div className="hero-meta-row">
            <span className="match-badge">99% Match</span>
            <span className="year-label">
              {heroVideo.releaseYear || "2026"}
            </span>
            <span className="hd-badge">Ultra HD</span>
            <span className="audio-label">Spatial Audio</span>
          </div>

          <p className="hero-description">
            {heroVideo.description ||
              "Immerse yourself in our premium, cutting-edge cinematic experience."}
          </p>

          {/* ACTION NAVIGATION CONTROLS */}
          <div className="action-button-group">
            <Link href={`/watch/${heroVideo.id}`} className="btn-play">
              {isContinueWatching(heroVideo.id)
                ? "🔄 Resume Play"
                : "▶ Play Now"}
            </Link>

            <button onClick={() => onOpen(heroVideo)} className="btn-info">
              ℹ More Details
            </button>
          </div>
        </div>

        {/* 🎞️ PREMIUM BOTTOM EDGE HISTORY PROGRESS BAR */}
        {videoProgress > 0 && (
          <div className="hero-progress-track">
            <div
              className="hero-progress-bar-fill"
              style={{ width: `${videoProgress}%` }}
            />
          </div>
        )}
      </section>

      <style>{`
        .hero-section {
          position: relative;
          height: 85vh;
          width: 100%;
          overflow: hidden;
          background: #0a0a0a;
          font-family: 'Inter', system-ui, sans-serif;
        }

        .hero-video-bg {
          width: 100%;
          height: 100%;
          object-fit: cover;
          opacity: 0.65;
        }

        .hero-gradient-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, #0a0a0a 5%, transparent 45%), 
                      linear-gradient(to right, rgba(10, 10, 10, 0.95) 25%, transparent 75%);
          z-index: 10;
        }

        .hero-content-card {
          position: absolute;
          bottom: 15%;
          left: 4%;
          right: 4%;
          z-index: 20;
        }

        .hero-title {
          font-size: 4rem;
          font-weight: 900;
          line-height: 1.1;
          letter-spacing: -0.03em;
          margin: 0;
          color: #ffffff;
          text-shadow: 0 4px 12px rgba(0, 0, 0, 0.6);
          max-width: 55%;
          display: -webkit-box;
          WebkitLineClamp: 2;
          WebkitBoxOrient: vertical;
          overflow: hidden;
        }

        .hero-meta-row {
          display: flex;
          align-items: center;
          gap: 1.2rem;
          margin: 1.2rem 0;
          color: #b3b3b3;
          font-size: 0.95rem;
        }

        .match-badge {
          color: #00df89;
          font-weight: 700;
          background: rgba(0, 223, 137, 0.1);
          padding: 0.2rem 0.6rem;
          border-radius: 4px;
        }

        .hd-badge {
          border: 1px solid rgba(255, 255, 255, 0.3);
          padding: 0.1rem 0.4rem;
          font-size: 0.75rem;
          border-radius: 3px;
          font-weight: 600;
          color: #fff;
        }

        .hero-description {
          color: #e0e0e0;
          font-size: 1.1rem;
          line-height: 1.6;
          margin: 0;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
          max-width: 50%;
          display: -webkit-box;
          WebkitLineClamp: 3;
          WebkitBoxOrient: vertical;
          overflow: hidden;
        }

        .action-button-group {
          display: flex;
          gap: 1rem;
          margin-top: 2rem;
        }

        .btn-play {
          background: #ffffff;
          color: #000000;
          padding: 0.9rem 2.6rem;
          border-radius: 6px;
          font-weight: 700;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          font-size: 1.05rem;
          box-shadow: 0 4px 15px rgba(255, 255, 255, 0.15);
          border: none;
          cursor: pointer;
          transition: background 0.2s ease, transform 0.2s ease;
        }

        .btn-play:hover {
          background: #e6e6e6;
          transform: translateY(-1px);
        }

        .btn-info {
          background: rgba(255, 255, 255, 0.12);
          color: #fff;
          padding: 0.9rem 2.6rem;
          border-radius: 6px;
          font-weight: 600;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          font-size: 1.05rem;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          cursor: pointer;
          transition: background 0.2s ease, transform 0.2s ease;
        }

        .btn-info:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: translateY(-1px);
        }

        /* 🔄 HARDWARE ACCELERATED PROGRESS TRACK SHEETS */
        .hero-progress-track {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 5px;
          background: rgba(255, 255, 255, 0.12);
          z-index: 30;
        }

        .hero-progress-bar-fill {
          height: 100%;
          background: #e50914;
          box-shadow: 0 0 12px #e50914, 0 0 4px #e50914;
          transition: width 0.4s ease-out;
        }

        @media (max-width: 1024px) {
          .hero-title, .hero-description {
            max-width: 75%;
          }
        }

        @media (max-width: 768px) {
          .hero-title {
            font-size: 2.5rem;
            max-width: 100%;
          }
          .hero-description {
            font-size: 0.95rem;
            max-width: 100%;
          }
          .btn-play, .btn-info {
            padding: 0.75rem 1.8rem;
            font-size: 0.95rem;
          }
          .hero-progress-track {
            height: 4px; /* Slightly thinner accent profile line for mobile viewports */
          }
        }
      `}</style>
    </>
  );
}
