"use client";

import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { useRouter } from 'next/navigation';

interface HlsPlayerProps {
  videoId: string;
  src: string;
  poster?: string;
  title?: string;
  isProcessing?: boolean;
  autoPlay?: boolean;
}

const HISTORY_KEY = 'movieflix-history';
const QUALITY_KEY = 'movieflix-preferred-quality';

export default function HlsPlayer({
  videoId,
  src,
  poster,
  title = 'Video',
  isProcessing = false,
  autoPlay = true
}: HlsPlayerProps) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedTime = useRef<number>(0);
  
  const lastTapRef = useRef<{ time: number; side: 'left' | 'right' | null }>({ time: 0, side: null });

  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [progress, setProgress] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);

  const [qualities, setQualities] = useState<{ id: number; height: number }[]>([]);
  const [currentQuality, setCurrentQuality] = useState<number>(-1);
  const [autoHeight, setAutoHeight] = useState<number>(0); // Displays real-time auto height
  const [ripple, setRipple] = useState<{ side: 'left' | 'right' | null }>({ side: null });
  const [resumeTime, setResumeTime] = useState<number | null>(null);

  // =========================
  // KEYBOARD SHORTCUTS
  // =========================
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName || "")) return;
      switch (e.code) {
        case "Space": e.preventDefault(); togglePlay(); break;
        case "ArrowRight": skipTime(10); break;
        case "ArrowLeft": skipTime(-10); break;
        case "KeyF": toggleFullscreen(); break;
        case "KeyM": toggleMute(); break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPlaying, isFullscreen, isMuted]);

  // =========================
  // VIDEO INIT + HLS
  // =========================
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let hls: Hls | null = null;

    // Check for resume data
    const hist = JSON.parse(localStorage.getItem(HISTORY_KEY) || '{}');
    if (hist[videoId]?.time > 10) {
      setResumeTime(hist[videoId].time);
      setTimeout(() => setResumeTime(null), 8000); // Hide toast after 8s
    }

    if (src.endsWith('.m3u8')) {
      if (Hls.isSupported()) {
        const preferredHeight = localStorage.getItem(QUALITY_KEY);
        hls = new Hls({ capLevelToPlayerSize: true, maxBufferLength: 60, startLevel: -1 });
        hlsRef.current = hls;
        hls.loadSource(src);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
          const available = data.levels.map((l, i) => ({ id: i, height: l.height }));
          setQualities(available);
          
          if (preferredHeight && hls) {
            const idx = available.findIndex(q => q.height === parseInt(preferredHeight));
            if (idx !== -1) {
              hls.currentLevel = idx;
              setCurrentQuality(idx);
            }
          }
          if (autoPlay) video.play().catch(() => {});
        });

        // 🔥 Auto-switch display logic
        hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
          if (hls?.autoLevelEnabled) {
            setAutoHeight(hls.levels[data.level].height);
          }
        });

        hls.on(Hls.Events.ERROR, (_, data) => {
          if (data.details === Hls.ErrorDetails.BUFFER_STALLED_ERROR) setIsBuffering(true);
        });
        hls.on(Hls.Events.STALL_RESOLVED, () => setIsBuffering(false));
      } else {
        video.src = src;
      }
    } else {
      video.src = src;
    }

    return () => { if (hlsRef.current) hlsRef.current.destroy(); };
  }, [src, videoId]);

  // =========================
  // HANDLERS
  // =========================
  const togglePlay = () => isPlaying ? videoRef.current?.pause() : videoRef.current?.play();
  
  const skipTime = (amount: number) => {
    if (videoRef.current) videoRef.current.currentTime += amount;
    setRipple({ side: amount > 0 ? 'right' : 'left' });
    setTimeout(() => setRipple({ side: null }), 600);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleResume = () => {
    if (videoRef.current && resumeTime) {
      videoRef.current.currentTime = resumeTime;
      setResumeTime(null);
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

  const formatTime = (time: number) => {
    if (!time || isNaN(time)) return "0:00";
    const s = Math.floor(time), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    return h > 0 ? `${h}:${m < 10 ? '0' : ''}${m}:${sec < 10 ? '0' : ''}${sec}` : `${m}:${sec < 10 ? '0' : ''}${sec}`;
  };

  return (
    <div
      ref={wrapperRef}
      className={`netflix-player-wrapper ${showControls ? '' : 'hide-cursor'}`}
      onMouseMove={() => {
        setShowControls(true);
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        controlsTimeoutRef.current = setTimeout(() => isPlaying && setShowControls(false), 4000);
      }}
    >
      <video
        ref={videoRef} poster={poster} playsInline crossOrigin="anonymous"
        onTimeUpdate={() => {
          if (!videoRef.current) return;
          const curr = videoRef.current.currentTime;
          setProgress(curr);
          const b = videoRef.current.buffered;
          if (b.length) setBuffered((b.end(b.length - 1) / videoRef.current.duration) * 100);
          
          if (Math.abs(curr - lastSavedTime.current) > 5) {
            lastSavedTime.current = curr;
            const hist = JSON.parse(localStorage.getItem(HISTORY_KEY) || '{}');
            hist[videoId] = { time: curr, duration: videoRef.current.duration };
            localStorage.setItem(HISTORY_KEY, JSON.stringify(hist));
          }
        }}
        onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => setIsBuffering(false)}
        className="netflix-video"
      />

      {/* Resume Toast */}
      {resumeTime && (
        <div className="resume-toast">
          <span>Resume playing?</span>
          <div className="resume-btns">
            <button onClick={handleResume} className="resume-yes">Yes</button>
            <button onClick={() => setResumeTime(null)} className="resume-no">✕</button>
          </div>
        </div>
      )}

      {/* Interaction Overlay */}
      <div className="absolute inset-0 z-10 cursor-pointer" onClick={(e) => {
        const now = Date.now();
        const rect = e.currentTarget.getBoundingClientRect();
        const side = (e.clientX - rect.left) < rect.width / 2 ? 'left' : 'right';
        if (now - lastTapRef.current.time < 300 && lastTapRef.current.side === side) {
          skipTime(side === 'left' ? -10 : 10);
          lastTapRef.current = { time: 0, side: null };
        } else {
          lastTapRef.current = { time: now, side };
          setTimeout(() => { if (lastTapRef.current.time === now) togglePlay(); }, 300);
        }
      }}>
        <div className={`ripple-container left ${ripple.side === 'left' ? 'active' : ''}`}>
          <div className="ripple-text">◀◀ 10s</div>
        </div>
        <div className={`ripple-container right ${ripple.side === 'right' ? 'active' : ''}`}>
          <div className="ripple-text">10s ▶▶</div>
        </div>
      </div>

      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
          <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Header */}
      <div className={`netflix-header ${showControls ? 'visible' : ''}`}>
        <button onClick={() => router.back()} className="back-button hover-scale">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5m7 7l-7-7 7-7" /></svg>
        </button>
        <h2 className="header-title">{title}</h2>
      </div>

      {/* Controls */}
      <div className={`netflix-controls ${showControls ? 'visible' : ''}`}>
        <div className="progress-container">
          <div className="buffer-bar" style={{ width: `${buffered}%` }} />
          <input type="range" min="0" max={duration || 100} value={progress} onChange={(e) => { if(videoRef.current) videoRef.current.currentTime = Number(e.target.value); }} className="progress-slider" />
          <div className="progress-fill" style={{ width: `${(progress / (duration || 1)) * 100}%` }} />
        </div>
        
        <div className="controls-row">
          <div className="controls-left">
            <button onClick={togglePlay} className="control-btn hover-scale">
              {isPlaying ? <svg viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg> : <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>}
            </button>
            <div className="time-display">{formatTime(progress)} / {formatTime(duration)}</div>
          </div>

          <div className="controls-right">
            {qualities.length > 0 && (
              <div className="quality-wrapper hover-scale">
                <select 
                  className="quality-select" 
                  value={currentQuality} 
                  onChange={(e) => {
                    const idx = Number(e.target.value);
                    if (hlsRef.current) hlsRef.current.currentLevel = idx;
                    setCurrentQuality(idx);
                    const h = qualities.find(q => q.id === idx)?.height;
                    if (h) localStorage.setItem(QUALITY_KEY, h.toString());
                    else localStorage.removeItem(QUALITY_KEY);
                  }}
                >
                  <option value="-1">Auto {autoHeight > 0 && `(${autoHeight}p)`}</option>
                  {qualities.map(q => <option key={q.id} value={q.id}>{q.height}p HD</option>)}
                </select>
                <div className="select-arrow">▼</div>
              </div>
            )}
            <button onClick={toggleFullscreen} className="control-btn hover-scale">
                <svg viewBox="0 0 24 24"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" /></svg>
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .netflix-player-wrapper { position: relative; width: 100%; height: 100%; background: #000; overflow: hidden; font-family: 'Inter', sans-serif; }
        .netflix-video { width: 100%; height: 100%; object-fit: contain; }
        .hover-scale { transition: transform 0.2s; cursor: pointer; }
        .hover-scale:hover { transform: scale(1.15); }
        
        .resume-toast { position: absolute; bottom: 120px; left: 30px; background: rgba(20,20,20,0.95); color: white; padding: 12px 20px; border-radius: 8px; display: flex; align-items: center; gap: 15px; z-index: 40; border: 1px solid rgba(255,255,255,0.1); backdrop-filter: blur(10px); animation: slideUp 0.4s ease; }
        .resume-btns { display: flex; gap: 10px; }
        .resume-yes { background: #e50914; color: white; border: none; padding: 4px 12px; border-radius: 4px; font-weight: bold; cursor: pointer; }
        .resume-no { background: none; border: none; color: white; cursor: pointer; font-size: 1.2rem; }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

        .netflix-header { position: absolute; top: 0; left: 0; right: 0; padding: 2rem; background: linear-gradient(to bottom, rgba(0,0,0,0.8), transparent); opacity: 0; transition: opacity 0.4s; z-index: 20; pointer-events: none; }
        .netflix-header.visible { opacity: 1; pointer-events: auto; }
        .back-button { color: white; background: none; border: none; }
        .header-title { color: white; font-size: 1.4rem; font-weight: 600; }
        
        .netflix-controls { position: absolute; bottom: 0; left: 0; right: 0; padding: 2rem; background: linear-gradient(to top, rgba(0,0,0,0.9), transparent); opacity: 0; transition: opacity 0.4s; z-index: 20; pointer-events: none; }
        .netflix-controls.visible { opacity: 1; pointer-events: auto; }
        .progress-container { position: relative; height: 4px; background: rgba(255,255,255,0.2); margin-bottom: 1.5rem; border-radius: 2px; }
        .progress-slider { position: absolute; width: 100%; top: -8px; opacity: 0; z-index: 10; cursor: pointer; }
        .progress-fill { position: absolute; height: 100%; background: #e50914; }
        .buffer-bar { position: absolute; height: 100%; background: rgba(255,255,255,0.3); }
        
        .controls-row { display: flex; justify-content: space-between; align-items: center; }
        .controls-left, .controls-right { display: flex; align-items: center; gap: 1.5rem; }
        .control-btn { background: none; border: none; color: white; }
        .control-btn svg { width: 34px; height: 34px; fill: currentColor; }
        
        .quality-wrapper { position: relative; }
        .quality-select { appearance: none; background: rgba(40,40,40,0.8); color: white; border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; padding: 6px 28px 6px 12px; font-size: 0.85rem; cursor: pointer; }
        .select-arrow { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); font-size: 8px; pointer-events: none; }

        .ripple-container { flex: 1; opacity: 0; display: flex; align-items: center; justify-content: center; background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%); transition: opacity 0.4s; color: white; pointer-events: none; }
        .ripple-container.active { opacity: 1; }
        .ripple-text { font-size: 1.2rem; font-weight: bold; background: rgba(0,0,0,0.4); padding: 5px 15px; border-radius: 20px; }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
