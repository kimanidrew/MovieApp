"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import VideoModal from "./VideoModal";
import { normalizeUrl } from "@/utils/normalizeUrl"; // 👈 Imported your standalone utility

interface Video {
  id: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  videoUrl?: string | null;
  hlsManifestUrl?: string | null;
  releaseYear: number | null;
}

interface VideoGridProps {
  videos: Video[];
  isTvPage?: boolean;
}

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1552526922-8393e878411d?q=80&w=600";

export default function VideoGrid({
  videos,
  isTvPage = false,
}: VideoGridProps) {
  const [history, setHistory] = useState<{
    [id: string]: { time: number; duration: number };
  }>({});
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  // track broken images
  const [brokenImages, setBrokenImages] = useState<{
    [id: string]: boolean;
  }>({});

  useEffect(() => {
    try {
      const hist = JSON.parse(
        localStorage.getItem("movieflix-history") || "{}"
      );
      setHistory(hist);
    } catch (e) {
      console.error("History parse error", e);
    }
  }, [selectedVideo]);

  if (videos.length === 0) {
    return (
      <p style={{ color: "#777", fontSize: "1.2rem" }}>
        No cinematic drops found in the database. Head to Uploads to cast the first stone.
      </p>
    );
  }

  return (
    <>
      <div className="grid">
        {videos.map((video) => {
          const hist = history[video.id];
          const hasHistory = hist && hist.time > 5;

          const progressPct =
            hasHistory && hist.duration > 0
              ? Math.min(100, Math.max(0, (hist.time / hist.duration) * 100))
              : 0;

          const isBroken = brokenImages[video.id];

          // 👈 Tokenized dynamically through your standalone helper utility
          const thumbnail = isBroken
            ? FALLBACK_IMAGE
            : normalizeUrl(video.thumbnailUrl);

          return (
            <div
              key={video.id}
              className="premium-poster-card"
              onClick={() => setSelectedVideo(video)}
            >
              <div className="poster-img-wrapper">
                <Image
                  src={thumbnail}
                  alt={video.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 300px"
                  unoptimized // 👈 Bypasses optimization pipelines to keep token query strings functional
                  style={{ objectFit: "cover" }}
                  onError={() =>
                    setBrokenImages((prev) => ({
                      ...prev,
                      [video.id]: true,
                    }))
                  }
                  priority={false}
                />

                {hasHistory && (
                  <div className="poster-progress-container">
                    <div
                      className="poster-progress-fill"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                )}

                <div className="poster-play-overlay">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="white">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>

              <div className="poster-info">
                <h3>{video.title}</h3>
                <p>
                  <span className="match-score">98% Match</span>
                  <span className="release-year">
                    {video.releaseYear || "2024"}
                  </span>
                  <span className="type-badge">
                    {isTvPage ? "TV Series" : "Feature Film"}
                  </span>
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {selectedVideo && (
        <VideoModal
          video={selectedVideo}
          onClose={() => setSelectedVideo(null)}
          isTvShow={isTvPage || selectedVideo.id.includes("tv")}
        />
      )}

      <style jsx>{`
        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 2.5rem;
        }

        .premium-poster-card {
          cursor: pointer;
          border-radius: 8px;
          overflow: hidden;
          background: #181818;
          transition: transform 0.3s, box-shadow 0.3s;
        }

        .premium-poster-card:hover {
          transform: scale(1.05) translateY(-5px);
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.6);
          z-index: 10;
        }

        .poster-img-wrapper {
          position: relative;
          width: 100%;
          height: 0;
          padding-top: 56.25%;
          background: #222;
        }

        .poster-progress-container {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: rgba(255, 255, 255, 0.2);
          z-index: 5;
        }

        .poster-progress-fill {
          height: 100%;
          background: #e50914;
        }

        .poster-play-overlay {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 60px;
          height: 60px;
          background: rgba(0, 0, 0, 0.6);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.3s;
        }

        .premium-poster-card:hover .poster-play-overlay {
          opacity: 1;
        }

        .poster-info {
          padding: 1rem;
        }

        .poster-info h3 {
          font-size: 1.1rem;
          margin: 0 0 0.5rem 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .poster-info p {
          margin: 0;
          font-size: 0.85rem;
          display: flex;
          gap: 0.6rem;
          color: #bcbcbc;
        }

        .match-score {
          color: #46d369;
          font-weight: bold;
        }

        .type-badge {
          border: 1px solid rgba(255, 255, 255, 0.3);
          padding: 0 0.3rem;
          border-radius: 3px;
          font-size: 0.75rem;
        }
      `}</style>
    </>
  );
}
