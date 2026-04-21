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
  const lastTapRef = useRef<{ time: number; side: 'left' | 'right' | null }>({ time: 0, side: null });

  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [progress, setProgress] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  
  const [qualities, setQualities] = useState<{ id: number; height: number }[]>([]);
  const [currentQuality, setCurrentQuality] = useState<number>(-1);
  const [autoHeight, setAutoHeight] = useState<number>(0); 
  const [ripple, setRipple] = useState<{ side: 'left' | 'right' | null }>({ side: null });
  const [resumeTime, setResumeTime] = useState<number | null>(null);

  // =========================
  // KEYBOARD SHORTCUTS
  // =========================
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName || "")) return;

      switch (e.code) {
        case "Space":
          e.preventDefault();
          togglePlay();
          break;
        case "ArrowRight":
          skipTime(10);
          break;
        case "ArrowLeft":
          skipTime(-10);
          break;
        case "KeyF":
          toggleFullscreen();
          break;
        case "KeyM":
          toggleMute();
          break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPlaying, isFullscreen, isMuted]);

  // =========================
  // PROGRESS RESTORE
  // =========================
  const restoreProgress = (video: HTMLVideoElement) => {
    try {
      const hist = JSON.parse(localStorage.getItem(HISTORY_KEY) || '{}');
      const saved = hist[videoId];
      if (!saved?.time || hasRestored.current) return;

      if (saved.time > 10) {
        setResumeTime(saved.time);
        setTimeout(() => setResumeTime(null), 8000);
      }
    } catch {}
  };

  const handleResume = () => {
    if (videoRef.current && resumeTime) {
      videoRef.current.currentTime = resumeTime;
      setProgress(resumeTime);
      hasRestored.current = true;
      setResumeTime(null);
    }
  };

  // =========================
  // VIDEO INIT + HLS
  // =========================
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let hlsInstance: Hls | null = null; // 🔥 Fixed: Used uppercase Hls type
    hasRestored.current = false;

    const startPlayback = () => {
      if (autoPlay) video.play().catch(() => {});
    };

    if (src.endsWith('.m3u8')) {
      if (Hls.isSupported()) {
        const preferredHeight = localStorage.getItem(QUALITY_KEY);
        
        hlsInstance = new Hls({ capLevelToPlayerSize: true, maxBufferLength: 60, startLevel: -1 });
        hlsRef.current = hlsInstance;
        hlsInstance.loadSource(src);
        hlsInstance.attachMedia(video);

        hlsInstance.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
          const available = data.levels.map((l, i) => ({ id: i, height: l.height }));
          setQualities(available);

          if (preferredHeight && hlsInstance) {
            const idx = available.findIndex(q => q.height === parseInt(preferredHeight));
            if (idx !== -1) {
              hlsInstance.currentLevel = idx;
              setCurrentQuality(idx);
            }
          }
          restoreProgress(video);
          video.addEventListener('canplay', startPlayback, { once: true });
        });

        hlsInstance.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
          if (hlsRef.current?.autoLevelEnabled) {
            setAutoHeight(hlsRef.current.levels[data.level].height);
          }
        });

        hlsInstance.on(Hls.Events.ERROR, (_, data) => {
          if (data.details === Hls.ErrorDetails.BUFFER_STALLED_ERROR) setIsBuffering(true);
        });
        hlsInstance.on(Hls.Events.STALL_RESOLVED, () => setIsBuffering(false));
      } else {
        video.src = src;
        video.addEventListener('canplay', () => { restoreProgress(video); startPlayback(); }, { once: true });
      }
    } else {
      video.src = src;
      video.preload = "metadata";
      video.load();
      video.addEventListener('loadeddata', () => { restoreProgress(video); video.currentTime = 0.01; }, { once: true });
      video.addEventListener('canplay', startPlayback, { once: true });
    }

    return () => {
      video.pause();
      if (hlsRef.current) hlsRef.current.destroy();
    };
  }, [src, autoPlay, videoId]);

  // =========================
  // HANDLERS
  // =========================
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const current = videoRef.current.currentTime;
    setProgress(current);
    updateBuffered();

    if (Math.abs(current - lastSavedTime.current) > 5) {
      lastSavedTime.current = current;
      try {
        const hist = JSON.parse(localStorage.getItem(HISTORY_KEY) || '{}');
        hist[videoId] = { time: current, duration: videoRef.current.duration };
        localStorage.setItem(HISTORY_KEY, JSON.stringify(hist));
      } catch {}
    }
  };

  const updateBuffered = () => {
    if (videoRef.current?.duration) {
      const b = videoRef.current.buffered;
      if (b.length) setBuffered((b.end(b.length - 1) / videoRef.current.duration) * 100);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) setDuration(videoRef.current.duration);
  };

  const togglePlay = () => isPlaying ? videoRef.current?.pause() : videoRef.current?.play();

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    if (videoRef.current) { videoRef.current.currentTime = time; setProgress(time); }
  };

  const skipTime = (amount: number) => {
    if (videoRef.current) videoRef.current.currentTime += amount;
    setRipple({ side: amount > 0 ? 'right' : 'left' });
    setTimeout(() => setRipple({ side: null }), 600);
  };

  const handleQualityChange = (id: number) => {
    if (hlsRef.current) {
      hlsRef.current.currentLevel = id;
      setCurrentQuality(id);
      const height = qualities.find(q => q.id === id)?.height;
      if (height) localStorage.setItem(QUALITY_KEY, height.toString());
      else localStorage.removeItem(QUALITY_KEY);
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
    controlsTimeoutRef.current = setTimeout(() => isPlaying && setShowControls(false), 4000);
  };

  const handleMouseLeave = () => isPlaying && setShowControls(false);

  const formatTime = (time: number) => {
    if (!time || isNaN(time)) return "0:00";
    const s = Math.floor(time), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    return h > 0 ? `${h}:${m < 10 ? '0' : ''}${m}:${sec < 10 ? '0' : ''}${sec}` : `${m}:${sec < 10 ? '0' : ''}${sec}`;
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
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onProgress={updateBuffered}
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => setIsBuffering(false)}
        className="netflix-video"
      />

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

      {resumeTime && (
        <div className="resume-toast">
          <span>Resume at {formatTime(resumeTime)}?</span>
          <div className="resume-btns">
            <button onClick={handleResume} className="resume-yes">Resume</button>
            <button onClick={() => setResumeTime(null)} className="resume-no">✕</button>
          </div>
        </div>
      )}

      <div className={`netflix-header ${showControls ? 'visible' : ''}`}>
        <button onClick={() => router.back()} className="back-button control-btn">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5m7 7l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="header-title">{title}</h2>
      </div>

      {!isPlaying && !isBuffering && (
        <div className="center-play pointer-events-none">
          <svg viewBox="0 0 24 24" className="center-icon"><path d="M8 5v14l11-7z" /></svg>
        </div>
      )}

      <div className={`netflix-controls ${showControls ? 'visible' : ''}`}>
        <div className="progress-container">
          <div className="buffer-bar" style={{ width: `${buffered}%` }} />
          <input type="range" min="0" max={duration || 100} value={progress} onChange={handleSeek} className="progress-slider" />
          <div className="progress-fill" style={{ width: `${(progress / (duration || 1)) * 100}%` }} />
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

            <button onClick={() => skipTime(-10)} className="control-btn skip-btn">
              <svg viewBox="0 0 24 24" fill="none"><path d="M12 5V1L7 6L12 11V7C15.3137 7 18 9.68629 18 13C18 16.3137 15.3137 19 12 19C8.68629 19 6 16.3137 6 13H4C4 17.4183 7.58172 21 12 21C16.4183 21 20 17.4183 20 13C20 8.58172 16.4183 5 12 5Z" fill="currentColor"/><text x="12" y="15" textAnchor="middle" fill="currentColor" fontSize="6" fontWeight="bold">10</text></svg>
            </button>

            <button onClick={() => skipTime(10)} className="control-btn skip-btn">
              <svg viewBox="0 0 24 24" fill="none"><path d="M12 5V1L17 6L12 11V7C8.68629 7 6 9.68629 6 13C6 16.3137 8.68629 19 12 19C15.3137 19 18 16.3137 18 13H20C20 17.4183 16.4183 21 12 21C7.58172 21 4 17.4183 4 13C4 8.58172 7.58172 5 12 5Z" fill="currentColor"/><text x="12" y="15" textAnchor="middle" fill="currentColor" fontSize="6" fontWeight="bold">10</text></svg>
            </button>

            <div className="volume-container">
              <button onClick={toggleMute} className="control-btn volume-btn">
                {isMuted || volume === 0 ? <svg viewBox="0 0 24 24"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" /></svg> : <svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" /></svg>}
              </button>
              <input type="range" min="0" max="1" step="0.05" value={isMuted ? 0 : volume} onChange={handleVolumeChange} className="volume-slider" />
            </div>

            <div className="time-display">{formatTime(progress)} / {formatTime(duration)}</div>
          </div>

          <div className="controls-right">
            {qualities.length > 0 && (
              <select className="quality-select" value={currentQuality} onChange={(e) => handleQualityChange(Number(e.target.value))}>
                <option value="-1">Auto {autoHeight > 0 && `(${autoHeight}p)`}</option>
                {qualities.map(q => <option key={q.id} value={q.id}>{q.height}p HD</option>)}
              </select>
            )}
            <button onClick={toggleFullscreen} className="control-btn fullscreen-btn">
              {isFullscreen ? <svg viewBox="0 0 24 24"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" /></svg> : <svg viewBox="0 0 24 24"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" /></svg>}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .netflix-player-wrapper { position: relative; width: 100%; height: 100%; background: #000; overflow: hidden; font-family: 'Inter', sans-serif; }
        .netflix-player-wrapper.hide-cursor { cursor: none; }
        .netflix-video { width: 100%; height: 100%; object-fit: contain; background: #000; }
        
        .netflix-header { position: absolute; top: 0; left: 0; right: 0; height: 120px; background: linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, transparent 100%); display: flex; align-items: flex-start; padding: 2rem; opacity: 0; transition: opacity 0.4s ease; pointer-events: none; z-index: 20; }
        .netflix-header.visible { opacity: 1; pointer-events: auto; }
        .back-button { color: white; background: transparent; cursor: pointer; border: none; display: flex; margin-right: 2rem; }
        .header-title { color: white; font-size: 1.5rem; font-weight: 600; text-shadow: 0 2px 4px rgba(0,0,0,0.5); }

        .resume-toast { position: absolute; bottom: 120px; left: 30px; background: rgba(20,20,20,0.95); color: white; padding: 12px 20px; border-radius: 8px; display: flex; align-items: center; gap: 15px; z-index: 40; border: 1px solid rgba(255,255,255,0.1); backdrop-filter: blur(10px); }
        .resume-btns { display: flex; gap: 10px; }
        .resume-yes { background: #e50914; color: white; border: none; padding: 4px 12px; border-radius: 4px; font-weight: bold; cursor: pointer; }
        .resume-no { background: none; border: none; color: white; cursor: pointer; font-size: 1.2rem; }

        .center-play { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(0,0,0,0.6); border-radius: 50%; width: 80px; height: 80px; display: flex; align-items: center; justify-content: center; z-index: 10; backdrop-filter: blur(4px); }
        .center-icon { width: 48px; fill: white; }

        .netflix-controls { position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 60%, transparent 100%); padding: 2rem 1.5rem 1.5rem; opacity: 0; transition: opacity 0.4s ease; display: flex; flex-direction: column; gap: 1rem; pointer-events: none; z-index: 20; }
        .netflix-controls.visible { opacity: 1; pointer-events: auto; }
        
        .progress-container { position: relative; height: 4px; background: rgba(255,255,255,0.2); border-radius: 2px; cursor: pointer; transition: height 0.2s; margin-bottom: 0.5rem; }
        .progress-container:hover { height: 8px; }
        .progress-slider { position: absolute; width: 100%; top: -8px; opacity: 0; cursor: pointer; z-index: 10; }
        .progress-fill { position: absolute; height: 100%; background: #e50914; border-radius: 2px; }
        .buffer-bar { position: absolute; height: 100%; background: rgba(255,255,255,0.35); }
        
        .controls-row { display: flex; justify-content: space-between; align-items: center; }
        .controls-left, .controls-right { display: flex; align-items: center; gap: 1.5rem; }
        .control-btn { background: none; border: none; color: white; cursor: pointer; transition: transform 0.2s; }
        .control-btn:hover { transform: scale(1.15); }
        .control-btn svg { width: 38px; height: 38px; fill: currentColor; }
        
        .volume-container { display: flex; align-items: center; gap: 0.8rem; }
        .volume-slider { width: 0; opacity: 0; transition: width 0.3s, opacity 0.3s; height: 4px; accent-color: #e50914; }
        .volume-container:hover .volume-slider { width: 100px; opacity: 1; }
        .time-display { color: white; font-size: 1.05rem; }

        .quality-select { 
          background: rgba(40, 40, 40, 0.8); 
          color: white; 
          border: 1px solid rgba(255,255,255,0.2); 
          border-radius: 4px; 
          padding: 6px 12px; 
          font-size: 0.85rem; 
          cursor: pointer;
          outline: none;
        }
        
        .ripple-container { position: absolute; top: 0; bottom: 0; width: 50%; opacity: 0; display: flex; align-items: center; justify-content: center; background: radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%); transition: opacity 0.4s; pointer-events: none; color: white; font-weight: bold; }
        .ripple-container.left { left: 0; }
        .ripple-container.right { right: 0; }
        .ripple-container.active { opacity: 1; }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
