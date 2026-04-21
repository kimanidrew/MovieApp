"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import VideoRow from "@/components/VideoRow";
import Link from "next/link";
import VideoModal from "@/components/VideoModal"; // ✅ Import your VideoModal

interface Video {
  id: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  videoUrl?: string | null;
  hlsManifestUrl?: string | null;
  releaseYear: number | null;
}

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1552526922-8393e878411d?q=80&w=1200";

export default function HomeClient({
  initialVideos,
}: {
  initialVideos: Video[];
}) {
  const [history, setHistory] = useState<any>({});
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null); // ✅ Modal State

  useEffect(() => {
    try {
      const hist = JSON.parse(
        localStorage.getItem("movieflix-history") || "{}"
      );
      setHistory(hist);
    } catch {}
  }, []);

  const isContinueWatching = (videoId: string) => {
    const item = history[videoId];
    return (
      item &&
      item.time > 5 &&
      item.duration > 0 &&
      item.time / item.duration < 0.95
    );
  };

  const continueWatching = initialVideos
    .filter((v) => isContinueWatching(v.id))
    .sort(
      (a, b) =>
        (history[b.id]?.updatedAt || 0) -
        (history[a.id]?.updatedAt || 0)
    );

  const heroVideo = initialVideos?.[0];

  const normalizeUrl = (url?: string | null) => {
    if (!url) return FALLBACK_IMAGE;
    if (url.startsWith("https://https://")) {
      return url.replace("https://https://", "https://");
    }
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }
    return `https://${url}`;
  };

  const heroImage = normalizeUrl(heroVideo?.thumbnailUrl);

  return (
    <main style={{ background: "#141414", color: "#fff", minHeight: "100vh" }}>
      {/* 🎬 HERO SECTION */}
      {heroVideo && (
        <section style={{ position: "relative", height: "90vh", width: "100%" }}>
          <Image
            src={heroImage}
            alt={heroVideo.title}
            fill
            priority
            quality={90}
            style={{ objectFit: "cover" }}
            sizes="100vw"
          />

          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to top, #141414 10%, transparent 60%), linear-gradient(to right, #000 20%, transparent 80%)",
              zIndex: 1,
            }}
          />

          <div
            style={{
              position: "absolute",
              bottom: "20%",
              left: "4%",
              maxWidth: "600px",
              zIndex: 2,
            }}
          >
            <h1
              style={{
                fontSize: "3.5rem",
                fontWeight: 800,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                margin: 0,
                textShadow: "2px 2px 4px rgba(0,0,0,0.45)",
              }}
            >
              {heroVideo.title}
            </h1>

            <div
              style={{
                display: "flex",
                gap: "1rem",
                margin: "1rem 0",
                color: "#ccc",
                fontSize: "1.1rem",
              }}
            >
              <span style={{ color: "#46d369", fontWeight: "bold" }}>98% Match</span>
              <span>{heroVideo.releaseYear || "2024"}</span>
              <span style={{ border: "1px solid #666", padding: "0 0.4rem", fontSize: "0.8rem", borderRadius: "3px" }}>HD</span>
              <span>AI Enhanced</span>
            </div>

            <p
              style={{
                color: "#fff",
                fontSize: "1rem",
                lineHeight: 1.6,
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                textShadow: "1px 1px 2px rgba(0,0,0,0.5)",
              }}
            >
              {heroVideo.description ||
                "AI-enhanced cinematic streaming experience."}
            </p>

            <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
              <Link href={`/watch/${heroVideo.id}`} style={btnPlay}>
                {isContinueWatching(heroVideo.id) ? "▶ Resume" : "▶ Play"}
              </Link>

              {/* ✅ UPDATED TO BUTTON FOR MODAL */}
              <button 
                onClick={() => setSelectedVideo(heroVideo)} 
                style={btnInfo}
              >
                More Info
              </button>
            </div>
          </div>
        </section>
      )}

      {/* 🎞️ CONTENT ROWS */}
      <div style={{ marginTop: "-6rem", position: "relative", zIndex: 5 }}>
        {continueWatching.length > 0 && (
          <VideoRow title="Continue Watching" videos={continueWatching} />
        )}

        <VideoRow title="Trending Now" videos={initialVideos} />

        <VideoRow title="Recently Uploaded" videos={initialVideos} />
      </div>

      {/* ✅ MODAL INTEGRATION */}
      {selectedVideo && (
        <VideoModal 
          video={selectedVideo} 
          onClose={() => setSelectedVideo(null)} 
        />
      )}
    </main>
  );
}

const btnPlay: React.CSSProperties = {
  background: "#fff",
  color: "#000",
  padding: "0.8rem 2.4rem",
  borderRadius: "4px",
  fontWeight: "bold",
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  fontSize: "1.1rem",
  transition: "background 0.2s",
  cursor: "pointer",
  border: "none",
};

const btnInfo: React.CSSProperties = {
  background: "rgba(0,0,0,1)",
  color: "#fff",
  padding: "0.8rem 2.4rem",
  borderRadius: "4px",
  fontWeight: "bold",
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  fontSize: "1.1rem",
  cursor: "pointer",
  border: "none",
  transition: "background 0.2s",
};
