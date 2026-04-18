"use client";

import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import Link from 'next/link';

interface HlsPlayerProps {
  videoId: string;
  src: string;
  poster?: string;
  title?: string;
  isProcessing?: boolean;
  autoPlay?: boolean;
}

const HISTORY_KEY = 'movieflix-history';

export default function HlsPlayer({
  videoId,
  src,
  poster,
  title = 'Video',
  isProcessing = false,
  autoPlay = true
}: HlsPlayerProps) {

  const videoRef = useRef<HTMLVideoElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
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

  // ✅ VIDEO INIT + PRELOAD BOOST
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let hls: Hls | null = null;

    const startPlayback = () => {
      if (autoPlay) video.play().catch(() => {});
    };

    if (src.endsWith('.m3u8')) {
      if (Hls.isSupported()) {
        hls = new Hls({
          capLevelToPlayerSize: true,
          maxBufferLength: 60, // 🔥 more aggressive buffering
        });

        hls.loadSource(src);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.addEventListener('canplay', startPlayback, { once: true });
        });

      } else {
        video.src = src;
        video.addEventListener('canplay', startPlayback, { once: true });
      }
    } else {
      // ✅ MP4 PRELOAD IMPROVEMENT
      video.src = src;
      video.preload = "metadata";
      video.load();

      // 🔥 Force early buffering
      video.addEventListener('loadeddata', () => {
        video.currentTime = 0.01;
      }, { once: true });

      video.addEventListener('canplay', startPlayback, { once: true });
    }

    return () => {
      video.pause();
      video.removeAttribute("src");
      video.load();
      if (hls) hls.destroy();
    };
  }, [src, autoPlay]);

  // ✅ TRACK BUFFER PROGRESS
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
        const hist = JSON.parse(localStorage.getItem(HISTORY_KEY) || '{}');
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
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);

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
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  return (
    <div
      ref={wrapperRef}
      className={`netflix-player-wrapper ${showControls ? '' : 'hide-cursor'}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <video
        ref={videoRef}
        poster={poster}
        playsInline
        preload="metadata"
        crossOrigin="anonymous"
        onClick={togglePlay}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onProgress={updateBuffered} // 🔥 important
        className="netflix-video"
      />

      {/* Top Header Overlay */}
      <div className={`netflix-header ${showControls ? 'visible' : ''}`}>
        <Link href="/" className="back-button">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5m7 7l-7-7 7-7" /></svg>
        </Link>
        <h2 className="header-title">{title}</h2>
        {isProcessing && (
          <div className="processing-badge">
            Standard Quality (Processing Adaptive HD...)
          </div>
        )}
      </div>

      {/* Centered Large Play/Pause (Optional UX enhancement) */}
      {!isPlaying && (
        <div className="center-play" onClick={togglePlay}>
          <svg viewBox="0 0 24 24" className="center-icon"><path d="M8 5v14l11-7z" /></svg>
        </div>
      )}

      {/* Bottom Controls Overlay */}
      <div className={`netflix-controls ${showControls ? 'visible' : ''}`}>
        <div className="progress-container">

          {/* 🔥 BUFFER BAR (WHITE) */}
          <div
            className="buffer-bar"
            style={{ width: `${buffered}%` }}
          />

          <input
            type="range"
            min="0"
            max={duration || 100}
            value={progress}
            onChange={handleSeek}
            className="progress-slider"
          />

          {/* 🔴 PLAYED PROGRESS */}
          <div
            className="progress-fill"
            style={{ width: `${(progress / (duration || 1)) * 100}%` }}
          />
        </div>

        <div className="controls-row">
          <div className="controls-left">
            <button onClick={togglePlay} className="control-btn play-btn" aria-label={isPlaying ? "Pause" : "Play"}>
              {isPlaying ? (
                <svg viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
              ) : (
                <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
              )}
            </button>

            <button onClick={() => skipTime(-10)} className="control-btn skip-btn" aria-label="Rewind 10 Seconds">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://w3.org">
                {/* Mirror of the forward icon: Arrow pointing left, circle counter-clockwise */}
                <path
                  d="M12 5V1L7 6L12 11V7C15.3137 7 18 9.68629 18 13C18 16.3137 15.3137 19 12 19C8.68629 19 6 16.3137 6 13H4C4 17.4183 7.58172 21 12 21C16.4183 21 20 17.4183 20 13C20 8.58172 16.4183 5 12 5Z"
                  fill="currentColor"
                />
                <text
                  x="12"
                  y="15"
                  textAnchor="middle"
                  fill="currentColor"
                  fontSize="6"
                  fontWeight="bold"
                  fontFamily="system-ui, sans-serif"
                >
                  10
                </text>
              </svg>
            </button>

            <button onClick={() => skipTime(10)} className="control-btn skip-btn" aria-label="Forward 10 Seconds">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://w3.org">
                {/* Clean circular path with arrow head */}
                <path
                  d="M12 5V1L17 6L12 11V7C8.68629 7 6 9.68629 6 13C6 16.3137 8.68629 19 12 19C15.3137 19 18 16.3137 18 13H20C20 17.4183 16.4183 21 12 21C7.58172 21 4 17.4183 4 13C4 8.58172 7.58172 5 12 5Z"
                  fill="currentColor"
                />
                {/* Centered text */}
                <text
                  x="12"
                  y="15"
                  textAnchor="middle"
                  fill="currentColor"
                  fontSize="6"
                  fontWeight="bold"
                  fontFamily="system-ui, sans-serif"
                >
                  10
                </text>
              </svg>
            </button>


            <div className="volume-container">
              <button onClick={toggleMute} className="control-btn volume-btn">
                {isMuted || volume === 0 ? (
                  <svg viewBox="0 0 24 24"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" /></svg>
                ) : volume < 0.5 ? (
                  <svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" /></svg>
                ) : (
                  <svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" /></svg>
                )}
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
              {formatTime(progress)}<span style={{ opacity: 0.5, margin: '0 4px' }}>/</span>{formatTime(duration)}
            </div>
          </div>

          <div className="controls-right">
            <button onClick={toggleFullscreen} className="control-btn fullscreen-btn">
              {isFullscreen ? (
                <svg viewBox="0 0 24 24"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" /></svg>
              ) : (
                <svg viewBox="0 0 24 24"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" /></svg>
              )}
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
