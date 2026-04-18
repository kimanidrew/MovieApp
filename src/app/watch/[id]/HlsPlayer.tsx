"use client";

import React, { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import Link from "next/link";

interface HlsPlayerProps {
  videoId: string;
  src: string;
  poster?: string;
  title?: string;
  isProcessing?: boolean;
  autoPlay?: boolean;
}

const HISTORY_KEY = "movieflix-history";

export default function HlsPlayer({
  videoId,
  src,
  poster,
  title = "Video",
  isProcessing = false,
  autoPlay = true,
}: HlsPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const lastSavedTime = useRef<number>(0);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  // ✅ VIDEO LOADING (FIXED)
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let hls: Hls | null = null;

    // Reset state
    setIsBuffering(true);

    if (src.endsWith(".m3u8")) {
      if (Hls.isSupported()) {
        hls = new Hls({
          capLevelToPlayerSize: true,
          maxBufferLength: 30, // 🔥 limit buffer size
          maxMaxBufferLength: 60,
        });

        hls.loadSource(src);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setIsBuffering(false);
          if (autoPlay) video.play().catch(() => {});
        });
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = src;
      }
    } else {
      // ✅ MP4 OPTIMIZATION
      video.src = src;
      video.load(); // 🔥 important for large files

      const playWhenReady = () => {
        setIsBuffering(false);
        if (autoPlay) video.play().catch(() => {});
      };

      video.addEventListener("canplay", playWhenReady, { once: true });
    }

    return () => {
      if (hls) hls.destroy();
    };
  }, [src, autoPlay]);

  // ✅ BUFFER EVENTS
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onWaiting = () => setIsBuffering(true);
    const onPlaying = () => setIsBuffering(false);

    video.addEventListener("waiting", onWaiting);
    video.addEventListener("playing", onPlaying);

    return () => {
      video.removeEventListener("waiting", onWaiting);
      video.removeEventListener("playing", onPlaying);
    };
  }, []);

  // ✅ PROGRESS SAVE (unchanged)
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;

    const current = videoRef.current.currentTime;
    setProgress(current);

    if (Math.abs(current - lastSavedTime.current) > 5) {
      lastSavedTime.current = current;
      try {
        const hist = JSON.parse(localStorage.getItem(HISTORY_KEY) || "{}");
        hist[videoId] = {
          time: current,
          duration: videoRef.current.duration,
        };
        localStorage.setItem(HISTORY_KEY, JSON.stringify(hist));
      } catch {}
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    isPlaying ? videoRef.current.pause() : videoRef.current.play();
  };

  const formatTime = (time: number) => {
    if (!time || isNaN(time)) return "0:00";
    const min = Math.floor(time / 60);
    const sec = Math.floor(time % 60);
    return `${min}:${sec < 10 ? "0" : ""}${sec}`;
  };

  return (
    <div ref={wrapperRef} className="player">
      <video
        ref={videoRef}
        poster={poster}
        playsInline
        preload="metadata" // 🔥 FIXED
        crossOrigin="anonymous" // 🔥 important for CDN
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={() =>
          setDuration(videoRef.current?.duration || 0)
        }
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        className="video"
      />

      {/* 🔥 BUFFER LOADER */}
      {isBuffering && (
        <div className="buffering">
          <div className="spinner" />
        </div>
      )}

      {!isPlaying && !isBuffering && (
        <div className="center-play" onClick={togglePlay}>
          ▶
        </div>
      )}

      <div className="controls">
        {formatTime(progress)} / {formatTime(duration)}
      </div>

      <style>{`
        .player {
          position: relative;
          width: 100%;
          height: 100%;
          background: black;
        }

        .video {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        .buffering {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0,0,0,0.4);
        }

        .spinner {
          width: 50px;
          height: 50px;
          border: 4px solid rgba(255,255,255,0.2);
          border-top: 4px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .center-play {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 60px;
          color: white;
          cursor: pointer;
        }

        .controls {
          position: absolute;
          bottom: 10px;
          left: 10px;
          color: white;
        }
      `}</style>
    </div>
  );
}