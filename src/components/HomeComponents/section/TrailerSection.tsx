"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Hls from "hls.js";
import { Video } from "@/types/video";
import { normalizeUrl } from "@/utils/normalizeUrl";
import VideoModal from "@/components/VideoModal";
import PauseIcon from "@/components/icons/PauseIcon";
import PlayIcon from "@/components/icons/PlayIcon";

// 🔊 Lightweight inline SVG icon components for absolute self-containment
const VolumeMuteIcon = ({ size = 20, color = "#fff" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M11 5L6 9H2v6h4l5 4V5zM23 9l-6 6M17 9l6 6" />
  </svg>
);

const VolumeHighIcon = ({ size = 20, color = "#fff" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M11 5L6 9H2v6h4l5 4V5zM15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14" />
  </svg>
);

const ShareIcon = ({ size = 20, color = "#fff" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13" />
  </svg>
);

const PlusIcon = ({ size = 20, color = "#fff" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const CheckIcon = ({ size = 20, color = "#fff" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export default function TrailerSection({
  videos,
  onSelect,
}: {
  videos: Video[];
  onSelect: (v: Video) => void;
}) {
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [showControlsOnly, setShowControlsOnly] = useState(false);
  const [selectedModalVideo, setSelectedModalVideo] = useState<Video | null>(
    null,
  );
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});
  const [addedToList, setAddedToList] = useState<Record<string, boolean>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Buffer and VP logic
  const [isVideoBuffering, setIsVideoBuffering] = useState(true);
  const [isLoopTransitioning, setIsLoopTransitioning] = useState(false);
  const [isInViewport, setIsInViewport] = useState(false);

  // Custom Observer Overlays (for pausing gracefully out of view)
  const [outOfViewOverlay, setOutOfViewOverlay] = useState(false);

  const sectionRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const queueRef = useRef<HTMLDivElement>(null);
  const uiTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const activeVideo = videos[activeVideoIndex] || null;

  // 1. Playback Engine
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !activeVideo?.hlsManifestUrl) return;

    setIsVideoBuffering(true);
    setIsLoopTransitioning(false);

    const streamUrl = normalizeUrl(activeVideo.hlsManifestUrl);
    let hls: Hls | null = null;

    const handlePlaying = () => setIsVideoBuffering(false);

    const handleTimeUpdate = () => {
      const loopLimit = 60;
      const fadeTime = 1.5;
      if (video.currentTime >= loopLimit - fadeTime && !isLoopTransitioning) {
        setIsLoopTransitioning(true);
      }
      if (video.currentTime >= loopLimit) {
        video.currentTime = 0;
        setIsLoopTransitioning(false);
      }
    };

    video.addEventListener("playing", handlePlaying);
    video.addEventListener("timeupdate", handleTimeUpdate);

    if (Hls.isSupported()) {
      hls = new Hls({ maxMaxBufferLength: 8 });
      hls.loadSource(streamUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (isPlaying && isInViewport) video.play().catch(() => {});
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = streamUrl;
      video.addEventListener("loadedmetadata", () => {
        if (isPlaying && isInViewport) video.play().catch(() => {});
      });
    }

    return () => {
      video.removeEventListener("playing", handlePlaying);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      if (hls) hls.destroy();
    };
  }, [activeVideoIndex, activeVideo?.hlsManifestUrl]);

  // 2. Intersection Observer (Hardened Rules)
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        const currentlyInView = entry.isIntersecting;
        setIsInViewport(currentlyInView);

        if (videoRef.current) {
          if (currentlyInView) {
            setOutOfViewOverlay(false);
            if (isPlaying) {
              videoRef.current.play().catch(() => {});
            }
          } else {
            setOutOfViewOverlay(true);
            videoRef.current.pause();
          }
        }
      },
      { threshold: 0.3 },
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, [isPlaying]);

  // 3. UI Auto-fade
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

  // 4. Queue Syncer
  const handleVideoEnded = () => {
    const nextIndex = (activeVideoIndex + 1) % videos.length;
    setActiveVideoIndex(nextIndex);
    scrollToQueueItem(nextIndex);
  };

  const scrollToQueueItem = (index: number) => {
    if (queueRef.current) {
      const targetElement = queueRef.current.children[index] as HTMLElement;
      if (targetElement) {
        queueRef.current.scrollTo({
          top: targetElement.offsetTop - 80,
          behavior: "smooth",
        });
      }
    }
  };

  // Actions
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

  const toggleAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted(!isMuted);
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
  };

  // Marketing CTA actions
  const showToast = (message: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(message);
    toastTimeoutRef.current = setTimeout(() => setToastMessage(null), 3000);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href).catch(() => {});
    showToast("Link Copied to Clipboard!");
  };

  const handleListToggle = () => {
    const isAdded = addedToList[activeVideo.id!];
    setAddedToList((prev) => ({ ...prev, [activeVideo.id!]: !isAdded }));
    showToast(isAdded ? "Removed from My List" : "Added to My List");
  };

  if (!activeVideo || videos.length === 0) return null;

  return (
    <>
      <section
        ref={sectionRef}
        className="trailer-theater-section"
        onMouseMove={startUiTimeout}
      >
        {/* VIEWPORT PAUSE OVERLAY */}
        <div
          className={`viewport-suspend-overlay ${outOfViewOverlay ? "suspended" : ""}`}
        >
          <div className="suspend-content">
            <PauseIcon size={48} color="rgba(255,255,255,0.7)" />
            <p>Paused for bandwidth</p>
          </div>
        </div>

        {/* 🎬 CINEMATIC HERO BACKGROUND (Left Side Focus) */}
        <div className="theater-banner">
          {!brokenImages[`banner-${activeVideo.id}`] && (
            <div
              className={`theater-thumbnail-wrapper ${!isVideoBuffering ? "fade-out" : ""}`}
            >
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
            </div>
          )}

          {activeVideo.hlsManifestUrl && (
            <video
              ref={videoRef}
              autoPlay
              muted={isMuted}
              playsInline
              onEnded={handleVideoEnded}
              className={`theater-video-bg ${!isVideoBuffering ? "active-playing" : ""} ${isLoopTransitioning ? "loop-fade-out" : "loop-fade-in"}`}
              style={{ pointerEvents: "none" }}
            />
          )}

          <div className="theater-gradient-overlay" />
          <div className="vertical-queue-shadow" />

          {/* LEFT-ALIGNED TEXT CAPTIONS & MARKETING ACTIONS */}
          <div
            className={`theater-content-card ${showControlsOnly ? "ui-hidden" : ""}`}
          >
            <div className="marketing-badges">
              <span className="live-preview-badge">🔥 Trending #1</span>
              <span className="tech-badge">4K Ultra HD</span>
              <span className="tech-badge">Dolby Vision</span>
            </div>

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

              <div className="action-circle-group">
                <button
                  className="circle-action-btn"
                  onClick={handleListToggle}
                  title="Add to List"
                >
                  {addedToList[activeVideo.id!] ? (
                    <CheckIcon color="#3b82f6" />
                  ) : (
                    <PlusIcon />
                  )}
                </button>
                <button
                  className="circle-action-btn"
                  onClick={handleShare}
                  title="Share"
                >
                  <ShareIcon />
                </button>
              </div>

              <button
                className="btn-theater-info"
                onClick={() => onSelect(activeVideo)}
              >
                ℹ More Details
              </button>
            </div>
          </div>

          {/* MEDIA CONTROLS OVERLAY (Bottom Left below content) */}
          <div
            className={`theater-custom-playback-layer ${showControlsOnly ? "ui-fade" : ""}`}
          >
            <button
              className="playback-toggle-circle-btn p-5"
              onClick={togglePlayback}
              aria-label="Toggle Play"
            >
              {isPlaying ? (
                <PauseIcon size={32} color="#ffffff" />
              ) : (
                <PlayIcon size={32} color="#ffffff" />
              )}
            </button>
            <button
              className="playback-toggle-circle-btn p-5"
              onClick={toggleAudio}
              aria-label="Toggle Audio"
            >
              {isMuted ? (
                <VolumeMuteIcon size={32} color="#ffffff" />
              ) : (
                <VolumeHighIcon size={32} color="#ffffff" />
              )}
            </button>
          </div>
        </div>

        {/* 🎞️ NEW: VERTICAL RIGHT-SIDE QUEUE */}
        <div className="vertical-queue-panel">
          <h3 className="queue-title text-gradient">Up Next</h3>
          <div className="queue-scroll" ref={queueRef}>
            {videos.map((video, idx) => {
              const isActive = activeVideoIndex === idx;
              const isImageBroken = brokenImages[`thumb-${video.id}`];

              return (
                <div
                  key={`trailer-thumb-${video.id}`}
                  className={`vertical-thumb-card ${isActive ? "active-thumb" : ""}`}
                  onClick={() => {
                    setActiveVideoIndex(idx);
                    scrollToQueueItem(idx);
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
                  <div className="thumb-meta-info">
                    <p className="thumb-caption-title">{video.title}</p>
                    <p className="thumb-caption-sub">Feature Film</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* TOAST SYSTEM */}
        <div className={`toast-notification ${toastMessage ? "visible" : ""}`}>
          {toastMessage}
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
          background: #141414;
          font-family: 'Inter', system-ui, sans-serif;
          margin-bottom: 3rem;
          position: relative;
          display: flex;
          height: 75vh;
          overflow: hidden;
          border-radius: 0px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.5);
        }

        .viewport-suspend-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.85);
          z-index: 50;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.5s ease;
        }
        .viewport-suspend-overlay.suspended {
          opacity: 1;
        }
        .suspend-content {
          text-align: center;
          color: rgba(255,255,255,0.7);
          font-weight: 500;
          letter-spacing: 0.05em;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }

        .theater-banner {
          position: relative;
          flex: 1;
          background: #141414;
          overflow: hidden;
        }

        .theater-video-bg, .theater-thumbnail-wrapper {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .theater-thumbnail-wrapper {
          transition: opacity 0.8s ease;
          z-index: 1;
        }
        .theater-thumbnail-wrapper.fade-out {
          opacity: 0;
          pointer-events: none;
        }

        .theater-video-bg { opacity: 0.65; z-index: 0; }

        .theater-gradient-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, #141414 0%, transparent 60%),
                      linear-gradient(to right, rgba(20,20,20,0.95) 15%, transparent 60%);
          z-index: 2;
        }

        .vertical-queue-shadow {
          position: absolute;
          top: 0; bottom: 0; right: 0;
          width: 20%;
          background: linear-gradient(to left, rgba(20,20,20,0.85) 0%, transparent 100%);
          z-index: 2;
          pointer-events: none;
        }

        /* HARDWARE ACCELERATED TRANSPARENCY SHIFTING CORES */
        .theater-content-card {
          position: absolute;
          bottom: 15%;
          left: 5%;
          max-width: 600px;
          z-index: 10;
          opacity: 1;
          transform: translateY(0);
          transition: opacity 0.5s cubic-bezier(0.25, 1, 0.5, 1), transform 0.5s cubic-bezier(0.25, 1, 0.5, 1);
        }

        .theater-content-card.ui-hidden {
          opacity: 0.2;
          transform: translateY(8px);
        }

        .marketing-badges {
          display: flex;
          gap: 12px;
          margin-bottom: 12px;
          align-items: center;
          flex-wrap: wrap;
        }

        .live-preview-badge {
          color: #ffffff;
          font-size: 0.75rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          background: linear-gradient(to right, #3b82f6, #ec4899);
          padding: 4px 10px;
          border-radius: 4px;
          box-shadow: 0 4px 15px rgba(236,72,153,0.3);
        }

        .tech-badge {
          color: #cccccc;
          font-size: 0.7rem;
          font-weight: 700;
          border: 1px solid rgba(255,255,255,0.3);
          padding: 3px 8px;
          border-radius: 3px;
        }

        .theater-title {
          font-size: 3rem;
          font-weight: 900;
          line-height: 1.1;
          letter-spacing: -0.02em;
          margin: 0 0 12px 0;
          color: #ffffff;
          text-shadow: 0 4px 15px rgba(0,0,0,0.7);
        }

        .theater-description {
          font-size: 1.05rem;
          line-height: 1.5;
          color: #dddddd;
          margin: 0 0 24px 0;
          text-shadow: 0 2px 8px rgba(0,0,0,0.8);
          display: -webkit-box;
          WebkitLineClamp: 3;
          WebkitBoxOrient: vertical;
          overflow: hidden;
        }

        .theater-action-row {
          display: flex;
          gap: 16px;
          align-items: center;
        }

        .btn-theater-play {
          background: linear-gradient(to right, #3b82f6, #ec4899);
          color: #ffffff;
          border: none;
          padding: 12px 28px;
          border-radius: 8px;
          font-weight: 700;
          font-size: 1rem;
          cursor: pointer;
          box-shadow: 0 4px 20px rgba(59, 130, 246, 0.4);
          transition: transform 0.2s ease, box-shadow 0.2s, filter 0.2s;
        }
        .btn-theater-play:hover {
          transform: translateY(-2px);
          filter: brightness(1.1);
          box-shadow: 0 6px 25px rgba(236, 72, 153, 0.5);
        }

        .btn-theater-info {
          background: rgba(255, 255, 255, 0.1);
          color: #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(10px);
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.95rem;
          cursor: pointer;
          transition: background 0.2s, transform 0.2s;
        }
        .btn-theater-info:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: translateY(-2px);
        }

        .action-circle-group {
          display: flex;
          gap: 10px;
        }

        .circle-action-btn {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.15);
          backdrop-filter: blur(10px);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.25s ease;
        }
        .circle-action-btn:hover {
          background: rgba(255,255,255,0.2);
          border-color: #3b82f6;
          transform: translateY(-2px) scale(1.05);
        }

        /* MEDIA CONTROLS OVERLAY */
        .theater-custom-playback-layer {
          position: absolute;
          bottom: 5%;
          right: 5%;
          z-index: 15;
          display: flex;
          gap: 12px;
          transition: opacity 0.4s;
        }
        .theater-custom-playback-layer.ui-fade {
          opacity: 0.3;
        }
        .theater-custom-playback-layer.ui-fade:hover {
          opacity: 1;
        }

        .playback-toggle-circle-btn {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .playback-toggle-circle-btn:hover {
          background: rgba(255,255,255,0.1);
          transform: scale(1.1);
          border-color: #ec4899;
          box-shadow: 0 0 15px rgba(236,72,153,0.3);
        }

        /* 🆕 VERTICAL QUEUE PANEL */
        .vertical-queue-panel {
          width: 320px;
          background: rgba(20, 20, 20, 0.6);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border-left: 1px solid rgba(255,255,255,0.05);
          display: flex;
          flex-direction: column;
          z-index: 10;
        }

        .queue-title {
          padding: 24px 24px 12px 24px;
          font-size: 1.1rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin: 0;
          background: linear-gradient(to right, #3b82f6, #ec4899);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .queue-scroll {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 0 16px 24px 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          scrollbar-width: thin;
          scrollbar-color: rgba(255,255,255,0.2) transparent;
        }
        .queue-scroll::-webkit-scrollbar { width: 4px; }
        .queue-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 4px; }

        .vertical-thumb-card {
          flex-shrink: 0;
          display: flex;
          gap: 12px;
          padding: 8px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.25s ease;
          border: 1px solid transparent;
        }
        .vertical-thumb-card:hover {
          background: rgba(255,255,255,0.05);
        }
        .vertical-thumb-card.active-thumb {
          background: rgba(255,255,255,0.08);
          border-color: rgba(236,72,153,0.3);
          box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        }

        .vertical-thumb-card .thumb-image-carrier {
          position: relative;
          width: 110px;
          height: 62px;
          border-radius: 6px;
          overflow: hidden;
          background: #111;
          border: 1px solid transparent;
          transition: border-color 0.2s;
        }
        .vertical-thumb-card.active-thumb .thumb-image-carrier {
          border-color: #3b82f6;
        }

        .thumb-blur-layer {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.3);
          transition: opacity 0.2s;
        }
        .vertical-thumb-card:hover .thumb-blur-layer { opacity: 0; }
        .vertical-thumb-card.active-thumb .thumb-blur-layer { opacity: 0; }

        .now-playing-strip {
          position: absolute;
          bottom: 0; left: 0; right: 0;
          background: linear-gradient(to right, #3b82f6, #ec4899);
          color: #ffffff;
          font-size: 0.55rem;
          font-weight: 800;
          text-align: center;
          padding: 2px 0;
          letter-spacing: 0.05em;
        }

        .thumb-meta-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          overflow: hidden;
        }

        .thumb-caption-title {
          margin: 0 0 4px 0;
          font-size: 0.85rem;
          font-weight: 600;
          color: #d4d4d4;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          transition: color 0.2s;
        }
        .vertical-thumb-card:hover .thumb-caption-title,
        .vertical-thumb-card.active-thumb .thumb-caption-title {
          color: #ffffff;
        }

        .thumb-caption-sub {
          margin: 0;
          font-size: 0.7rem;
          color: #737373;
          font-weight: 500;
        }

        /* TOAST ANIMATION */
        .toast-notification {
          position: absolute;
          top: 20px;
          left: 50%;
          transform: translateX(-50%) translateY(-20px);
          background: rgba(15,23,42,0.9);
          backdrop-filter: blur(10px);
          color: #fff;
          padding: 12px 24px;
          border-radius: 30px;
          font-size: 0.9rem;
          font-weight: 600;
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
          border: 1px solid rgba(59,130,246,0.3);
          opacity: 0;
          pointer-events: none;
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          z-index: 100;
        }
        .toast-notification.visible {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }

        @media (max-width: 900px) {
          .trailer-theater-section {
            flex-direction: column;
            height: auto;
          }
          .theater-banner {
            height: 50vh;
            flex: none;
          }
          .vertical-queue-panel {
            width: 100%;
            height: 30vh;
            border-left: none;
            border-top: 1px solid rgba(255,255,255,0.05);
          }
          .theater-title { font-size: 2rem; }
          .marketing-badges { display: none; }
        }
      `}</style>
    </>
  );
}
