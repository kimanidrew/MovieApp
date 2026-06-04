"use client";

import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import VideoRow from "@/components/VideoRow";
import Link from "next/link";
import VideoModal from "@/components/VideoModal";
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

export default function HomeClient({
  initialVideos,
}: {
  initialVideos: Video[];
}) {
  const [history, setHistory] = useState<any>({});
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [hoveredTrailer, setHoveredTrailer] = useState<string | null>(null);
  const [hoveredShort, setHoveredShort] = useState<string | null>(null);
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  const shortsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      setHistory(JSON.parse(localStorage.getItem("movieflix-history") || "{}"));
    } catch {}
  }, []);

  const isContinueWatching = (id: string) => {
    const item = history[id];
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
        (history[b.id]?.updatedAt || 0) - (history[a.id]?.updatedAt || 0),
    );

  const heroVideo = initialVideos?.[0];
  const heroImage = normalizeUrl(heroVideo?.thumbnailUrl);

  const trailerVideos = initialVideos.slice(0, 6);
  const shortsVideos = initialVideos.slice(1, 9);

  const scrollShorts = (direction: "left" | "right") => {
    if (shortsContainerRef.current) {
      const { scrollLeft, clientWidth } = shortsContainerRef.current;
      const offset = direction === "left" ? -clientWidth / 2 : clientWidth / 2;
      shortsContainerRef.current.scrollTo({
        left: scrollLeft + offset,
        behavior: "smooth",
      });
    }
  };

  return (
    <main style={mainLayout}>
      {/* 🎬 WIDESCREEN CINEMATIC HERO SECTION */}
      {heroVideo && (
        <section style={heroSection}>
          {heroVideo.videoUrl ? (
            <video
              src={normalizeUrl(heroVideo.videoUrl)}
              autoPlay
              muted
              loop
              playsInline
              style={heroVideoBg}
            />
          ) : (
            !brokenImages[`hero-${heroVideo.id}`] && (
              <Image
                src={heroImage}
                alt=""
                fill
                priority
                quality={90}
                unoptimized
                style={{ objectFit: "cover" }}
                sizes="100vw"
                onError={() =>
                  setBrokenImages((p) => ({
                    ...p,
                    [`hero-${heroVideo.id}`]: true,
                  }))
                }
              />
            )
          )}

          <div style={heroGradientOverlay} />

          <div style={heroContentCard}>
            <h1 style={heroTitle}>{heroVideo.title}</h1>

            <div style={heroMetaRow}>
              <span style={matchBadge}>99% Match</span>
              <span>{heroVideo.releaseYear || "2026"}</span>
              <span style={hdBadge}>Ultra HD</span>
              <span>Spatial Audio</span>
            </div>

            <p style={heroDescription}>
              {heroVideo.description ||
                "Immerse yourself in our premium, cutting-edge cinematic experience."}
            </p>

            <div style={actionButtonGroup}>
              <Link href={`/watch/${heroVideo.id}`} style={btnPlay}>
                {isContinueWatching(heroVideo.id)
                  ? "🔄 Resume Play"
                  : "▶ Play Now"}
              </Link>

              <button
                onClick={() => setSelectedVideo(heroVideo)}
                style={btnInfo}
              >
                ℹ More Details
              </button>
            </div>
          </div>
        </section>
      )}

      {/* 🎞️ CONTENT CONTAINER - UNIFIED MARGINS FOR ALL ROWS */}
      <div style={rowsWrapper}>
        {continueWatching.length > 0 && (
          <VideoRow title="Continue Your Journey" videos={continueWatching} />
        )}

        <VideoRow title="Trending Blockbusters" videos={initialVideos} />

        {/* 🍿 CINEMATIC TRAILERS GRID */}
        <section style={sectionContainer}>
          <h2 style={sectionHeading}>Latest Trailers & Previews</h2>
          <div style={trailersGrid}>
            {trailerVideos.map((video) => {
              const isHovered = hoveredTrailer === video.id;
              return (
                <div
                  key={`trailer-${video.id}`}
                  style={{
                    ...trailerCard,
                    transform: isHovered
                      ? "scale(1.03) translateY(-4px)"
                      : "scale(1) translateY(0)",
                    borderColor: isHovered
                      ? "rgba(255,255,255,0.2)"
                      : "rgba(255,255,255,0.03)",
                  }}
                  onMouseEnter={() => setHoveredTrailer(video.id)}
                  onMouseLeave={() => setHoveredTrailer(null)}
                  onClick={() => setSelectedVideo(video)}
                >
                  <div style={trailerImageWrapper}>
                    {!brokenImages[`trailer-${video.id}`] && (
                      <Image
                        src={normalizeUrl(video.thumbnailUrl)}
                        alt=""
                        fill
                        unoptimized
                        style={{ objectFit: "cover" }}
                        onError={() =>
                          setBrokenImages((p) => ({
                            ...p,
                            [`trailer-${video.id}`]: true,
                          }))
                        }
                      />
                    )}
                    <div
                      style={{
                        ...playOverlayIcon,
                        opacity: isHovered ? 1 : 0,
                        backgroundColor: isHovered
                          ? "rgba(0,0,0,0.5)"
                          : "rgba(0,0,0,0.2)",
                      }}
                    >
                      <span style={playIconGlyph}>▶</span>
                    </div>
                  </div>
                  <h3 style={trailerCardTitle}>{video.title}</h3>
                  <p style={trailerCardSub}>Official Preview</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* 📱 TIKTOK / REELS STYLE VERTICAL SHORTS CAROUSEL */}
        <section style={sectionContainer}>
          <div style={shortsHeaderRow}>
            <h2 style={sectionHeading}>Quick Bites & Shorts</h2>
            <div style={carouselControls}>
              <button onClick={() => scrollShorts("left")} style={arrowBtn}>
                ‹
              </button>
              <button onClick={() => scrollShorts("right")} style={arrowBtn}>
                ›
              </button>
            </div>
          </div>

          <div ref={shortsContainerRef} style={shortsRowScroll}>
            {shortsVideos.map((video) => {
              const isHovered = hoveredShort === video.id;
              return (
                <div
                  key={`short-${video.id}`}
                  style={{
                    ...verticalShortCard,
                    transform: isHovered ? "scale(1.05)" : "scale(1)",
                    boxShadow: isHovered
                      ? "0 10px 25px rgba(0,0,0,0.8)"
                      : "none",
                  }}
                  onMouseEnter={() => setHoveredShort(video.id)}
                  onMouseLeave={() => setHoveredShort(null)}
                  onClick={() => setSelectedVideo(video)}
                >
                  {!brokenImages[`short-${video.id}`] && (
                    <Image
                      src={normalizeUrl(video.thumbnailUrl)}
                      alt=""
                      fill
                      unoptimized
                      style={{
                        ...shortImageStyle,
                        transform: isHovered ? "scale(1.1)" : "scale(1)",
                      }}
                      onError={() =>
                        setBrokenImages((p) => ({
                          ...p,
                          [`short-${video.id}`]: true,
                        }))
                      }
                    />
                  )}
                  <div style={shortsGradientOverlay} />
                  <div style={shortsContentBadge}>⚡ Short</div>
                  <div style={shortsMetaContainer}>
                    <p style={shortsTitleText}>{video.title}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <VideoRow title="Critically Acclaimed" videos={initialVideos} />
      </div>

      {/* ✅ MODAL PORTAL INTEGRATION */}
      {selectedVideo && (
        <VideoModal
          video={selectedVideo}
          onClose={() => setSelectedVideo(null)}
        />
      )}
    </main>
  );
}

/* 🎨 THEME STYLING SHEETS */
const mainLayout: React.CSSProperties = {
  background: "#0a0a0a",
  color: "#ffffff",
  minHeight: "100vh",
  fontFamily: "'Inter', system-ui, sans-serif",
  overflowX: "hidden",
  width: "100%",
};

const heroSection: React.CSSProperties = {
  position: "relative",
  height: "85vh",
  width: "100%",
  overflow: "hidden",
  background: "#121212",
};

const heroVideoBg: React.CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
  opacity: 0.65,
};

const heroGradientOverlay: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  background:
    "linear-gradient(to top, #0a0a0a 5%, transparent 45%), linear-gradient(to right, rgba(10,10,10,0.9) 25%, transparent 70%)",
  zIndex: 1,
};

const heroContentCard: React.CSSProperties = {
  position: "absolute",
  bottom: "15%",
  left: "4%",
  maxWidth: "680px",
  zIndex: 2,
};

const heroTitle: React.CSSProperties = {
  fontSize: "4rem",
  fontWeight: 900,
  lineHeight: 1.1,
  letterSpacing: "-0.03em",
  margin: 0,
  textShadow: "0 4px 12px rgba(0,0,0,0.5)",
};

const heroMetaRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "1.2rem",
  margin: "1.2rem 0",
  color: "#b3b3b3",
  fontSize: "0.95rem",
};

const matchBadge: React.CSSProperties = {
  color: "#00df89",
  fontWeight: 700,
  background: "rgba(0, 223, 137, 0.1)",
  padding: "0.2rem 0.6rem",
  borderRadius: "4px",
};
const hdBadge: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,0.3)",
  padding: "0.1rem 0.4rem",
  fontSize: "0.75rem",
  borderRadius: "3px",
  fontWeight: 600,
};
const heroDescription: React.CSSProperties = {
  color: "#e0e0e0",
  fontSize: "1.1rem",
  lineHeight: 1.6,
  display: "-webkit-box",
  WebkitLineClamp: 3,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
};
const actionButtonGroup: React.CSSProperties = {
  display: "flex",
  gap: "1rem",
  marginTop: "2rem",
};
const btnPlay: React.CSSProperties = {
  background: "#ffffff",
  color: "#000000",
  padding: "0.9rem 2.6rem",
  borderRadius: "6px",
  fontWeight: 700,
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  fontSize: "1.05rem",
  boxShadow: "0 4px 15px rgba(255,255,255,0.15)",
  border: "none",
  cursor: "pointer",
};
const btnInfo: React.CSSProperties = {
  background: "rgba(255, 255, 255, 0.12)",
  color: "#fff",
  padding: "0.9rem 2.6rem",
  borderRadius: "6px",
  fontWeight: 600,
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  fontSize: "1.05rem",
  backdropFilter: "blur(10px)",
  border: "1px solid rgba(255,255,255,0.1)",
  cursor: "pointer",
};
const rowsWrapper: React.CSSProperties = {
  marginTop: "-5rem",
  position: "relative",
  zIndex: 5,
  padding: "0 4% 4rem 4%",
  display: "flex",
  flexDirection: "column",
};
const sectionContainer: React.CSSProperties = {
  margin: "2rem 0 3rem 0",
  padding: 0,
};
const sectionHeading: React.CSSProperties = {
  fontSize: "1.75rem",
  fontWeight: 700,
  letterSpacing: "-0.02em",
  marginBottom: "1.5rem",
};
const trailersGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
  gap: "1.5rem",
};
const trailerCard: React.CSSProperties = {
  background: "#121212",
  borderRadius: "10px",
  overflow: "hidden",
  cursor: "pointer",
  border: "1px solid rgba(255,255,255,0.03)",
  transition: "transform 0.25s ease-out, border-color 0.25s ease-out",
};
const trailerImageWrapper: React.CSSProperties = {
  position: "relative",
  aspectRatio: "16/9",
  width: "100%",
  background: "#161616",
};
const playOverlayIcon: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "opacity 0.2s ease-out, background-color 0.2s ease-out",
  zIndex: 3,
};
const playIconGlyph: React.CSSProperties = {
  background: "rgba(229, 9, 20, 0.9)",
  borderRadius: "50%",
  width: "50px",
  height: "50px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  paddingLeft: "4px",
  fontSize: "1.2rem",
  boxShadow: "0 4px 20px rgba(229,9,20,0.4)",
};
const trailerCardTitle: React.CSSProperties = {
  fontSize: "1.1rem",
  fontWeight: 600,
  margin: "0.75rem 1rem 0.25rem 1rem",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};
const trailerCardSub: React.CSSProperties = {
  fontSize: "0.85rem",
  color: "#7f7f7f",
  margin: "0 1rem 1rem 1rem",
};
const shortsHeaderRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "1.5rem",
};
const carouselControls: React.CSSProperties = {
  display: "flex",
  gap: "0.5rem",
};
const arrowBtn: React.CSSProperties = {
  background: "rgba(255,255,255,0.08)",
  color: "#fff",
  border: "none",
  width: "36px",
  height: "36px",
  borderRadius: "50%",
  fontSize: "1.5rem",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  transition: "background 0.2s",
};
const shortsRowScroll: React.CSSProperties = {
  display: "flex",
  gap: "1.2rem",
  overflowX: "auto",
  scrollSnapType: "x mandatory",
  paddingBottom: "1.5rem",
  scrollbarWidth: "none",
};
const verticalShortCard: React.CSSProperties = {
  position: "relative",
  flex: "0 0 210px",
  aspectRatio: "9/16",
  borderRadius: "12px",
  overflow: "hidden",
  cursor: "pointer",
  scrollSnapAlign: "start",
  background: "#161616",
  transition: "transform 0.25s ease-out, box-shadow 0.25s ease-out",
};
const shortImageStyle: React.CSSProperties = {
  objectFit: "cover",
  transition: "transform 0.35s ease-out",
};
const shortsGradientOverlay: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  background:
    "linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.3) 40%, transparent 100%)",
  zIndex: 1,
};
const shortsContentBadge: React.CSSProperties = {
  position: "absolute",
  top: "12px",
  left: "12px",
  background: "#E50914",
  padding: "0.2rem 0.5rem",
  borderRadius: "4px",
  fontSize: "0.75rem",
  fontWeight: "bold",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  zIndex: 2,
};
const shortsMetaContainer: React.CSSProperties = {
  position: "absolute",
  bottom: "16px",
  left: "12px",
  right: "12px",
  zIndex: 2,
};
const shortsTitleText: React.CSSProperties = {
  margin: 0,
  fontSize: "0.95rem",
  fontWeight: 600,
  lineHeight: 1.3,
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
};
