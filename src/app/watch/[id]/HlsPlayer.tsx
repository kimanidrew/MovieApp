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
  const hlsRef = useRef<Hls | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedTime = useRef<number>(0);

  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);

  // =========================
  // ✅ HLS / MP4 INITIALIZER
  // =========================
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const cleanup = () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };

    cleanup();

    const startPlayback = () => {
      if (autoPlay) {
        video.play().catch(() => {});
      }
    };

    const isHls = src.includes(".m3u8");

    // =========================
    // 🔥 HLS STREAM HANDLING
    // =========================
    if (isHls) {
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: false,

          // 🔥 Adaptive bitrate tuning (IMPORTANT)
          capLevelToPlayerSize: true,
          startLevel: -1, // auto
          maxBufferLength: 60,
          maxMaxBufferLength: 120,
          backBufferLength: 30,
          fragLoadingTimeOut: 20000,
        });

        hlsRef.current = hls;

        hls.loadSource(src);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          startPlayback();
        });

        hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
          // optional debug hook for adaptive quality switching
          // console.log("Quality level:", data.level);
        });

        hls.on(Hls.Events.ERROR, (_, data) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                hls.recoverMediaError();
                break;
              default:
                cleanup();
                break;
            }
          }
        });
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        // =========================
        // 🍎 SAFARI NATIVE HLS
        // =========================
        video.src = src;
        video.addEventListener("loadedmetadata", startPlayback, {
          once: true,
        });
      }
    } else {
      // =========================
      // MP4 / NORMAL VIDEO
      // =========================
      video.src = src;
      video.preload = "metadata";
      video.load();

      video.addEventListener(
        "loadeddata",
        () => {
          video.currentTime = 0.01;
        },
        { once: true }
      );

      video.addEventListener("canplay", startPlayback, { once: true });
    }

    return () => {
      cleanup();
      video.pause();
      video.removeAttribute("src");
      video.load();
    };
  }, [src, autoPlay]);

  // =========================
  // BUFFER TRACKING
  // =========================
  const updateBuffered = () => {
    const video = videoRef.current;
    if (!video || !video.duration) return;

    try {
      const bufferedEnd = video.buffered.length
        ? video.buffered.end(video.buffered.length - 1)
        : 0;

      setBuffered((bufferedEnd / video.duration) * 100);
    } catch {}
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;

    const current = videoRef.current.currentTime;
    setProgress(current);

    updateBuffered();

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

  const handleLoadedMetadata = () => {
    if (videoRef.current) setDuration(videoRef.current.duration);
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    isPlaying ? videoRef.current.pause() : videoRef.current.play();
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setProgress(time);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = Number(e.target.value);
    setVolume(vol);

    if (videoRef.current) {
      videoRef.current.volume = vol;
      videoRef.current.muted = vol === 0;
      setIsMuted(vol === 0);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const skipTime = (amount: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime += amount;
    }
  };

  const toggleFullscreen = async () => {
    if (!wrapperRef.current) return;

    if (!document.fullscreenElement) {
      await wrapperRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current)
      clearTimeout(controlsTimeoutRef.current);

    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 4000);
  };

  const handleMouseLeave = () => {
    if (isPlaying) setShowControls(false);
  };

  const formatTime = (time: number) => {
    if (!time || isNaN(time)) return "0:00";
    const min = Math.floor(time / 60);
    const sec = Math.floor(time % 60);
    return `${min}:${sec < 10 ? "0" : ""}${sec}`;
  };

  return (
    <div
      ref={wrapperRef}
      className={`netflix-player-wrapper ${showControls ? "" : "hide-cursor"}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <video
        ref={videoRef}
        poster={poster}
        playsInline
        crossOrigin="anonymous"
        onClick={togglePlay}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onProgress={updateBuffered}
        className="netflix-video"
      />

      {/* ===== UI (UNCHANGED) ===== */}
      <div className={`netflix-header ${showControls ? "visible" : ""}`}>
        <Link href="/" className="back-button">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5m7 7l-7-7 7-7" />
          </svg>
        </Link>
        <h2 className="header-title">{title}</h2>

        {isProcessing && (
          <div className="processing-badge">
            Adaptive Streaming (HLS Processing...)
          </div>
        )}
      </div>

      {!isPlaying && (
        <div className="center-play" onClick={togglePlay}>
          <svg viewBox="0 0 24 24" className="center-icon">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      )}

      <div className={`netflix-controls ${showControls ? "visible" : ""}`}>
        <div className="progress-container">
          <div className="buffer-bar" style={{ width: `${buffered}%` }} />
          <input
            type="range"
            min="0"
            max={duration || 100}
            value={progress}
            onChange={handleSeek}
            className="progress-slider"
          />
          <div
            className="progress-fill"
            style={{ width: `${(progress / (duration || 1)) * 100}%` }}
          />
        </div>

        <div className="controls-row">
          <div className="controls-left">
            <button onClick={togglePlay} className="control-btn play-btn">
              {isPlaying ? "❚❚" : "▶"}
            </button>

            <button onClick={() => skipTime(-10)} className="control-btn">
              -10
            </button>

            <button onClick={() => skipTime(10)} className="control-btn">
              +10
            </button>

            <div className="volume-container">
              <button onClick={toggleMute} className="control-btn">
                🔊
              </button>

              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="volume-slider"
              />
            </div>

            <div className="time-display">
              {formatTime(progress)} / {formatTime(duration)}
            </div>
          </div>

          <div className="controls-right">
            <button onClick={toggleFullscreen} className="control-btn">
              ⛶
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .netflix-player-wrapper {
          position: relative;
          width: 100%;
          height: 100%;
          background: #000;
          overflow: hidden;
          font-family: 'Inter', sans-serif;
        }
        .netflix-player-wrapper.hide-cursor {
          cursor: none;
        }
        .netflix-video {
          width: 100%;
          height: 100%;
          object-fit: contain;
          background: #000;
        }
        
        .netflix-header {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 120px;
          background: linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, transparent 100%);
          display: flex;
          align-items: flex-start;
          padding: 2rem;
          opacity: 0;
          transition: opacity 0.4s ease;
          pointer-events: none;
          z-index: 20;
        }
        .netflix-header.visible {
          opacity: 1;
          pointer-events: auto;
        }
        
        .back-button {
          color: white;
          text-decoration: none;
          display: flex;
          align-items: center;
          margin-right: 2rem;
          transition: transform 0.2s ease;
        }
        .back-button:hover {
          transform: scale(1.1);
        }
        
        .header-title {
          color: white;
          font-size: 1.5rem;
          font-weight: 600;
          margin: 0;
          padding-top: 2px;
          text-shadow: 0 2px 4px rgba(0,0,0,0.5);
        }

        .processing-badge {
          margin-left: auto;
          color: #ffb400;
          background: rgba(0,0,0,0.6);
          border: 1px solid rgba(255,180,0,0.3);
          padding: 0.5rem 1rem;
          border-radius: 4px;
          font-size: 0.85rem;
          backdrop-filter: blur(4px);
        }

        .center-play {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: rgba(0,0,0,0.6);
          border-radius: 50%;
          width: 80px;
          height: 80px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          pointer-events: auto;
          backdrop-filter: blur(4px);
          transition: background 0.2s, transform 0.2s;
          z-index: 10;
        }
        .center-play:hover {
          background: rgba(229, 9, 20, 0.8);
          transform: translate(-50%, -50%) scale(1.1);
        }
        .center-icon {
          width: 48px;
          height: 48px;
          fill: white;
        }

        .netflix-controls {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 60%, transparent 100%);
          padding: 2rem 1.5rem 1.5rem;
          opacity: 0;
          transition: opacity 0.4s ease;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          pointer-events: none;
          z-index: 20;
        }
        .netflix-controls.visible {
          opacity: 1;
          pointer-events: auto;
        }
        
        .progress-container {
          position: relative;
          height: 4px;
          background: rgba(255,255,255,0.2);
          border-radius: 2px;
          cursor: pointer;
          transition: height 0.2s ease, transform 0.2s ease;
          margin-bottom: 0.5rem;
        }
        .progress-container:hover {
          height: 8px;
        }
        .progress-slider {
          position: absolute;
          width: 100%;
          height: 100%;
          opacity: 0;
          cursor: pointer;
          z-index: 10;
          margin: 0;
        }
        .progress-fill {
          position: absolute;
          height: 100%;
          background: #e50914;
          border-radius: 2px;
          pointer-events: none;
        }
        .progress-fill::after {
          content: '';
          position: absolute;
          right: -8px;
          top: 50%;
          transform: translateY(-50%) scale(0);
          width: 16px;
          height: 16px;
          background: #e50914;
          border-radius: 50%;
          transition: transform 0.2s ease;
          box-shadow: 0 0 5px rgba(0,0,0,0.5);
        }
        .progress-container:hover .progress-fill::after {
          transform: translateY(-50%) scale(1);
        }
        .buffer-bar {
          position: absolute;
          height: 100%;
          background: rgba(255,255,255,0.35); /* 🔥 white preload */
          border-radius: 2px;
          pointer-events: none;
        }  
        .controls-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .controls-left, .controls-right {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }
        
        .control-btn {
          background: none;
          border: none;
          color: white;
          cursor: pointer;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s ease, color 0.2s ease;
        }
        .control-btn:hover {
          transform: scale(1.15);
        }
        .control-btn svg {
          width: 38px;
          height: 38px;
          fill: currentColor;
          filter: drop-shadow(0 2px 2px rgba(0,0,0,0.3));
        }

        .volume-container {
          display: flex;
          align-items: center;
          gap: 0.8rem;
          margin-left: 0.5rem;
        }
        .volume-slider {
          width: 0;
          opacity: 0;
          transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease;
          cursor: pointer;
          height: 4px;
          accent-color: #e50914;
        }
        .volume-container:hover .volume-slider {
          width: 100px;
          opacity: 1;
        }

        .time-display {
          color: white;
          font-size: 1.05rem;
          font-weight: 500;
          margin-left: 1rem;
          user-select: none;
          text-shadow: 0 1px 2px rgba(0,0,0,0.5);
        }
      `}</style>
    </div>
  );
}
