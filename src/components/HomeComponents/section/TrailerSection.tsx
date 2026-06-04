"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Video } from "@/types/video";
import { normalizeUrl } from "@/utils/normalizeUrl";
import VideoModal from "@/components/VideoModal";
import PauseIcon from "@/components/icons/PauseIcon";
import PlayIcon from "@/components/icons/PlayIcon";

export default function TrailerSection({
  videos,
  onSelect,
}: {
  videos: Video[];
  onSelect: (v: Video) => void;
}) {
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showControlsOnly, setShowControlsOnly] = useState(false);
  const [selectedModalVideo, setSelectedModalVideo] = useState<Video | null>(
    null,
  );
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  const sectionRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const uiTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const activeVideo = videos[activeVideoIndex] || null;

  // 1. Intersection Observer: Handle view port auto play / pause
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (videoRef.current) {
          if (entry.isIntersecting && isPlaying) {
            videoRef.current.play().catch(() => {});
          } else {
            videoRef.current.pause();
          }
        }
      },
      { threshold: 0.3 },
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, [isPlaying, activeVideoIndex]);

  // 2. Auto-hide Info controls sequence loop
  const startUiTimeout = () => {
    if (uiTimeoutRef.current) clearTimeout(uiTimeoutRef.current);
    setShowControlsOnly(false);

    if (isPlaying) {
      uiTimeoutRef.current = setTimeout(() => {
        setShowControlsOnly(true);
      }, 4000);
    }
  };

  useEffect(() => {
    startUiTimeout();
    return () => {
      if (uiTimeoutRef.current) clearTimeout(uiTimeoutRef.current);
    };
  }, [isPlaying, activeVideoIndex]);

  // 3. Automated Next-Video Loop Cycle & Carousel Alignment Syncer
  const handleVideoEnded = () => {
    const nextIndex = (activeVideoIndex + 1) % videos.length;
    setActiveVideoIndex(nextIndex);
    scrollToCard(nextIndex);
  };

  const scrollToCard = (index: number) => {
    if (carouselRef.current) {
      const cardNodes = carouselRef.current.querySelectorAll(
        ".carousel-thumb-card",
      );
      const targetCard = cardNodes[index] as HTMLElement;
      if (targetCard) {
        carouselRef.current.scrollTo({
          left: targetCard.offsetLeft - carouselRef.current.offsetLeft - 24, // Accounting for paddings
          behavior: "smooth",
        });
      }
    }
  };

  const scrollCarousel = (direction: "left" | "right") => {
    if (carouselRef.current) {
      const { scrollLeft, clientWidth } = carouselRef.current;
      const amount = clientWidth * 0.7;
      const target =
        direction === "left" ? scrollLeft - amount : scrollLeft + amount;

      carouselRef.current.scrollTo({ left: target, behavior: "smooth" });
    }
  };

  const togglePlayback = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
    }
  };

  if (!activeVideo || videos.length === 0) return null;

  return (
    <>
      <section
        ref={sectionRef}
        className="trailer-theater-section"
        onMouseMove={startUiTimeout}
      >
        {/* 🎬 CINEMATIC THEATER HERO BANNER */}
        <div className="theater-banner">
          {activeVideo.videoUrl ? (
            <video
              ref={videoRef}
              key={`banner-stream-${activeVideo.id}`}
              src={normalizeUrl(activeVideo.videoUrl)}
              autoPlay
              muted
              playsInline
              onEnded={handleVideoEnded}
              className="theater-video-bg"
            />
          ) : (
            !brokenImages[`banner-${activeVideo.id}`] && (
              <Image
                src={normalizeUrl(activeVideo.thumbnailUrl)}
                alt=""
                fill
                priority
                unoptimized
                style={{ objectFit: "cover" }}
                onError={() =>
                  setBrokenImages((p) => ({
                    ...p,
                    [`banner-${activeVideo.id}`]: true,
                  }))
                }
              />
            )
          )}

          <div className="theater-gradient-overlay" />

          {/* TEXT CAPTIONS WITH INTELLIGENT CONDITIONAL HIDE STATES */}
          <div
            className={`theater-content-card ${showControlsOnly ? "ui-hidden" : ""}`}
          >
            <span className="live-preview-badge">
              ⚡ Now Previewing Trailer
            </span>
            <h2 className="theater-title">{activeVideo.title}</h2>
            <p className="theater-description">
              {activeVideo.description ||
                "Watch the official cinematic teaser and get an exclusive look ahead."}
            </p>
            <div className="theater-action-row">
              <button
                className="btn-theater-play"
                onClick={() => setSelectedModalVideo(activeVideo)}
              >
                ▶ Watch Full Movie
              </button>
              <button
                className="btn-theater-info"
                onClick={() => onSelect(activeVideo)}
              >
                ℹ More Details
              </button>
            </div>
          </div>

          {/* PREMIUM CUSTOM MEDIA ACCESS CONTROLS BAR */}
          <div className="theater-custom-playback-layer">
            <button
              className="playback-toggle-circle-btn p-5"
              onClick={togglePlayback}
              aria-label={isPlaying ? "Pause video" : "Play video"}
            >
              {isPlaying ? (
                <PauseIcon size={44} color="#ffffff" />
              ) : (
                <PlayIcon size={44} color="#ffffff" />
              )}
            </button>
          </div>
        </div>

        {/* 🎞️ CAROUSEL SELECTION SLIDER TRACK */}
        <div className="carousel-wrapper-track">
          <button
            className="slider-arrow arrow-left"
            onClick={() => scrollCarousel("left")}
            aria-label="Slide left"
          >
            ‹
          </button>
          <button
            className="slider-arrow arrow-right"
            onClick={() => scrollCarousel("right")}
            aria-label="Slide right"
          >
            ›
          </button>

          <div ref={carouselRef} className="carousel-horizontal-scroll">
            {videos.map((video, idx) => {
              const isActive = activeVideoIndex === idx;
              const isImageBroken = brokenImages[`thumb-${video.id}`];

              return (
                <div
                  key={`trailer-thumb-${video.id}`}
                  className={`carousel-thumb-card ${isActive ? "active-thumb" : ""}`}
                  onClick={() => {
                    setActiveVideoIndex(idx);
                    scrollToCard(idx);
                  }}
                >
                  <div className="thumb-image-carrier">
                    {!isImageBroken && (
                      <Image
                        src={normalizeUrl(video.thumbnailUrl)}
                        alt=""
                        fill
                        unoptimized
                        style={{ objectFit: "cover" }}
                        onError={() =>
                          setBrokenImages((p) => ({
                            ...p,
                            [`thumb-${video.id}`]: true,
                          }))
                        }
                      />
                    )}
                    <div className="thumb-blur-layer" />
                    {isActive && (
                      <div className="now-playing-strip">NOW PLAYING</div>
                    )}
                  </div>
                  <p className="thumb-caption-title">{video.title}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* PORTAL INTEGRATION ENTRY */}
      {selectedModalVideo && (
        <VideoModal
          video={selectedModalVideo}
          onClose={() => setSelectedModalVideo(null)}
        />
      )}

      <style>{`
        .trailer-theater-section {
          width: 100%;
          background: #0a0a0a;
          font-family: 'Inter', system-ui, sans-serif;
          margin-bottom: 3rem;
          position: relative;
        }

        .theater-banner {
          position: relative;
          height: 60vh;
          width: 100%;
          background: #111111;
          overflow: hidden;
        }

        .theater-video-bg {
          width: 100%;
          height: 100%;
          object-fit: cover;
          opacity: 0.55;
        }

        .theater-gradient-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, #0a0a0a 0%, transparent 60%),
                      linear-gradient(to right, rgba(10,10,10,0.9) 20%, transparent 75%);
          z-index: 2;
        }

        /* HARDWARE ACCELERATED TRANSPARENCY SHIFTING CORES */
        .theater-content-card {
          position: absolute;
          bottom: 8%;
          left: 4%;
          right: 4%;
          max-width: 640px;
          z-index: 10;
          opacity: 1;
          transform: translateY(0);
          transition: opacity 0.5s cubic-bezier(0.25, 1, 0.5, 1), transform 0.5s cubic-bezier(0.25, 1, 0.5, 1);
        }

        .theater-content-card.ui-hidden {
          opacity: 0;
          transform: translateY(8px);
          pointer-events: none;
        }

        .live-preview-badge {
          color: #e50914;
          font-size: 0.75rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          background: rgba(229, 9, 20, 0.1);
          padding: 4px 8px;
          border-radius: 4px;
          display: inline-block;
          margin-bottom: 12px;
        }

        .theater-title {
          font-size: 2.75rem;
          font-weight: 900;
          line-height: 1.15;
          letter-spacing: -0.02em;
          margin: 0 0 10px 0;
          color: #ffffff;
          text-shadow: 0 4px 10px rgba(0,0,0,0.5);
        }

        .theater-description {
          font-size: 1rem;
          line-height: 1.5;
          color: #cccccc;
          margin: 0 0 20px 0;
          text-shadow: 0 2px 4px rgba(0,0,0,0.4);
          display: -webkit-box;
          WebkitLineClamp: 3;WebkitBoxOrient: vertical;overflow: hidden;}.theater-action-row {display: flex;gap: 12px;}.btn-theater-play {background: #e50914;color: #ffffff;border: none;padding: 10px 24px;border-radius: 6px;font-weight: 700;font-size: 0.95rem;cursor: pointer;box-shadow: 0 4px 15px rgba(229,9,20,0.3);transition: transform 0.2s ease, background 0.2s;}.btn-theater-play:hover {background: #ff1e27;transform: translateY(-1px);}.btn-theater-info {background: rgba(255, 255, 255, 0.1);color: #ffffff;border: 1px solid rgba(255, 255, 255, 0.15);backdrop-filter: blur(10px);padding: 10px 24px;border-radius: 6px;font-weight: 600;font-size: 0.95rem;cursor: pointer;transition: background 0.2s, transform 0.2s;}.btn-theater-info:hover {background: rgba(255, 255, 255, 0.2);transform: translateY(-1px);}/* FIXED PLACEMENT CONTROL TRIGGERS */.theater-custom-playback-layer {position: absolute;bottom: 8%;right: 4%;z-index: 15;}.playback-toggle-circle-btn {width: 44px;height: 44px;border-radius: 50%;background: rgba(10, 10, 10, 0.5);backdrop-filter: blur(8px);border: 1px solid rgba(255, 255, 255, 0.15);color: #fff;font-size: 0.95rem;display: flex;align-items: center;justify-content: center;cursor: pointer;transition: background 0.2s, transform 0.2s;}.playback-toggle-circle-btn:hover {background: #e50914;border-color: #e50914;transform: scale(1.05);}/* CAROUSEL TRACK CONSTRAINTS (STRICT SYSTEM METRICS) */.carousel-wrapper-track {position: relative;padding: 1rem 4% 0 4%;}.carousel-track-heading {font-size: 1.1rem;font-weight: 600;color: #808080;text-transform: uppercase;letter-spacing: 0.04em;margin: 0 0 1rem 0;}.carousel-horizontal-scroll {display: flex;gap: 1.25rem;overflow-x: auto;scrollbar-width: none;padding: 0.5rem 0 1rem 0;scroll-snap-type: x mandatory;scroll-behavior: smooth;}.carousel-horizontal-scroll::-webkit-scrollbar {display: none;}/* CRITICAL SYNC FIX: Guarantee matching dimensions regardless of text length constraints */.carousel-thumb-card {flex: 0 0 220px;width: 220px;cursor: pointer;scroll-snap-align: start;transition: transform 0.25s cubic-bezier(0.25, 1, 0.5, 1);}.carousel-thumb-card:hover {transform: translateY(-4px);}.thumb-image-carrier {position: relative;width: 220px;height: 124px; /* Hardlocked strict 16:9 box scale heights */border-radius: 6px;overflow: hidden;background: #161616;border: 2px solid transparent;transition: border-color 0.2s, box-shadow 0.2s;}.active-thumb .thumb-image-carrier {border-color: #e50914 !important;box-shadow: 0 0 15px rgba(229,9,20,0.4);}.thumb-blur-layer {position: absolute;inset: 0;background: rgba(0,0,0,0.15);transition: opacity 0.2s;}.carousel-thumb-card:hover .thumb-blur-layer {opacity: 0;}.now-playing-strip {position: absolute;bottom: 0; left: 0; right: 0;background: #e50914;color: #ffffff;font-size: 0.65rem;font-weight: 800;text-align: center;padding: 2px 0;letter-spacing: 0.05em;}.thumb-caption-title {margin: 8px 0 0 0;font-size: 0.88rem;font-weight: 500;color: #a3a3a3;white-space: nowrap;overflow: hidden;text-overflow: ellipsis;width: 100%;}.carousel-thumb-card:hover .thumb-caption-title {color: #ffffff;}.active-thumb .thumb-caption-title {color: #ffffff;font-weight: 600;}/* HARDWARE SCROLL ARROWS */.slider-arrow {position: absolute;top: 60%;transform: translateY(-50%);width: 38px;height: 64px;background: rgba(15, 15, 15, 0.6);backdrop-filter: blur(12px);border: 1px solid rgba(255,255,255,0.05);color: #ffffff;font-size: 1.75rem;display: flex;align-items: center;justify-content: center;cursor: pointer;z-index: 25;transition: background 0.2s, color 0.2s;}.arrow-left { left: 2.5%; border-radius: 4px 0 0 4px; }.arrow-right { right: 2.5%; border-radius: 0 4px 4px 0; }.slider-arrow:hover {background: #e50914;color: #ffffff;}@media (max-width: 768px) {.theater-banner { height: 45vh; }.theater-title { font-size: 1.85rem; }.slider-arrow { display: none; }.carousel-thumb-card, .thumb-image-carrier { width: 170px; }.thumb-image-carrier { height: 96px; }}
        .carousel-thumb-card:hover .thumb-image-carrier {border-color: rgba(255,255,255,0.4);}
`}</style>
    </>
  );
}
