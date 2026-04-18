"use client";

import React, { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import VideoRow from "@/components/VideoRow";
import Link from "next/link";

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

  // ✅ FIX: normalize broken / invalid URLs
  const normalizeUrl = (url?: string | null) => {
    if (!url) return FALLBACK_IMAGE;

    // fix double https bug
    if (url.startsWith("https://https://")) {
      return url.replace("https://https://", "https://");
    }

    // valid url
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
        <section
          style={{
            position: "relative",
            height: "90vh",
            backgroundImage: `url(${heroImage})`, // ✅ FIXED HERE
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          {/* DARK OVERLAY */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to top, #141414 10%, transparent 60%), linear-gradient(to right, #000 20%, transparent 80%)",
            }}
          />

          {/* CONTENT */}
          <div
            style={{
              position: "absolute",
              bottom: "20%",
              left: "4%",
              maxWidth: "600px",
            }}
          >
            <h1 style={{ fontSize: "3rem", fontWeight: 800 ,display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",}}>
              {heroVideo.title}
            </h1>

            <div
              style={{
                display: "flex",
                gap: "1rem",
                margin: "1rem 0",
                color: "#ccc",
              }}
            >
              <span style={{ color: "#46d369" }}>98% Match</span>
              <span>{heroVideo.releaseYear || "2024"}</span>
              <span>HD</span>
              <span>AI Enhanced</span>
            </div>

            <p 
            style={{
              color: "#ddd",
              lineHeight: 1.5,
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}>
              {heroVideo.description ||
                "AI-enhanced cinematic streaming experience."}
            </p>

            <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
              <Link href={`/watch/${heroVideo.id}`} style={btnPlay}>
                {isContinueWatching(heroVideo.id)
                  ? "▶ Resume"
                  : "▶ Play"}
              </Link>

              <Link href="/about" style={btnInfo}>
                ℹ More Info
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* 🎞️ CONTENT ROWS */}
      <div style={{ marginTop: "-6rem", position: "relative", zIndex: 5 }}>
        {continueWatching.length > 0 && (
          <VideoRow
            title="Continue Watching"
            videos={continueWatching}
          />
        )}

        <VideoRow title="Trending Now" videos={initialVideos} />

        <VideoRow title="Recently Uploaded" videos={initialVideos} />
      </div>
    </main>
  );
}

const btnPlay: React.CSSProperties = {
  background: "#fff",
  color: "#000",
  padding: "0.8rem 2rem",
  borderRadius: "4px",
  fontWeight: "bold",
  textDecoration: "none",
  display: "inline-block",
  transition: "opacity 0.2s",
};

const btnInfo: React.CSSProperties = {
  background: "rgba(109,109,110,0.7)",
  color: "#fff",
  padding: "0.8rem 2rem",
  borderRadius: "4px",
  fontWeight: "bold",
  textDecoration: "none",
  display: "inline-block",
};