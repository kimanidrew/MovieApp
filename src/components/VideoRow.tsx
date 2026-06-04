"use client";

import React, { useEffect, useRef, useState } from "react";
import VideoModal from "./VideoModal";
import Hls from "hls.js";
import Image from "next/image";
import { normalizeUrl } from "@/utils/normalizeUrl";

interface Video {
  id: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  videoUrl?: string | null;
  hlsManifestUrl?: string | null;
  releaseYear: number | null;
}

export default function VideoRow({
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

  useEffect(() => {
    try {
      const hist = JSON.parse(
        localStorage.getItem("movieflix-history") || "{}",
      );
      setHistory(hist);
    } catch {}

    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, [selectedVideo]);

  return (
    <>
      <section className="row-section">
        <h2 className="row-title">{title}</h2>

        <div className="row-container">
          {videos.map((video, index) => {
            const hist = history[video.id];
            const progress =
              hist && hist.duration > 0
                ? Math.min(100, (hist.time / hist.duration) * 100)
                : 0;

            return (
              <VideoCard
                key={video.id}
                video={video}
                index={index}
                progress={progress}
                isHovered={hoveredId === video.id}
                isLoading={isLoading}
                onHover={() => setHoveredId(video.id)}
                onLeave={() => setHoveredId(null)}
                onClick={() => setSelectedVideo(video)}
              />
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
        .row-section {
          padding: 1rem 0;
          position: relative;
          /* Keeps scaling elements from bleeding into completely unrelated page sections */
          clear: both; 
        }

        .row-title {
          padding: 0 4%;
          margin-bottom: 0.25rem;
          font-size: 1.5rem;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: #fff;
          font-family: 'Inter', system-ui, sans-serif;
        }

        .row-container {
          display: flex;
          gap: 1.25rem;
          /* Extra vertical padding gives room for the scale animation headroom */
          padding: 1.5rem 4% 1.5rem 4%; 
          /* Counteracts the added padding so rows don't push further down the screen */
          margin-top: -0.5rem; 
          overflow-x: auto;
          overflow-y: visible; /* Crucial parameter to prevent vertical boundary cutting */
          scrollbar-width: none;
        }

        .row-container::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </>
  );
}

/* ===================== CARD ===================== */

function VideoCard({
  video,
  index,
  progress,
  isHovered,
  isLoading,
  onHover,
  onLeave,
  onClick,
}: any) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [imageError, setImageError] = useState(false);

  const thumbnail = normalizeUrl(video.thumbnailUrl);

  const dynamicGenres = [
    "Action",
    "Sci-Fi",
    "Drama",
    "Thriller",
    "Comedy",
    "Horror",
  ];
  const assignedGenre = dynamicGenres[index % dynamicGenres.length];

  useEffect(() => {
    if (!isHovered || !videoRef.current || isLoading) return;

    const vid = videoRef.current;
    let hls: Hls | null = null;

    const rawSrc = video.hlsManifestUrl || video.videoUrl;
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
      <div className="card-wrapper skeleton-loading">
        <div className="netflix-card skeleton-thumb" />
        <div className="meta">
          <div className="skeleton-line skeleton-title" />
          <div className="skeleton-line skeleton-sub" />
          <div className="skeleton-line skeleton-desc" />
        </div>
        <style>{`
          .skeleton-loading {
            display: inline-block;
            width: 240px;
            pointer-events: none;
            animation: skeletonScaleIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          }
          .skeleton-thumb {
            position: relative;
            width: 240px;
            height: 135px;
            border-radius: 8px;
            background: #1f1f1f;
            overflow: hidden;
          }
          .skeleton-thumb::after,
          .skeleton-line::after {
            position: absolute;
            top: 0;
            right: 0;
            bottom: 0;
            left: 0;
            transform: translateX(-100%);
            background-image: linear-gradient(
              90deg,
              rgba(255, 255, 255, 0) 0%,
              rgba(255, 255, 255, 0.06) 20%,
              rgba(255, 255, 255, 0.12) 60%,
              rgba(255, 255, 255, 0) 100%
            );
            animation: hardwareShimmer 1.2s infinite;
            content: '';
          }
          .skeleton-line {
            position: relative;
            background: #1f1f1f;
            border-radius: 4px;
            margin-bottom: 8px;
            overflow: hidden;
          }
          .skeleton-title { height: 14px; width: 70%; margin-top: 10px; }
          .skeleton-sub { height: 10px; width: 45%; }
          .skeleton-desc { height: 10px; width: 90%; }
          
          @keyframes hardwareShimmer {
            100% { transform: translateX(100%); }
          }
          @keyframes skeletonScaleIn {
            from { opacity: 0; transform: scale(0.96); }
            to { opacity: 1; transform: scale(1); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div
      className={`card-wrapper animated-fade-in ${index === 0 ? "first-card" : ""}`}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onClick={onClick}
    >
      <div className="netflix-card">
        {/* THUMBNAIL */}
        <div
          className={`thumb-wrapper ${isHovered || imageError ? "hide" : ""}`}
        >
          {!imageError && (
            <Image
              src={thumbnail}
              alt=""
              fill
              sizes="240px"
              unoptimized
              style={{ objectFit: "cover" }}
              onError={() => setImageError(true)}
            />
          )}
        </div>

        {/* VIDEO PREVIEW */}
        <video
          ref={videoRef}
          className={`preview ${isHovered ? "show" : ""}`}
          loop
          playsInline
        />

        <div className="gradient-overlay" />

        {/* PROGRESS BAR */}
        {progress > 0 && (
          <div className="progress-bar">
            <div style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>

      {/* METADATA AREA */}
      <div className="meta">
        <div className="title-row">
          <div className="title">{video.title}</div>
        </div>

        <div className="sub-row">
          <span className="category-chip">{assignedGenre}</span>
          <span className="year-badge">{video.releaseYear || "2026"}</span>
          <span className="hd-label">HD</span>
        </div>

        {video.description && (
          <p className="desc">
            {video.description.length > 55
              ? video.description.slice(0, 55) + "..."
              : video.description}
          </p>
        )}
      </div>

      <style>
        {`
        .animated-fade-in {
          animation: fadeInFrame 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes fadeInFrame {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .card-wrapper {
          display: inline-block;
          width: 240px;
          flex-shrink: 0;
          cursor: pointer;
          transform: scale(1) translateY(0);
          transition: transform 0.3s cubic-bezier(0.25, 1, 0.5, 1), box-shadow 0.3s ease;
          font-family: 'Inter', system-ui, sans-serif;
          position: relative;
        }

        .card-wrapper:hover {
          transform: scale(1.08) translateY(-4px) !important;
          z-index: 50;
        }

        .netflix-card {
          position: relative;
          width: 240px;
          height: 135px;
          border-radius: 8px;
          overflow: hidden;
          background: #141414;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.4);
          transition: box-shadow 0.3s ease;
        }

        .card-wrapper:hover .netflix-card {
          box-shadow: 0 12px 28px rgba(0, 0, 0, 0.8);
        }

        .thumb-wrapper {
          position: absolute;
          inset: 0;
          transition: opacity 0.2s ease-out;
        }

        .thumb-wrapper.hide {
          opacity: 0;
        }

        video.preview {
          position: absolute;
          inset: 0;
          width: 100%;
                    height: 100%;
          object-fit: cover;
          opacity: 0;
          transition: opacity 0.2s ease-out;
        }
        video.show {
          opacity: 1;
        }
        .gradient-overlay {
          position: absolute;
          bottom: 0;
          width: 100%;
          height: 40%;
          background: linear-gradient(to top, rgba(10, 10, 10, 0.8), transparent);
          pointer-events: none;
        }
        /* PROGRESS BAR */
        .progress-bar {
          position: absolute;
          bottom: 0;
          width: 100%;
          height: 3px;
          background: rgba(255, 255, 255, 0.2);
          z-index: 2;
        }
        .progress-bar div {
          height: 100%;
          background: #e50914;
          box-shadow: 0 0 8px #e50914;
        }
        /* PREMIUM INFO REGION */
        .meta {
          padding: 10px 4px 4px 4px;
          color: #fff;
        }
        .title-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 6px;
        }
        .title {
          font-size: 0.95rem;
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          letter-spacing: 0.01em;
          color: #ffffff;
        }
        .sub-row {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.75rem;
          margin-bottom: 6px;
        }
        .category-chip {
          color: #ffffff;
          font-weight: 700;
          background: rgba(255, 255, 255, 0.1);
          padding: 1.5px 6px;
          border-radius: 4px;
          font-size: 0.6rem;
          letter-spacing: 0.02em;
          text-transform: capitalize;
        }
        .year-badge {
          color: #a3a3a3;
          font-weight: 500;
        }
        .hd-label {
          font-size: 0.65rem;
          font-weight: 700;
          color: #d4d4d4;
          border: 1px solid rgba(255, 255, 255, 0.2);
          padding: 0px 4px;
          border-radius: 2px;
          letter-spacing: 0.05em;
        }
        .desc {
          margin: 0;
          font-size: 0.75rem;
          line-height: 1.4;
          color: #9ca3af;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: "vertical";
          overflow: hidden;
        }`}
      </style>
    </div>
  );
}
