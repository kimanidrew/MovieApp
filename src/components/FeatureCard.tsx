"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Hls from "hls.js";
import { normalizeUrl } from "@/utils/normalizeUrl";
import { Video } from "@/types/video"; // Importing the shared type

interface FeatureCardProps {
  video: Video;
  index: number;
  progress: number;
  isHovered: boolean;
  isLoading: boolean;
  onHover: () => void;
  onLeave: () => void;
  onClick: () => void;
}

export default function FeatureCard({
  video,
  index,
  progress,
  isHovered,
  isLoading,
  onHover,
  onLeave,
  onClick,
}: FeatureCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [imageError, setImageError] = useState(false);

  const thumbnail = normalizeUrl(video.thumbnailUrl);

  const dynamicGenres = [
    "Blockbuster",
    "Sci-Fi Prime",
    "Award Winning",
    "Original Series",
    "Trending",
    "New Release",
  ];
  const assignedGenre = dynamicGenres[index % dynamicGenres.length];

  useEffect(() => {
    if (!isHovered || !videoRef.current || isLoading) return;

    const vid = videoRef.current;
    let hls: Hls | null = null;

    // Access properties from the shared Video type
    const rawSrc = (video as any).hlsManifestUrl || video.videoUrl;
    if (!rawSrc) return;
    const src = normalizeUrl(rawSrc);

    vid.muted = true;
    vid.playsInline = true;

    const playVideo = () => {
      vid.currentTime = 2;
      vid.play().catch(() => {});
    };

    if (src.includes(".m3u8")) {
      if (Hls.isSupported()) {
        hls = new Hls();
        hls.loadSource(src);
        hls.attachMedia(vid);
        hls.on(Hls.Events.MANIFEST_PARSED, playVideo);
      } else {
        vid.src = src;
        vid.addEventListener("loadedmetadata", playVideo, { once: true });
      }
    } else {
      vid.src = src;
      vid.addEventListener("loadedmetadata", playVideo, { once: true });
    }

    return () => {
      vid.pause();
      vid.removeAttribute("src");
      vid.load();
      if (hls) hls.destroy();
    };
  }, [isHovered, video, isLoading]);

  if (isLoading) {
    return (
      <div className="f-card-wrapper f-skeleton-loading">
        <div className="feature-netflix-card f-skeleton-thumb" />
        <style>{`
          .f-skeleton-loading {
            display: inline-block;
            width: 480px;
            pointer-events: none;
            animation: fSkeletonIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          }
          .f-skeleton-thumb {
            width: 480px;
            height: 270px;
            border-radius: 0px;
            background: #1f1f1f;
            position: relative;
            overflow: hidden;
          }
          .f-skeleton-thumb::after {
            position: absolute;
            top: 0; right: 0; bottom: 0; left: 0;
            transform: translateX(-100%);
            background-image: linear-gradient(
              90deg,
              rgba(255, 255, 255, 0) 0%,
              rgba(255, 255, 255, 0.05) 20%,
              rgba(255, 255, 255, 0.1) 60%,
              rgba(255, 255, 255, 0) 100%
            );
            animation: fShimmer 1.2s infinite;
            content: '';
          }
          @keyframes fShimmer { 100% { transform: translateX(100%); } }
          @keyframes fSkeletonIn { from { opacity: 0; transform: scale(0.97); } to { opacity: 1; transform: scale(1); } }
        `}</style>
      </div>
    );
  }

  return (
    <div
      className="f-card-wrapper f-fade-in"
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onClick={onClick}
    >
      <div className="feature-netflix-card">
        <div
          className={`f-thumb-wrapper ${isHovered || imageError ? "f-hide" : ""}`}
        >
          {!imageError && (
            <Image
              src={thumbnail}
              alt=""
              fill
              sizes="480px"
              unoptimized
              style={{ objectFit: "cover" }}
              onError={() => setImageError(true)}
            />
          )}
        </div>

        <video
          ref={videoRef}
          className={`f-preview ${isHovered ? "f-show" : ""}`}
          loop
          playsInline
        />

        <div
          className={`f-glass-meta-panel ${isHovered ? "f-panel-lift" : ""}`}
        >
          <div className="f-panel-header">
            <h3 className="f-title">{video.title}</h3>
            <span className="f-category">{assignedGenre}</span>
          </div>

          <div className="f-meta-sub-row">
            <span className="f-match">99% Match</span>
            <span className="f-year">{video.releaseYear || "2026"}</span>
            <span className="f-badge">Ultra HD</span>
            <span className="f-badge">Spatial Audio</span>
          </div>

          {video.description && (
            <p className="f-desc">
              {video.description.length > 140
                ? video.description.slice(0, 140) + "..."
                : video.description}
            </p>
          )}

          <div className="f-action-row">
            <button className="f-btn-play">▶ Play Now</button>
            <span className="f-details-link">More Info ›</span>
          </div>
        </div>

        {progress > 0 && (
          <div className="f-progress-bar">
            <div style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>

      <style jsx>{`
        .f-fade-in { animation: fFadeFrame 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes fFadeFrame { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .f-card-wrapper { display: inline-block; width: 480px; flex-shrink: 0; cursor: pointer; transform: scale(1) translateY(0); transition: transform 0.3s cubic-bezier(0.25, 1, 0.5, 1); position: relative; }
        .f-card-wrapper:hover { transform: scale(1.05) translateY(-4px); z-index: 50; }
        .feature-netflix-card { position: relative; width: 480px; height: 270px; overflow: hidden; background: #141414; border: 1px solid rgba(255, 255, 255, 0.04); box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5); transition: box-shadow 0.3s ease; }
        .f-card-wrapper:hover .feature-netflix-card { box-shadow: 0 20px 45px rgba(0, 0, 0, 0.9); border-color: rgba(255, 255, 255, 0.08); }
        .f-thumb-wrapper { position: absolute; inset: 0; transition: opacity 0.25s ease-out; z-index: 1; }
        .f-thumb-wrapper.f-hide { opacity: 0; }
        video.f-preview { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0; transition: opacity 0.25s ease-out; z-index: 0; }
        video.f-show { opacity: 0.78; }
        .f-glass-meta-panel { position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(to top, rgba(0, 0, 0, 0.98) 0%, rgba(0, 0, 0, 0.78) 75%, rgba(0, 0, 0, 0.1) 100%); padding: 24px 20px 20px 20px; z-index: 5; transform: translateY(40px); transition: transform 0.3s cubic-bezier(0.25, 1, 0.5, 1), background 0.3s; }
        .f-card-wrapper:hover .f-glass-meta-panel { transform: translateY(0); background: linear-gradient(to top, rgba(0, 0, 0, 0.98) 0%, rgba(0, 0, 0, 0.88) 60%, rgba(0, 0, 0, 0.4) 100%); backdrop-filter: blur(6px); }
        .f-panel-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 8px; }
        .f-title { margin: 0; font-size: 1.35rem; font-weight: 700; color: #ffffff; letter-spacing: -0.02em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1; }
        .f-category { color: #ec4899; font-weight: 800; background: rgba(236, 72, 153, 0.14); padding: 3px 10px; border-radius: 4px; font-size: 0.68rem; letter-spacing: 0.05em; text-transform: uppercase; white-space: nowrap; }
        .f-meta-sub-row { display: flex; align-items: center; gap: 12px; font-size: 0.85rem; margin-bottom: 12px; }
        .f-match { color: #46d369; font-weight: 700; }
        .f-year { color: #cccccc; font-weight: 500; }
        .f-badge { font-size: 0.68rem; font-weight: 700; color: #a3a3a3; border: 1px solid rgba(255, 255, 255, 0.18); padding: 0px 5px; border-radius: 3px; }
        .f-desc { margin: 0 0 16px 0; font-size: 0.85rem; line-height: 1.5; color: #d1d5db; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; opacity: 0; transition: opacity 0.2s ease; }
        .f-card-wrapper:hover .f-desc { opacity: 1; transition-delay: 0.04s; }
        .f-action-row { display: flex; align-items: center; justify-content: space-between; opacity: 0; transition: opacity 0.2s ease; }
        .f-card-wrapper:hover .f-action-row { opacity: 1; transition-delay: 0.08s; }
        .f-btn-play { background: #ffffff; color: #000000; border: none; padding: 8px 20px; border-radius: 5px; font-weight: 700; font-size: 0.88rem; cursor: pointer; transition: background 0.2s, transform 0.1s; }
        .f-btn-play:hover { background: linear-gradient(to right, #3b82f6, #ec4899); color: #ffffff; }
        .f-btn-play:active { transform: scale(0.97); }
        .f-details-link { font-size: 0.88rem; font-weight: 600; color: #a3a3a3; transition: color 0.2s; }
        .f-details-link:hover { color: #ffffff; }
        .f-progress-bar { position: absolute; bottom: 0; width: 100%; height: 4px; background: rgba(255, 255, 255, 0.15); z-index: 10; }
        .f-progress-bar div { height: 100%; background: linear-gradient(to right, #3b82f6, #ec4899); box-shadow: 0 0 10px #ec4899; }
        @media (max-width: 540px) { .f-card-wrapper, .feature-netflix-card { width: 320px; height: 180px; } .f-desc { display: none; } .f-glass-meta-panel { transform: translateY(0); } }
      `}</style>
    </div>
  );
}