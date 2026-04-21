"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import VideoRow from "@/components/VideoRow";
import Link from "next/link";
import VideoModal from "@/components/VideoModal"; // ✅ Import your Modal

interface Video {
  id: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  videoUrl?: string | null;
  hlsManifestUrl?: string | null;
  releaseYear: number | null;
}

const FALLBACK_IMAGE = "https://unsplash.com";

export default function HomeClient({ initialVideos }: { initialVideos: Video[] }) {
  const [history, setHistory] = useState<any>({});
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null); // ✅ Modal State

  useEffect(() => {
    try {
      const hist = JSON.parse(localStorage.getItem("movieflix-history") || "{}");
      setHistory(hist);
    } catch {}
  }, []);

  const isContinueWatching = (videoId: string) => {
    const item = history[videoId];
    return item && item.time > 5 && item.duration > 0 && item.time / item.duration < 0.95;
  };

  const continueWatching = initialVideos
    .filter((v) => isContinueWatching(v.id))
    .sort((a, b) => (history[b.id]?.updatedAt || 0) - (history[a.id]?.updatedAt || 0));

  const heroVideo = initialVideos?.[0];

  const normalizeUrl = (url?: string | null) => {
    if (!url) return FALLBACK_IMAGE;
    let cleanUrl = url.replace(/^(https?:\/\/)+/g, "https://");
    if (!cleanUrl.startsWith("http")) cleanUrl = `https://${cleanUrl}`;
    return cleanUrl;
  };

  const heroImage = normalizeUrl(heroVideo?.thumbnailUrl);

  return (
    <main style={{ background: "#141414", color: "#fff", minHeight: "100vh" }}>
      {/* 🎬 HERO SECTION */}
      {heroVideo && (
        <section style={{ position: "relative", height: "85vh", width: "100%", overflow: "hidden", background: "#000" }}>
          <Image
            src={heroImage}
            alt={heroVideo.title}
            fill
            priority
            quality={100}
            style={{ objectFit: "cover", objectPosition: "top center" }}
            sizes="100vw"
          />

          <div style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to top, #141414 5%, transparent 50%), linear-gradient(to right, rgba(0,0,0,0.8) 0%, transparent 60%)",
            zIndex: 1,
          }} />

          <div style={{ position: "absolute", bottom: "15%", left: "4%", maxWidth: "800px", zIndex: 2 }}>
            <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 800, lineHeight: 1.1, margin: "0 0 1rem 0", textShadow: "2px 2px 10px rgba(0,0,0,0.8)" }}>
              {heroVideo.title}
            </h1>

            <div style={{ display: "flex", gap: "1rem", margin: "1.5rem 0", color: "#eee", fontSize: "1.1rem", alignItems: "center" }}>
              <span style={{ color: "#46d369", fontWeight: "bold" }}>98% Match</span>
              <span>{heroVideo.releaseYear || "2024"}</span>
              <span style={{ border: "1px solid rgba(255,255,255,0.4)", padding: "0 0.4rem", fontSize: "0.7rem", borderRadius: "3px" }}>HD</span>
            </div>

            <p style={{ color: "#fff", fontSize: "1.2rem", lineHeight: 1.4, maxWidth: "500px", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden", textShadow: "1px 1px 5px rgba(0,0,0,0.7)" }}>
              {heroVideo.description || "AI-enhanced cinematic streaming experience."}
            </p>

            <div style={{ display: "flex", gap: "1rem", marginTop: "2rem" }}>
              <Link href={`/watch/${heroVideo.id}`} className="hero-btn-play">
                <span style={{ marginRight: "12px", fontSize: "1.5rem" }}>▶</span>
                {isContinueWatching(heroVideo.id) ? "Resume" : "Play"}
              </Link>

              {/* ✅ Open Modal Trigger */}
              <button onClick={() => setSelectedVideo(heroVideo)} className="hero-btn-info">
                <span style={{ marginRight: "10px", fontSize: "1.4rem" }}>ⓘ</span> More Info
              </button>
            </div>
          </div>
        </section>
      )}

      {/* 🎞️ CONTENT ROWS */}
      <div style={{ marginTop: "-8rem", position: "relative", zIndex: 5, paddingBottom: "4rem" }}>
        {continueWatching.length > 0 && <VideoRow title="Continue Watching" videos={continueWatching} />}
        <VideoRow title="Trending Now" videos={initialVideos} />
        <VideoRow title="Recently Uploaded" videos={initialVideos} />
      </div>

      {/* ✅ MODAL COMPONENT */}
      {selectedVideo && (
        <VideoModal 
          video={selectedVideo} 
          onClose={() => setSelectedVideo(null)} 
        />
      )}

      <style jsx>{`
        .hero-btn-play {
          background: #fff;
          color: #000;
          padding: 0.6rem 2.2rem;
          border-radius: 4px;
          font-weight: bold;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          font-size: 1.2rem;
          transition: all 0.2s ease;
        }
        .hero-btn-play:hover {
          background: rgba(255, 255, 255, 0.75);
        }
        .hero-btn-info {
          background: rgba(109, 109, 110, 0.7);
          color: #fff;
          padding: 0.6rem 2.2rem;
          border-radius: 4px;
          font-weight: bold;
          border: none;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          font-size: 1.2rem;
          transition: background 0.2s ease;
        }
        .hero-btn-info:hover {
          background: rgba(109, 109, 110, 0.4);
        }
      `}</style>
    </main>
  );
}
