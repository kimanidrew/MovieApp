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
  const hasRestored = useRef(false);

  // Interaction Refs
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
  
  // 🔥 New state for Skip Animations
  const [skipAnim, setSkipAnim] = useState<{ side: 'left' | 'right' | null }>({ side: null });

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
  }, [isPlaying, isMuted]);

  // =========================
  // HANDLERS
  // =========================
  const togglePlay = () => {
    if (!videoRef.current) return;
    isPlaying ? videoRef.current.pause() : videoRef.current.play();
    setShowCenterIcon(true);
    setTimeout(() => setShowCenterIcon(false), 500);
  };

  const skipTime = (amount: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime += amount;
    
    // 🔥 Trigger Skip Animation
    const side = amount > 0 ? 'right' : 'left';
    setSkipAnim({ side });
    setTimeout(() => setSkipAnim({ side: null }), 600);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const nextMuted = !isMuted;
    videoRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = Number(e.target.value);
    setVolume(vol);
    if (videoRef.current) {
      videoRef.current.volume = vol;
      setIsMuted(vol === 0);
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

  const handleQualityChange = (id: number) => {
    if (hlsRef.current) {
      hlsRef.current.currentLevel = id;
      setCurrentQuality(id);
      setIsQualityOpen(false);
    }
  };

  // =========================
  // SWIPE GESTURES (VOLUME / BRIGHTNESS)
  // =========================
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current || !videoRef.current) return;
    const touchY = e.touches[0].clientY;
    const deltaY = touchStartRef.current.y - touchY;
    const sensitivity = 200; 
    const change = deltaY / sensitivity;

    const rect = e.currentTarget.getBoundingClientRect();
    const isLeftSide = touchStartRef.current.x < rect.width / 2;

    if (isLeftSide) {
      const newBrightness = Math.min(Math.max(brightness + change, 0.2), 1.5);
      setBrightness(newBrightness);
      setGestureUI({ type: 'brightness', value: Math.round((newBrightness / 1.5) * 100) });
    } else {
      const newVolume = Math.min(Math.max(volume + change, 0), 1);
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
      setGestureUI({ type: 'volume', value: Math.round(newVolume * 100) });
    }
    touchStartRef.current.y = touchY;
    handleMouseMove();
  };

  const handleTouchEnd = () => {
    touchStartRef.current = null;
    setTimeout(() => setGestureUI({ type: null, value: 0 }), 1000);
  };

  // =========================
  // VIDEO INIT + HLS
  // =========================
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let hlsInstance: Hls | null = null;
    hasRestored.current = false;

    if (src.endsWith('.m3u8')) {
      if (Hls.isSupported()) {
        hlsInstance = new Hls({
          capLevelToPlayerSize: true,
          maxBufferLength: 30, 
          startLevel: -1,
          abrBandWidthFactor: 0.8,
          abrBandWidthUpFactor: 0.6,
        });

        hlsRef.current = hlsInstance;
        hlsInstance.loadSource(src);
        hlsInstance.attachMedia(video);

        hlsInstance.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
          setQualities(data.levels.map((l, i) => ({ id: i, height: l.height })));
          const hist = JSON.parse(localStorage.getItem(HISTORY_KEY) || '{}');
          if (hist[videoId]?.time > 10) {
            setResumeTime(hist[videoId].time);
            setTimeout(() => setResumeTime(null), 15000);
          }
          if (autoPlay) video.play().catch(() => {});
        });

        hlsInstance.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
          if (hlsRef.current?.autoLevelEnabled) setAutoHeight(hlsRef.current.levels[data.level].height);
        });

        hlsInstance.on(Hls.Events.ERROR, (_, data) => {
          if (data.details === Hls.ErrorDetails.BUFFER_STALLED_ERROR) setIsBuffering(true);
        });
        hlsInstance.on(Hls.Events.STALL_RESOLVED, () => setIsBuffering(false));
      } else {
        video.src = src;
      }
    } else {
      video.src = src;
      video.load();
    }

    return () => { if (hlsRef.current) hlsRef.current.destroy(); };
  }, [src, videoId, autoPlay]);

  const handleMouseMove = () => {
    setShowControls(true);

    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);

    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying && !isQualityOpen && !gestureUI.type) {
        setShowControls(false);
      }
    }, 4000);
  };

  return (
    <div
      ref={wrapperRef}
      className={`netflix-player-wrapper ${showControls ? '' : 'hide-cursor'}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => {
        if (isPlaying) setShowControls(false);
      }}
      style={{ filter: `brightness(${brightness})` }}
    >
      <video
        ref={videoRef} poster={poster} playsInline crossOrigin="anonymous"
        onTimeUpdate={() => {
          if (!videoRef.current) return;
          setProgress(videoRef.current.currentTime);
          const b = videoRef.current.buffered;
          if (b.length) setBuffered((b.end(b.length - 1) / videoRef.current.duration) * 100);
          if (Math.abs(videoRef.current.currentTime - lastSavedTime.current) > 5) {
            lastSavedTime.current = videoRef.current.currentTime;
            const hist = JSON.parse(localStorage.getItem(HISTORY_KEY) || '{}');
            hist[videoId] = { time: lastSavedTime.current, duration: videoRef.current.duration };
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

      {/* Main interaction layer */}
      <div 
        className="absolute inset-0 z-10 cursor-pointer overflow-hidden" 
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={(e) => {
          const now = Date.now();
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;

          if (now - lastTapRef.current.time < 300) {
            // 🔥 DOUBLE CLICK → FULLSCREEN
            toggleFullscreen();
            lastTapRef.current = { time: 0, x: 0, y: 0 };
          } else {
            lastTapRef.current = { time: now, x: e.clientX, y: e.clientY };

            setTimeout(() => {
              if (lastTapRef.current.time === now) {
                // 🔥 SINGLE CLICK → JUST TOGGLE CONTROLS
                setShowControls((prev) => !prev);
              }
            }, 300);
          }
        }}
      >
        {/* 🔥 SKIP ANIMATIONS (Forward/Rewind) */}
        <div className={`skip-anim-container left ${skipAnim.side === 'left' ? 'active' : ''}`}>
           <div className="skip-icon-wrapper">
             <span className="arrow-one">◀</span><span className="arrow-two">◀</span><span className="arrow-three">◀</span>
           </div>
           <span className="skip-text">10 seconds</span>
        </div>
        <div className={`skip-anim-container right ${skipAnim.side === 'right' ? 'active' : ''}`}>
           <div className="skip-icon-wrapper">
             <span className="arrow-one">▶</span><span className="arrow-two">▶</span><span className="arrow-three">▶</span>
           </div>
           <span className="skip-text">10 seconds</span>
        </div>
      </div>

      {/* Gesture HUD */}
      {gestureUI.type && (
        <div className="gesture-hud">
          <div className="gesture-hud-icon">{gestureUI.type === 'volume' ? '🔊' : '☀️'}</div>
          <div className="gesture-hud-bar"><div style={{ width: `${gestureUI.value}%` }} /></div>
        </div>
      )}

      {showCenterIcon && (
        <div className="center-action-overlay">
          <div className="center-icon-bg animate-pop">
            {!isPlaying ? <svg viewBox="0 0 24 24" className="center-icon-svg"><path d="M8 5v14l11-7z" fill="white"/></svg> : <svg viewBox="0 0 24 24" className="center-icon-svg"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" fill="white"/></svg>}
          </div>
        </div>
      )}

      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
          <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {resumeTime && (
        <div className="resume-toast">
          <div className="resume-btns">
            <button onClick={() => { if(videoRef.current) videoRef.current.currentTime = resumeTime; setResumeTime(null); setIsPlaying(true); }} className="resume-yes">Resume from {formatTime(resumeTime)}</button>
            <button onClick={() => setResumeTime(null)} className="resume-no">✕</button>
          </div>
        </div>
      )}

      <div className={`netflix-header ${showControls ? 'visible' : ''}`}>
        <button onClick={() => router.back()} className="back-button hover-scale"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5m7 7l-7-7 7-7" /></svg></button>
        <h2 className="header-title">{title}</h2>
      </div>

      <div className={`netflix-controls ${showControls ? 'visible' : ''}`}>
        <div className="progress-container">
          <div className="buffer-bar" style={{ width: `${buffered}%` }} />
          <input type="range" min="0" max={duration || 100} value={progress} onInput={(e) => setProgress(Number(e.currentTarget.value))} onChange={(e) => { if(videoRef.current) videoRef.current.currentTime = Number(e.target.value); }} className="progress-slider" />
          <div className="progress-fill" style={{ width: `${(progress / (duration || 1)) * 100}%` }}><div className="scrub-circle" /></div>
        </div>

        <div className="controls-row">
          <div className="controls-left">
            <button onClick={togglePlay} className="control-btn hover-scale">{isPlaying ? <svg viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" fill="white"/></svg> : <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z" fill="white"/></svg>}</button>
            <button onClick={() => skipTime(-10)} className="control-btn hover-scale"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/><text x="12" y="15" fontSize="6" fontWeight="bold" textAnchor="middle" fill="white">10</text></svg></button>
            <button onClick={() => skipTime(10)} className="control-btn hover-scale"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 5V1l5 5-5 5V7c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8z"/><text x="12" y="15" fontSize="6" fontWeight="bold" textAnchor="middle" fill="white">10</text></svg></button>
            
            <div className="volume-container">
              <button onClick={toggleMute} className="control-btn hover-scale">{isMuted || volume === 0 ? <svg viewBox="0 0 24 24"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" fill="white"/></svg> : <svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" fill="white"/></svg>}</button>
              <input type="range" min="0" max="1" step="0.05" value={isMuted ? 0 : volume} onChange={handleVolumeChange} className="volume-slider" />
            </div>
            <div className="time-display">{formatTime(progress)} / {formatTime(duration)}</div>
          </div>

          <div className="controls-right">
            {qualities.length > 0 && (
                <div className="custom-quality-container hover-scale">
                    {isQualityOpen && (
                        <div className="quality-menu">
                            <button className={currentQuality === -1 ? 'active' : ''} onClick={() => handleQualityChange(-1)}>Auto ({autoHeight}p)</button>
                            {qualities.map((q) => <button key={q.id} className={currentQuality === q.id ? 'active' : ''} onClick={() => handleQualityChange(q.id)}>{q.height}p HD</button>)}
                        </div>
                    )}
                    <button className="quality-trigger control-btn" onClick={(e) => { e.stopPropagation(); setIsQualityOpen(!isQualityOpen); }}>
                        {currentQuality === -1 ? 'Auto' : `${qualities.find(q => q.id === currentQuality)?.height}p`}
                        <svg className={`chevron ${isQualityOpen ? 'open' : ''}`} viewBox="0 0 24 24"><path d="M7 10l5 5 5-5z" fill="white"/></svg>
                    </button>
                </div>
            )}
            <button onClick={toggleFullscreen} className="control-btn hover-scale">{isFullscreen ? <svg viewBox="0 0 24 24"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" fill="white"/></svg> : <svg viewBox="0 0 24 24"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" fill="white"/></svg>}</button>
          </div>
        </div>
      </div>

      <style>{`
        .netflix-player-wrapper { position: relative; width: 100%; height: 100%; background: #000; overflow: hidden; }
        .netflix-player-wrapper.hide-cursor {
          cursor: none;
        }
        .netflix-video { width: 100%; height: 100%; object-fit: contain; }
        .hover-scale { transition: transform 0.2s; cursor: pointer; }
        .hover-scale:hover { transform: scale(1.15); }

        /* 🔥 SKIP ANIMATIONS */
        .skip-anim-container { position: absolute; top: 0; bottom: 0; width: 40%; display: flex; flex-direction: column; align-items: center; justify-content: center; opacity: 0; background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%); transition: opacity 0.3s; pointer-events: none; color: white; z-index: 12; }
        .skip-anim-container.active { opacity: 1; }
        .skip-anim-container.left { left: 0; border-top-right-radius: 50% 100%; border-bottom-right-radius: 50% 100%; }
        .skip-anim-container.right { right: 0; border-top-left-radius: 50% 100%; border-bottom-left-radius: 50% 100%; }
        .skip-icon-wrapper { display: flex; gap: 2px; font-size: 2.5rem; margin-bottom: 5px; }
        .skip-text { font-size: 0.9rem; font-weight: bold; }
        
        .active .arrow-one { animation: ghosting 0.6s infinite; }
        .active .arrow-two { animation: ghosting 0.6s infinite 0.1s; }
        .active .arrow-three { animation: ghosting 0.6s infinite 0.2s; }
        @keyframes ghosting { 0% { opacity: 0; } 50% { opacity: 1; } 100% { opacity: 0; } }

        .netflix-header { position: absolute; top: 0; left: 0; right: 0; height: 120px; background: linear-gradient(to bottom, rgba(0,0,0,0.8), transparent); display: flex; align-items: flex-start; padding: 2rem; opacity: 0; transition: opacity 0.4s; z-index: 20; pointer-events: none; }
        .netflix-header.visible { opacity: 1; pointer-events: auto; }
        .back-button { color: white; background: transparent; border: none; }
        .header-title { padding-left: 1rem; color: white; font-size: 1.7rem; font-weight: 600; text-shadow: 0 2px 4px rgba(0,0,0,0.5); }
        .resume-toast { position: absolute; bottom: 120px; left: 30px; background: rgba(20,20,20,0.95); color: white; padding: 12px 20px; border-radius: 8px; z-index: 40; border: 1px solid rgba(255,255,255,0.1); animation: slideUpFade 0.5s ease forwards; backdrop-filter: blur(10px); }
        @keyframes slideUpFade { from { transform: translateY(50px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .resume-yes { background: #e50914; color: white; border: none; padding: 6px 14px; border-radius: 4px; font-weight: bold; cursor: pointer; margin-right: 10px; }
        .resume-no { background: none; border: none; color: white; cursor: pointer; font-size: 1.2rem; }
        .center-action-overlay { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 15; pointer-events: none; }
        .center-icon-bg { background: rgba(0,0,0,0.5); border-radius: 50%; width: 100px; height: 100px; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(5px); }
        .animate-pop { animation: popFade 0.5s ease-out forwards; }
        @keyframes popFade { 0% { transform: scale(0.8); opacity: 0; } 50% { transform: scale(1.1); opacity: 1; } 100% { transform: scale(1); opacity: 0; } }
        .gesture-hud { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(0,0,0,0.7); padding: 20px; border-radius: 12px; z-index: 50; display: flex; flex-direction: column; align-items: center; pointer-events: none; }
        .gesture-hud-icon { font-size: 2rem; margin-bottom: 8px; }
        .gesture-hud-bar { width: 100px; height: 4px; background: rgba(255,255,255,0.2); border-radius: 2px; overflow: hidden; }
        .gesture-hud-bar div { height: 100%; background: #e50914; transition: width 0.1s linear; }
        .netflix-controls { position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(to top, rgba(0,0,0,0.9), transparent); padding: 2rem 1.5rem 1.5rem; opacity: 0; transition: opacity 0.4s; pointer-events: none; z-index: 20; }
        .netflix-controls.visible { opacity: 1; pointer-events: auto; }
        .progress-container { position: relative; height: 4px; background: rgba(255,255,255,0.2); border-radius: 2px; cursor: pointer; transition: height 0.2s; margin-bottom: 1rem; }
        .progress-container:hover { height: 8px; }
        .progress-slider { position: absolute; width: 100%; top: -8px; opacity: 0; z-index: 10; cursor: pointer; }
        .progress-fill { position: absolute; height: 100%; background: #e50914; border-radius: 2px; display: flex; align-items: center; justify-content: flex-end; }
        .buffer-bar { position: absolute; height: 100%; background: rgba(255,255,255,0.35); border-radius: 2px; }
        .scrub-circle { width: 16px; height: 16px; background: #e50914; border-radius: 50%; transform: translateX(50%) scale(0); transition: transform 0.2s ease; box-shadow: 0 0 5px rgba(0,0,0,0.5); }
        .progress-container:hover .scrub-circle { transform: translateX(50%) scale(1); }
        .controls-row { display: flex; justify-content: space-between; align-items: center; }
        .controls-left, .controls-right { display: flex; align-items: center; gap: 1.5rem; }
        .control-btn { background: none; border: none; color: white; cursor: pointer; transition: transform 0.2s; }
        .control-btn svg { width: 38px; height: 38px; }
        .volume-container { display: flex; align-items: center; gap: 0.8rem; }
        .volume-slider { width: 0; opacity: 0; transition: width 0.3s, opacity 0.3s; height: 4px; accent-color: #e50914; cursor: pointer; border: none;}
        .volume-container:hover .volume-slider { width: 100px; opacity: 1; }
        .custom-quality-container { position: relative; display: flex; align-items: center; }
        .quality-trigger { background: rgba(20,20,20,0.8); color: white; border: 1px solid rgba(255,255,255,0.3); padding: 3px 10px; border-radius: 4px; font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; gap: 5px; }
        .chevron { width: 20px; transition: transform 0.3s; }
        .chevron.open { transform: rotate(180deg); }
        .quality-menu { position: absolute; bottom: 100%; left: 0; margin-bottom: 10px; background: rgba(20,20,20,0.95); border-radius: 8px; overflow: hidden; display: flex; flex-direction: column; width: 140px; border: 1px solid rgba(255,255,255,0.1); }
        .quality-menu button { background: none; border: none; color: rgba(255,255,255,0.7); padding: 10px; text-align: left; cursor: pointer; }
        .quality-menu button.active { color: #e50914; font-weight: bold; }
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