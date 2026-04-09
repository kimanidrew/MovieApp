"use client";

import React, { useEffect, useRef, useState } from "react";
import VideoModal from "./VideoModal";
import Hls from "hls.js";

interface Video {
    id: string;
    title: string;
    description: string | null;
    thumbnailUrl: string | null;
    videoUrl?: string | null;
    hlsManifestUrl?: string | null;
    releaseYear: number | null;
}

export default function VideoRow({ title, videos }: { title: string; videos: Video[] }) {
    const [history, setHistory] = useState<any>({});
    const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
    const [hoveredId, setHoveredId] = useState<string | null>(null);

    useEffect(() => {
        try {
            const hist = JSON.parse(localStorage.getItem("movieflix-history") || "{}");
            setHistory(hist);
        } catch { }
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
                                onHover={() => setHoveredId(video.id)}
                                onLeave={() => setHoveredId(null)}
                                onClick={() => setSelectedVideo(video)}
                            />
                        );
                    })}
                </div>
            </section>

            {selectedVideo && (
                <VideoModal video={selectedVideo} onClose={() => setSelectedVideo(null)} />
            )}

            <style>{`
        .row-section {
          padding: 2rem 0;
          position: relative;
          z-index: 5;
        }

        .row-title {
          padding: 0 4%;
          margin-bottom: 1rem;
        }

        .row-container {
          display: flex;
          gap: 1rem;

          padding: 2rem 4%; /* 🔥 FIX: adds space on left */

          overflow-x: auto;
          overflow-y: visible;

          scrollbar-width: none;
        }

        .row-container::-webkit-scrollbar {
          display: none;
        }
      `}</style>
        </>
    );
}

function VideoCard({
    video,
    index,
    progress,
    isHovered,
    onHover,
    onLeave,
    onClick,
}: any) {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (!isHovered || !videoRef.current) return;

        const vid = videoRef.current;
        let hls: Hls | null = null;

        const src = video.hlsManifestUrl || video.videoUrl;
        if (!src) return;

        if (src.endsWith(".m3u8") && Hls.isSupported()) {
            hls = new Hls();
            hls.loadSource(src);
            hls.attachMedia(vid);
        } else {
            vid.src = src;
        }

        vid.muted = true;
        vid.currentTime = 5;
        vid.play().catch(() => { });

        return () => {
            vid.pause();
            if (hls) hls.destroy();
        };
    }, [isHovered, video]);

    return (
        <div
            className={`card-wrapper ${index === 0 ? "first-card" : ""}`}
            onMouseEnter={onHover}
            onMouseLeave={onLeave}
            onClick={onClick}
        >
            <div className="netflix-card">
                <img
                    src={video.thumbnailUrl || "/fallback.jpg"}
                    className={`thumbnail ${isHovered ? "hide" : ""}`}
                />

                <video
                    ref={videoRef}
                    className={`preview ${isHovered ? "show" : ""}`}
                    loop
                    playsInline
                />

                <div className="gradient-overlay" />

                {progress > 0 && (
                    <div className="progress-bar">
                        <div style={{ width: `${progress}%` }} />
                    </div>
                )}
            </div>

            <style>{`
        .card-wrapper {
          position: relative;
          border-radius: 8px;
          cursor: pointer;
        }

        .netflix-card {
          position: relative;
          min-width: 240px;
          height: 140px;
          border-radius: 8px;
          overflow: hidden;
          background: #000;
          transition: transform 0.3s ease;
        }

        /* 🔥 DEFAULT SCALE */
        .card-wrapper:hover .netflix-card {
          transform: scale(1.5);
          z-index: 999;
        }

        /* 🔥 FIX FIRST CARD CUT */
        .first-card:hover .netflix-card {
          transform-origin: left center;
        }

        img.thumbnail {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: opacity 0.3s ease;
        }

        img.hide {
          opacity: 0;
        }

        video.preview {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        video.show {
          opacity: 1;
        }

        .gradient-overlay {
          position: absolute;
          bottom: 0;
          width: 100%;
          height: 60%;
          background: linear-gradient(to top, rgba(0,0,0,0.9), transparent);
        }

        .progress-bar {
          position: absolute;
          bottom: 0;
          width: 100%;
          height: 4px;
          background: rgba(255,255,255,0.2);
        }

        .progress-bar div {
          height: 100%;
          background: #e50914;
        }
      `}</style>
        </div>
    );
}