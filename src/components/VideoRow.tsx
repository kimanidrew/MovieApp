"use client";

import React, { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import Image from "next/image";
import { Video } from "@/types/video";
import { normalizeUrl } from "@/utils/normalizeUrl";

export default function VideoRow({
  title,
  videos,
}: {
  title: string;
  videos: Video[];
}) {
  const [history, setHistory] = useState<Record<string, any>>({});
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const hist = JSON.parse(localStorage.getItem("movieflix-history") || "{}");
      setHistory(hist);
    } catch {}
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <section className="row-section">
        <h2 className="row-title">{title}</h2>
        <div className="row-container">
          {videos.map((video, index) => {
            const hist = history[video.id];
            const progress = hist?.duration > 0 ? Math.min(100, (hist.time / hist.duration) * 100) : 0;

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

   

      <style jsx>{`
        .row-section { padding: 1rem 0; position: relative; clear: both; }
        .row-title { padding: 0 4%; margin-bottom: 0.25rem; font-size: 1.5rem; font-weight: 700; color: #fff; }
        .row-container { display: flex; gap: 1.25rem; padding: 1.5rem 4%; margin-top: -0.5rem; overflow-x: auto; scrollbar-width: none; }
        .row-container::-webkit-scrollbar { display: none; }
      `}</style>
    </>
  );
}

function VideoCard({ video, index, progress, isHovered, isLoading, onHover, onLeave, onClick }: any) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [imageError, setImageError] = useState(false);
  const thumbnail = video.thumbnailUrl ? normalizeUrl(video.thumbnailUrl) : "/placeholder.jpg";

  useEffect(() => {
    if (!isHovered || !videoRef.current || isLoading) return;
    const vid = videoRef.current;
    let hls: Hls | null = null;
    const rawSrc = video.hlsManifestUrl || video.videoUrl;
    if (!rawSrc) return;
    
    const src = normalizeUrl(rawSrc);
    vid.muted = true;
    
    if (src.includes(".m3u8") && Hls.isSupported()) {
      hls = new Hls();
      hls.loadSource(src);
      hls.attachMedia(vid);
      hls.on(Hls.Events.MANIFEST_PARSED, () => vid.play().catch(() => {}));
    } else {
      vid.src = src;
      vid.addEventListener("loadedmetadata", () => vid.play().catch(() => {}), { once: true });
    }
    return () => { hls?.destroy(); vid.pause(); };
  }, [isHovered, video, isLoading]);

  return (
    <div className="card-wrapper" onMouseEnter={onHover} onMouseLeave={onLeave} onClick={onClick}>
      <div className="glass-card">
        <div className={`thumb-wrapper ${isHovered || imageError ? "hide" : ""}`}>
           <Image src={thumbnail} alt={video.title} fill sizes="250px" style={{ objectFit: "cover" }} onError={() => setImageError(true)} />
        </div>
        <video ref={videoRef} className={`preview ${isHovered ? "show" : ""}`} loop playsInline />
      </div>
    </div>
  );
}