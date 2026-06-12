"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import Hls from "hls.js";
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
  const [timeLeftText, setTimeLeftText] = useState("");
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  // Controls the 1-minute loop crossfade state
  const [isLoopTransitioning, setIsLoopTransitioning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const thumbnail = heroVideo.thumbnailUrl
    ? normalizeUrl(heroVideo.thumbnailUrl)
    : "/placeholder.jpg";

  // Watch history tracking
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

        if (percentage < 95) {
          setVideoProgress(percentage);

          const remainingSeconds = savedItem.duration - savedItem.time;
          const remainingMinutes = Math.ceil(remainingSeconds / 60);

          if (remainingMinutes > 0) {
            setTimeLeftText(`${remainingMinutes}m left`);
          }
        }
      }
    } catch {
      setVideoProgress(0);
      setTimeLeftText("");
    }
  }, [heroVideo.id]);

  // 1-Minute Advanced Time Constraint with Fade-In / Fade-Out Looping Engine
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !heroVideo.hlsManifestUrl) return;

    const streamUrl = normalizeUrl(heroVideo.hlsManifestUrl);
    let hls: Hls | null = null;

    const handlePlaying = () => {
      setIsVideoPlaying(true);
    };

    // Tracks playback milliseconds to catch the exact loop reset point
    const handleTimeUpdate = () => {
      const loopLimit = 60; // Cut off at exactly 1 minute
      const fadeTime = 1.5; // Start fade-out 1.5 seconds before the loop limit

      // 1. Trigger Fade-Out animation right before hitting the 1-minute ceiling
      if (video.currentTime >= loopLimit - fadeTime && !isLoopTransitioning) {
        setIsLoopTransitioning(true);
      }

      // 2. Hard Reset: Loop end reached, snap back to the beginning
      if (video.currentTime >= loopLimit) {
        video.currentTime = 0;

        // Remove fade-out class to allow the CSS to naturally fade the video back in
        setIsLoopTransitioning(false);
      }
    };

    video.addEventListener("playing", handlePlaying);
    video.addEventListener("timeupdate", handleTimeUpdate);

    if (Hls.isSupported()) {
      hls = new Hls({ maxMaxBufferLength: 8 });
      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch((err) => console.log("Autoplay blocked:", err));
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = streamUrl;
      video.addEventListener("loadedmetadata", () => {
        video.play().catch((err) => console.log("Autoplay blocked:", err));
      });
    }

    return () => {
      video.removeEventListener("playing", handlePlaying);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      if (hls) hls.destroy();
    };
  }, [heroVideo.hlsManifestUrl, isLoopTransitioning]);

  return (
    <>
      <section className="hero-section">
        {/* THUMBNAIL (Visible until the first chunk loads, then fades out completely) */}
        {!imageError && (
          <div
            className={`hero-thumbnail-wrapper ${isVideoPlaying ? "fade-out" : ""}`}
          >
            <Image
              src={thumbnail}
              alt={heroVideo.title}
              fill
              priority
              quality={95}
              unoptimized
              sizes="100vw"
              style={{ objectFit: "cover" }}
              onError={() => setImageError(true)}
            />
          </div>
        )}

        {/* 1-MINUTE SMART LOOP BACKGROUND VIDEO */}
        {heroVideo.hlsManifestUrl && (
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className={`hero-video-bg ${isVideoPlaying ? "active-playing" : ""} ${isLoopTransitioning ? "loop-fade-out" : "loop-fade-in"}`}
            style={{ pointerEvents: "none" }}
          />
        )}

        {/* VIGNETTE SHADOW LAYER */}
        <div className="hero-gradient-overlay" />

        {/* 🆕 AMBIENT LIGHT LAYER FOR FLOATING DOCK */}
        <div className="ambient-glow-layer">
          <div className="glow-orb orb-primary" />
          <div className="glow-orb orb-secondary" />
        </div>

        {/* 🆕 GLASSMORPHIC FLOATING COMMAND DOCK */}
        <div className="hero-content-card glass-dock">
          <div className="dock-badges">
            <span className="premium-match-badge">99% Match</span>
            <span className="tech-badge">4K Ultra HD</span>
            <span className="tech-badge">Spatial Audio</span>
            <span className="year-label">
              {heroVideo.releaseYear || "2026"}
            </span>
          </div>

          <h1 className="hero-title">{heroVideo.title}</h1>

          {videoProgress > 0 && (
            <div className="inline-progress-wrapper">
              <span className="time-left-label">
                {timeLeftText || "Resume"}
              </span>
              <div className="inline-progress-track">
                <div
                  className="inline-progress-fill"
                  style={{ width: `${videoProgress}%` }}
                />
              </div>
            </div>
          )}

          <p className="hero-description">
            {heroVideo.description ||
              "Immerse yourself in our premium cinematic streaming experience."}
          </p>

          <div className="action-button-group">
            <a href={`/watch/${heroVideo.id}`} className="btn-play">
              <svg className="btn-icon" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" fill="currentColor" />
              </svg>
              {isContinueWatching(heroVideo.id) ? "Resume Play" : "Play Now"}
            </a>

            <button onClick={() => onOpen(heroVideo)} className="btn-info">
              <svg className="btn-icon" viewBox="0 0 24 24">
                <path
                  d="M11 17h2v-6h-2v6zm1-15C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v-2h-2v2z"
                  fill="currentColor"
                />
              </svg>
              More Details
            </button>
          </div>
        </div>
      </section>

      <style jsx>{`
        .hero-section {
          position: relative;
          width: 100%;
          height: 100vh;
          overflow: hidden;
          background: #000;
          font-family: "Inter", system-ui, sans-serif;
        }

        /* Thumbnail Layering */
        .hero-thumbnail-wrapper {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          z-index: 2;
          opacity: 1;
          transition: opacity 0.8s cubic-bezier(0.25, 1, 0.5, 1);
        }

        .hero-thumbnail-wrapper.fade-out {
          opacity: 0;
          pointer-events: none;
        }

        /* Background Video Animations */
        .hero-video-bg {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          opacity: 0;
          z-index: 1;
        }

        /* Initial mount fade-in */
        .hero-video-bg.active-playing {
          opacity: 0.65;
        }

        /* Continuous cycle transitions */
        .hero-video-bg.loop-fade-in {
          opacity: 0.65;
          transition: opacity 1.5s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .hero-video-bg.loop-fade-out {
          opacity: 0 !important;
          transition: opacity 1.5s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* Cinematic Vignette Overlay */
        .hero-gradient-overlay {
          position: absolute;
          inset: 0;
          z-index: 10;
          background:
            linear-gradient(to top, #141414 2%, transparent 45%),
            linear-gradient(to right, rgba(20, 20, 20, 0.8) 0%, transparent 60%);
        }

        /* 🆕 AMBIENT LIGHT ORBS */
        .ambient-glow-layer {
          position: absolute;
          left: 5%;
          bottom: 12%;
          width: 600px;
          height: 400px;
          z-index: 15;
          pointer-events: none;
        }

        .glow-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.5;
          animation: orb-breathe 8s infinite alternate ease-in-out;
        }

        .orb-primary {
          width: 350px;
          height: 350px;
          background: #3b82f6;
          top: -20px;
          left: -40px;
          animation-delay: 0s;
        }

        .orb-secondary {
          width: 250px;
          height: 250px;
          background: #ec4899;
          bottom: -20px;
          right: 20px;
          animation-delay: 4s;
        }

        @keyframes orb-breathe {
          0% {
            transform: scale(0.8) translate(10px, 10px);
            opacity: 0.4;
          }
          100% {
            transform: scale(1.1) translate(-20px, -20px);
            opacity: 0.7;
          }
        }

        /* 🆕 FLOATING GLASS DOCK */
        .hero-content-card.glass-dock {
          position: absolute;
          left: 5%;
          top: 50%;
          z-index: 20;
          transform: translateY(-40%);
          animation: dockSlideUp 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;

          padding: 40px;
          max-width: 650px;
        }

        @keyframes dockSlideUp {
          from {
            opacity: 0;
            transform: translateY(-10%);
          }
          to {
            opacity: 1;
            transform: translateY(-40%);
          }
        }

        .dock-badges {
          display: flex;
          gap: 12px;
          margin-bottom: 20px;
          align-items: center;
        }

        .premium-match-badge {
          color: #ffffff;
          font-weight: 800;
          background: linear-gradient(to right, #3b82f6, #ec4899);
          padding: 6px 14px;
          border-radius: 8px;
          font-size: 0.85rem;
          letter-spacing: 0.05em;
          box-shadow: 0 4px 15px rgba(236, 72, 153, 0.3);
        }

        .tech-badge {
          color: #e0e0e0;
          font-size: 0.75rem;
          font-weight: 700;
          border: 1px solid rgba(255, 255, 255, 0.3);
          padding: 4px 10px;
          border-radius: 6px;
        }

        .year-label {
          color: #a0a0a0;
          font-weight: 600;
          font-size: 0.9rem;
          margin-left: auto;
        }

        .hero-title {
          margin: 0 0 16px 0;
          color: #ffffff;
          font-size: 4rem;
          font-weight: 900;
          line-height: 1.1;
          letter-spacing: -0.03em;
          text-shadow: 0 4px 20px rgba(0, 0, 0, 0.6);
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .inline-progress-wrapper {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          background: rgba(0, 0, 0, 0.5);
          padding: 8px 16px;
          border-radius: 12px;
          margin-bottom: 24px;
        }
        .inline-progress-track {
          width: 80px;
          height: 6px;
          border-radius: 99px;
          overflow: hidden;
          background: rgba(255, 255, 255, 0.2);
        }
        .inline-progress-fill {
          height: 100%;
          background: linear-gradient(to right, #3b82f6, #ec4899);
        }
        .time-left-label {
          font-size: 0.85rem;
          font-weight: 700;
          color: #fff;
        }

        .hero-description {
          margin: 0;
          color: #e2e8f0;
          font-size: 1.15rem;
          line-height: 1.6;
          font-weight: 400;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        /* Interactive Premium Glassmorphism Buttons */
        .action-button-group {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-top: 32px;
        }

        .btn-play {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          background: linear-gradient(45deg, #3b82f6, #ec4899, #3b82f6);
          background-size: 200% auto;
          color: #ffffff;
          padding: 16px 36px;
          border-radius: 16px;
          text-decoration: none;
          font-weight: 800;
          font-size: 1.1rem;
          box-shadow: 0 8px 25px rgba(59, 130, 246, 0.4);
          transition: all 0.3s cubic-bezier(0.33, 1, 0.68, 1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          animation:
            shine 4s linear infinite,
            pulseGlow 2.5s infinite alternate;
          overflow: hidden;
        }

        @keyframes shine {
          to {
            background-position: 200% center;
          }
        }
        @keyframes pulseGlow {
          from {
            box-shadow: 0 8px 15px rgba(59, 130, 246, 0.4);
            transform: scale(1);
          }
          to {
            box-shadow: 0 12px 30px rgba(236, 72, 153, 0.6);
            transform: scale(1.02);
          }
        }

        .btn-play:hover {
          transform: scale(1.08) translateY(-4px);
          box-shadow: 0 15px 40px rgba(236, 72, 153, 0.7);
          filter: brightness(1.2);
        }
        .btn-play:active {
          transform: scale(0.95);
        }

        .btn-info {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          background: rgba(255, 255, 255, 0.05);
          color: #ffffff;
          padding: 16px 36px;
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          cursor: pointer;
          font-weight: 700;
          font-size: 1.1rem;
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          position: relative;
          overflow: hidden;
        }
        .btn-info::before {
          content: "";
          position: absolute;
          top: 0;
          left: -100%;
          width: 50%;
          height: 100%;
          background: linear-gradient(
            to right,
            transparent,
            rgba(255, 255, 255, 0.2),
            transparent
          );
          transform: skewX(-25deg);
          transition: 0.5s;
        }
        .btn-info:hover::before {
          left: 125%;
        }
        .btn-info:hover {
          background: rgba(255, 255, 255, 0.15);
          transform: scale(1.05) translateY(-4px);
          border-color: rgba(255, 255, 255, 0.8);
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
        }
        .btn-info:active {
          transform: scale(0.98) translateY(0);
        }

        .btn-icon {
          width: 24px;
          height: 24px;
          flex-shrink: 0;
        }

        /* Responsive Breakpoints */
        @media (max-width: 1200px) {
          .hero-content-card.glass-dock {
            padding: 32px;
            max-width: 550px;
          }
          .hero-title {
            font-size: 3.2rem;
          }
        }
        @media (max-width: 768px) {
          .hero-section {
            height: 100vh;
          }
          .hero-content-card.glass-dock {
            left: 5%;
            right: 5%;
            padding: 24px;
            top: auto;
            bottom: 5%;
            transform: translateY(0);
            animation: none;
          }
          .hero-title {
            font-size: 2.5rem;
          }
          .ambient-glow-layer {
            width: 100%;
            height: 100%;
            bottom: 0;
            left: 0;
          }
          .action-button-group {
            flex-direction: column;
            width: 100%;
          }
          .btn-play,
          .btn-info {
            width: 100%;
          }
        }
      `}</style>
    </>
  );
}
