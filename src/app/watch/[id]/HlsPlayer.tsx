"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import { useRouter } from 'next/navigation';

interface HlsPlayerProps {
  videoId: string;
  src: string;
  poster?: string;
  title?: string;
  introStart?: number;
  introEnd?: number;
  isProcessing?: boolean;
  autoPlay?: boolean;
}

const HISTORY_KEY = 'movieflix-history';
const SETTINGS_KEY = 'movieflix-settings';

export default function HlsPlayer({
  videoId,
  src,
  poster,
  title = 'Video',
  introStart = 10, // Default 10s
  introEnd = 85,   // Default 85s
  isProcessing = false,
  autoPlay = true
}: HlsPlayerProps) {
  const router = useRouter();

  const videoRef = useRef<HTMLVideoElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedTime = useRef<number>(0);
  const hasRestored = useRef(false);

  const lastTapRef = useRef<{ time: number; x: number; y: number }>({ time: 0, x: 0, y: 0 });
  const touchStartRef = useRef<{ x: number, y: number } | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [progress, setProgress] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [brightness, setBrightness] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  
  const [qualities, setQualities] = useState<{ id: number; height: number }[]>([]);
  const [currentQuality, setCurrentQuality] = useState<number>(-1); 
  const [autoHeight, setAutoHeight] = useState<number>(0); 
  const [resumeTime, setResumeTime] = useState<number | null>(null);
  const [isQualityOpen, setIsQualityOpen] = useState(false);
  const [showCenterIcon, setShowCenterIcon] = useState(false);
  const [gestureUI, setGestureUI] = useState<{ type: 'volume' | 'brightness' | null, value: number }>({ type: null, value: 0 });
  const [skipAnim, setSkipAnim] = useState<{ side: 'left' | 'right' | null }>({ side: null });

  // NEW: Skip Intro & Auto-Skip State
  const [showSkipButton, setShowSkipButton] = useState(false);
  const [autoSkipEnabled, setAutoSkipEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(SETTINGS_KEY);
      return saved ? JSON.parse(saved).autoSkip : false;
    }
    return false;
  });

  // =========================
  // HANDLERS
  // =========================
  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
    }
    setShowCenterIcon(true);
    setTimeout(() => setShowCenterIcon(false), 500);
  }, []);

  const skipTime = (amount: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime += amount;
    const side = amount > 0 ? 'right' : 'left';
    setSkipAnim({ side });
    setTimeout(() => setSkipAnim({ side: null }), 600);
  };

  const handleSkipIntro = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = introEnd;
      setShowSkipButton(false);
    }
  }, [introEnd]);

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
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

  const handleQualityChange = (id: number) => {
    if (!hlsRef.current) return;
    hlsRef.current.currentLevel = id;
    setCurrentQuality(id);
    setIsQualityOpen(false);
  };

  // =========================
  // LOGIC: PROGRESS & INTRO
  // =========================
  useEffect(() => {
    const isInsideIntro = progress >= introStart && progress < introEnd;
    if (isInsideIntro) {
      if (autoSkipEnabled) {
        handleSkipIntro();
      } else {
        setShowSkipButton(true);
      }
    } else {
      setShowSkipButton(false);
    }
  }, [progress, introStart, introEnd, autoSkipEnabled, handleSkipIntro]);

  // =========================
  // VIDEO INIT & HLS
  // =========================
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Reset for new video
    setProgress(0);
    setBuffered(0);
    hasRestored.current = false;
    setResumeTime(null);

    let hls: Hls;
    if (src.endsWith(".m3u8") && Hls.isSupported()) {
      hls = new Hls({ 
        capLevelToPlayerSize: true, 
        startLevel: -1,
        abrEwmaDefaultEstimate: 10000000 
      });
      hlsRef.current = hls;
      hls.loadSource(src);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        const sorted = data.levels.map((l, i) => ({ id: i, height: l.height })).sort((a, b) => b.height - a.height);
        setQualities(sorted);
        hls.currentLevel = sorted[0].id; // Force high quality
        setCurrentQuality(sorted[0].id);

        const hist = JSON.parse(localStorage.getItem(HISTORY_KEY) || "{}");
        if (hist[videoId]?.time > 10) setResumeTime(hist[videoId].time);

        if (autoPlay) {
          video.muted = true;
          setIsMuted(true);
          video.play().catch(() => {});
        }
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
        const level = hls.levels[data.level];
        if (level) setAutoHeight(level.height);
      });
    } else {
      video.src = src;
      if (autoPlay) { video.muted = true; setIsMuted(true); video.play().catch(() => {}); }
    }

    return () => hls?.destroy();
  }, [src, videoId, autoPlay]);

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying && !isQualityOpen && !gestureUI.type) setShowControls(false);
    }, 4000);
  };

  return (
    <div 
      ref={wrapperRef} 
      className={`netflix-player-wrapper ${showControls ? '' : 'hide-cursor'}`} 
      onMouseMove={handleMouseMove} 
      style={{ filter: `brightness(${brightness})` }}
    >
      <video
        ref={videoRef} poster={poster} playsInline crossOrigin="anonymous" className="netflix-video"
        onTimeUpdate={() => {
          if (!videoRef.current) return;
          const curr = videoRef.current.currentTime;
          setProgress(curr);
          if (videoRef.current.buffered.length) setBuffered((videoRef.current.buffered.end(videoRef.current.buffered.length - 1) / videoRef.current.duration) * 100);
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
      />

      {/* Main Interaction Layer */}
      <div 
        className="absolute inset-0 z-10 cursor-pointer overflow-hidden" 
        onClick={(e) => {
          const now = Date.now();
          if (now - lastTapRef.current.time < 300) {
            toggleFullscreen();
          } else {
            lastTapRef.current = { time: now, x: e.clientX, y: e.clientY };
            togglePlay();
          }
        }}
      >
        {/* Skip Time Animations */}
        <div className={`skip-anim-container left ${skipAnim.side === 'left' ? 'active' : ''}`}>
           <div className="skip-icon-wrapper"><span className="arrow-one">◀</span><span className="arrow-two">◀</span><span className="arrow-three">◀</span></div>
           <span className="skip-text">10 seconds</span>
        </div>
        <div className={`skip-anim-container right ${skipAnim.side === 'right' ? 'active' : ''}`}>
           <div className="skip-icon-wrapper"><span className="arrow-one">▶</span><span className="arrow-two">▶</span><span className="arrow-three">▶</span></div>
           <span className="skip-text">10 seconds</span>
        </div>
      </div>

      {/* Resume Toast with Animation */}
      {resumeTime && !hasRestored.current && (
        <div className="resume-toast">
          <div className="resume-btns">
            <button className="resume-yes" onClick={() => { 
              videoRef.current!.currentTime = resumeTime; 
              videoRef.current!.play(); 
              hasRestored.current = true; 
              setResumeTime(null); 
            }}>Resume from {formatTime(resumeTime)}</button>
            <button className="resume-no" onClick={() => { hasRestored.current = true; setResumeTime(null); }}>✕</button>
          </div>
        </div>
      )}

      {/* Skip Intro with Animation */}
      {showSkipButton && (
        <div className="skip-intro-container">
          <button className="skip-btn" onClick={handleSkipIntro}>Skip Intro</button>
          <label className="auto-skip-toggle">
            <input 
              type="checkbox" 
              checked={autoSkipEnabled} 
              onChange={(e) => {
                setAutoSkipEnabled(e.target.checked);
                localStorage.setItem(SETTINGS_KEY, JSON.stringify({ autoSkip: e.target.checked }));
              }} 
            />
            Always skip
          </label>
        </div>
      )}

      {/* Center Icons, Buffering, Header & Controls (Preserved from your code) */}
      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
          <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      <div className={`netflix-header ${showControls ? 'visible' : ''}`}>
        <button onClick={() => router.back()} className="back-button hover-scale"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5m7 7l-7-7 7-7" /></svg></button>
        <h2 className="header-title">{title}</h2>
      </div>

      <div className={`netflix-controls ${showControls ? 'visible' : ''}`}>
        <div className="progress-wrapper">
          <div className="progress-container">
            <div className="buffer-bar" style={{ width: `${buffered}%` }} />
            <input type="range" min="0" max={duration || 100} value={progress} onChange={(e) => { if(videoRef.current) videoRef.current.currentTime = Number(e.target.value); }} className="progress-slider" />
            <div className="progress-fill" style={{ width: `${(progress / (duration || 1)) * 100}%` }}><div className="scrub-circle" /></div>
          </div>
        </div>
        <div className="controls-row">
          <div className="controls-left">
            <button onClick={togglePlay} className="control-btn hover-scale">{isPlaying ? <svg viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" fill="white"/></svg> : <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z" fill="white"/></svg>}</button>
            <div className="time-display">{formatTime(progress)} / {formatTime(duration)}</div>
          </div>
          <div className="controls-right">
             {/* Quality Menu logic here */}
             <button onClick={toggleFullscreen} className="control-btn hover-scale"><svg viewBox="0 0 24 24" width="30"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" fill="white"/></svg></button>
          </div>
        </div>
      </div>

      <style>{`
        .netflix-player-wrapper { position: relative; width: 100%; height: 100vh; background: #000; overflow: hidden; font-family: sans-serif; }
        .netflix-video { width: 100%; height: 100%; object-fit: contain; }
        .hide-cursor { cursor: none; }
        
        /* RESUME ANIMATION */
        .resume-toast { position: absolute; bottom: 120px; left: 30px; background: rgba(20,20,20,0.95); color: white; padding: 12px 20px; border-radius: 8px; z-index: 40; border: 1px solid rgba(255,255,255,0.1); animation: slideUpFade 0.5s ease forwards; backdrop-filter: blur(10px); }
        @keyframes slideUpFade { from { transform: translateY(50px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .resume-yes { background: #e50914; color: white; border: none; padding: 6px 14px; border-radius: 4px; font-weight: bold; cursor: pointer; margin-right: 10px; }
        .resume-no { background: none; border: none; color: white; cursor: pointer; font-size: 1.2rem; }

        /* SKIP INTRO ANIMATION */
        .skip-intro-container { position: absolute; bottom: 140px; right: 0; z-index: 50; display: flex; flex-direction: column; align-items: flex-end; gap: 8px; animation: slideInRight 0.5s ease-out forwards; }
        @keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(-40px); opacity: 1; } }
        .skip-btn { background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.4); color: white; padding: 10px 30px; font-size: 1rem; font-weight: bold; text-transform: uppercase; cursor: pointer; backdrop-filter: blur(5px); }
        .auto-skip-toggle { display: flex; align-items: center; gap: 6px; font-size: 0.75rem; color: rgba(255,255,255,0.6); cursor: pointer; }

        /* Existing Layout CSS */
        .netflix-header { position: absolute; top: 0; left: 0; right: 0; padding: 2rem 4%; background: linear-gradient(to bottom, rgba(0,0,0,0.8), transparent); display: flex; align-items: center; opacity: 0; transition: opacity 0.4s; z-index: 20; }
        .netflix-header.visible { opacity: 1; }
        .netflix-controls { position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(to top, rgba(0,0,0,0.9), transparent); padding: 2rem 4%; opacity: 0; transition: opacity 0.4s; z-index: 20; }
        .netflix-controls.visible { opacity: 1; pointer-events: auto; }
        .progress-container { position: relative; height: 4px; background: rgba(255,255,255,0.2); border-radius: 2px; cursor: pointer; margin-bottom: 1rem; }
        .progress-fill { position: absolute; height: 100%; background: #e50914; border-radius: 2px; }
        .progress-slider { position: absolute; width: 100%; top: 0; opacity: 0; cursor: pointer; z-index: 10; }
        .controls-row { display: flex; justify-content: space-between; align-items: center; color: white; }
        .controls-left { display: flex; align-items: center; gap: 1.5rem; }
        .control-btn { background: none; border: none; cursor: pointer; }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

function formatTime(time: number) {
  const s = Math.floor(time || 0);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h > 0 ? `${h}:${m < 10 ? '0' : ''}${m}:${sec < 10 ? '0' : ''}${sec}` : `${m}:${sec < 10 ? '0' : ''}${sec}`;
}
