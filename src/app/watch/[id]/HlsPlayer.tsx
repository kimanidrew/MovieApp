"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import Hls from "hls.js";

import PlayerControls from "./components/PlayerControls";
import PlayerOverlays from "./components/PlayerOverlays";
import PlayerHeader from "./components/PlayerHeader";
import { playerStyles } from "./components/playerStyles";
import { normalizeUrl } from "@/utils/normalizeUrl";

interface HlsPlayerProps {
  src: string | null | undefined;
  videoId: string;
  title: string;
  poster?: string;
  introStart?: number | string | null;
  introEnd?: number | string | null;
  isProcessing?: boolean;
}

export default function HlsPlayer(props: HlsPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const rafRef = useRef<number | null>(null);
  const hlsInitRef = useRef(false);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const lastSaveRef = useRef(0);

  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);

  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  const [resumeTime, setResumeTime] = useState<number | null>(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSkipButton, setShowSkipButton] = useState(false);

  const [qualities, setQualities] = useState<{ id: number; height: number }[]>([]);
  const [currentQuality, setCurrentQuality] = useState<number>(-1); 
  const [isQualityOpen, setIsQualityOpen] = useState(false);
  const [showControls, setShowControls] = useState(true);

  const [actionAnimation, setActionAnimation] = useState<{ type: "play" | "pause" | "forward" | "rewind"; key: number } | null>(null);

  // Scene fade transition state flag
  const [isSceneFading, setIsSceneFading] = useState(false);

  const introStart = props.introStart !== undefined && props.introStart !== null ? parseInt(props.introStart.toString(), 10) : 0;
  const introEnd = props.introEnd !== undefined && props.introEnd !== null ? parseInt(props.introEnd.toString(), 10) : 0;

  // ========================
  // UNIFIED WATCH HISTORY LOGS SAVE
  // ========================
  const saveHistory = useCallback((t: number, d: number) => {
    if (!props.videoId || d <= 0) return;
    try {
      const hist = JSON.parse(localStorage.getItem("movieflix-history") || "{}");
      hist[props.videoId] = {
        time: Math.floor(t),
        duration: Math.floor(d),
        updatedAt: Date.now()
      };
      localStorage.setItem("movieflix-history", JSON.stringify(hist));
    } catch (e) {
      console.error("Failed writing watch history logs", e);
    }
  }, [props.videoId]);

  // ========================
  // ANIMATION TIMELINE LOOPER LOOP
  // ========================
  const loop = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;

    const t = v.currentTime;
    const totalDuration = v.duration || 0;
    setProgress(t);

    if (v.buffered.length && totalDuration) {
      const end = v.buffered.end(v.buffered.length - 1);
      setBuffered((end / totalDuration) * 100);
    }

    if (t >= introStart && t < introEnd && introEnd > 0) {
      setShowSkipButton(true);
    } else {
      setShowSkipButton(false);
    }

    if (Math.abs(t - lastSaveRef.current) > 5) {
      lastSaveRef.current = t;
      saveHistory(t, totalDuration);
    }

    rafRef.current = requestAnimationFrame(loop);
  }, [saveHistory, introStart, introEnd]);

  // ========================
  // SKIP INTRO (WITH SCENE TRANSITION)
  // ========================
  const handleSkipIntro = () => {
    const v = videoRef.current;
    if (!v) return;

    setIsSceneFading(true); // 👈 1. Trigger dark backdrop cover layer

    setTimeout(() => {
      v.currentTime = introEnd; // 👈 2. Warp video timestamp behind cover
      setShowSkipButton(false);
      triggerAnimation("forward");

      // 3. Smoothly fade video into view after rendering frame positions
      setTimeout(() => {
        setIsSceneFading(false);
      }, 150);
    }, 250); 
  };

  // ========================
  // RESUME VIDEO (WITH SCENE TRANSITION)
  // ========================
  const restoreVideo = () => {
    const v = videoRef.current;
    if (!v || resumeTime === null) return;

    setIsSceneFading(true); // 👈 1. Trigger dark backdrop cover layer
    const targetTime = resumeTime;
    setResumeTime(null); 

    setTimeout(() => {
      v.currentTime = targetTime; // 👈 2. Warp video timestamp behind cover
      
      v.play()
        .then(() => setIsPlaying(true))
        .catch((err) => console.log("User action play engagement blocked:", err));

      // 3. Smoothly fade video into view after rendering frame positions
      setTimeout(() => {
        setIsSceneFading(false);
      }, 150);
    }, 250);
  };

  const closeResume = useCallback(() => setResumeTime(null), []);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;

    if (v.paused) {
      v.play().then(() => setIsPlaying(true)).catch(() => {});
      triggerAnimation("play");
    } else {
      v.pause();
      setIsPlaying(false);
      triggerAnimation("pause");
    }
  };

  const skipTime = (amount: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime += amount;
    triggerAnimation(amount > 0 ? "forward" : "rewind");
  };

  const triggerAnimation = (type: "play" | "pause" | "forward" | "rewind") => {
    setActionAnimation({ type, key: Date.now() });
  };

  const toggleFullscreen = async () => {
    if (!wrapperRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await wrapperRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch {}
  };

  const handleQualityChange = (id: number) => {
    if (!hlsRef.current) return;
    hlsRef.current.currentLevel = id;
    setCurrentQuality(id);
    setIsQualityOpen(false);
  };

  const resetControlsTimeout = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        if (!isQualityOpen) setShowControls(false);
      }, 3000);
    }
  }, [isPlaying, isQualityOpen]);

  useEffect(() => {
    resetControlsTimeout();
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [resetControlsTimeout]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") return;
      resetControlsTimeout();

      switch (e.key.toLowerCase()) {
        case " ":
        case "k":
          e.preventDefault();
          togglePlay();
          break;
        case "arrowleft":
        case "j":
          e.preventDefault();
          skipTime(-10);
          break;
        case "arrowright":
        case "l":
          e.preventDefault();
          skipTime(10);
          break;
        case "f":
          e.preventDefault();
          toggleFullscreen();
          break;
        case "m":
          e.preventDefault();
          const v = videoRef.current;
          if (v) {
            v.muted = !v.muted;
            setIsMuted(v.muted);
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPlaying, isFullscreen, isQualityOpen, resetControlsTimeout]);

  // ========================
  // INTRINSIC HLS INITIALIZATION ENGINE
  // ========================
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !props.src) return;

    if (hlsInitRef.current) return;
    hlsInitRef.current = true;

    const tokenizedSrc = normalizeUrl(props.src);
    let hls: Hls | null = null;

    try {
      const hist = JSON.parse(localStorage.getItem("movieflix-history") || "{}");
      const savedItem = hist[props.videoId];
      if (savedItem && savedItem.time > 5 && (savedItem.time / (savedItem.duration || 1)) < 0.95) {
        setResumeTime(savedItem.time);
      }
    } catch (e) {
      console.error(e);
    }

    const startPlayback = () => {
      video.play()
        .then(() => setIsPlaying(true))
        .catch((err) => console.warn("Awaiting prompt initialization gesture:", err));
    };

    if (Hls.isSupported() && tokenizedSrc.includes(".m3u8")) {
      const urlObj = new URL(tokenizedSrc);
      const token = urlObj.searchParams.get("token");
      const expires = urlObj.searchParams.get("expires");

      hls = new Hls({
        capLevelToPlayerSize: true,
        xhrSetup: (xhr, url) => {
          if (token && expires && !url.includes("token=")) {
            const separator = url.includes("?") ? "&" : "?";
            const rewrittenUrl = `${url}${separator}token=${token}&expires=${expires}`;
            xhr.open("GET", rewrittenUrl, true);
          }
        }
      });
      hlsRef.current = hls;

      hls.loadSource(tokenizedSrc);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        const availableQualities = data.levels.map((level, index) => ({
          id: index,
          height: level.height,
        }));
        setQualities(availableQualities.sort((a, b) => b.height - a.height));
        startPlayback();
      });
    } else {
      video.src = tokenizedSrc;
      video.addEventListener("loadedmetadata", startPlayback, { once: true });
    }

    const onPlay = () => {
      setIsPlaying(true);
      rafRef.current = requestAnimationFrame(loop);
    };

    const onPause = () => {
      setIsPlaying(false);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };

    const onWaiting = () => setIsBuffering(true);
    const onPlaying = () => setIsBuffering(false);
    const onLoaded = () => setDuration(video.duration || 0);

    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("waiting", onWaiting);
    video.addEventListener("playing", onPlaying);
    video.addEventListener("loadedmetadata", onLoaded);

    return () => {
      if (video) {
        video.removeEventListener("play", onPlay);
        video.removeEventListener("pause", onPause);
        video.removeEventListener("waiting", onWaiting);
        video.removeEventListener("playing", onPlaying);
        video.removeEventListener("loadedmetadata", onLoaded);
      }
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (hls) hls.destroy();
      hlsInitRef.current = false;
    };
  }, [props.src, loop, props.videoId]);

  return (
    <div 
      ref={wrapperRef} 
      className={`player-wrapper ${showControls ? "controls-visible" : "controls-hidden"}`}
      onMouseMove={resetControlsTimeout}
      style={{ cursor: showControls ? "default" : "none", position: "relative", width: "100%", height: "100vh", background: "#000", overflow: "hidden" }}
    >
      {/* 🎬 CINEMATIC SCENE TRANSITION OVERLAY LAYER */}
      <div className={`scene-fade-overlay ${isSceneFading ? "fade-black" : ""}`} />

      <div 
        className="video-click-capture" 
        onClick={togglePlay} 
        style={{ width: "100%", height: "100%", position: "absolute", inset: 0, zIndex: 1 }} 
      />

      <video 
        ref={videoRef} 
        className="video" 
        playsInline 
        poster={props.poster}
        style={{ width: "100%", height: "100%", objectFit: "contain" }}
      />

      {/* Ripple Animation Layers */}
      {actionAnimation && (
        <div key={actionAnimation.key} className={`action-ripple-container alignment-${actionAnimation.type}`} style={{ zIndex: 2 }}>
          {["play", "pause"].includes(actionAnimation.type) ? (
            <div className="ripple-icon-circle">
              {actionAnimation.type === "play" && <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z" fill="white"/></svg>}
              {actionAnimation.type === "pause" && <svg viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" fill="white"/></svg>}
            </div>
          ) : (
            <div className="ripple-transparent-icon-circle">
              {actionAnimation.type === "forward" && <svg viewBox="0 0 24 24"><path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z" fill="white"/></svg>}
              {actionAnimation.type === "rewind" && <svg viewBox="0 0 24 24"><path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z" fill="white"/></svg>}
            </div>
          )}
        </div>
      )}

      <PlayerHeader title={props.title} showControls={showControls} />

      <PlayerOverlays
        isBuffering={isBuffering}
        resumeTime={resumeTime}
        showSkipButton={showSkipButton}
        restoreVideo={restoreVideo}
        closeResume={closeResume}
        handleSkipIntro={handleSkipIntro}
      />

      <PlayerControls
        isPlaying={isPlaying}
        progress={progress}
        duration={duration}
        buffered={buffered}
        volume={volume}
        isMuted={isMuted}
        togglePlay={togglePlay}
        toggleMute={() => {
          const v = videoRef.current;
          if (!v) return;
          v.muted = !v.muted;
          setIsMuted(v.muted);
        }}
        skipTime={skipTime}
        handleVolumeChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          const v = videoRef.current;
          if (!v) return;
          const val = Number(e.target.value);
          v.volume = val;
          setVolume(val);
        }}
        setSeek={(t: number) => {
          const v = videoRef.current;
          if (v) v.currentTime = t;
        }}
        formatTime={(t: number) => {
          if (isNaN(t)) return "00:00";
          const h = Math.floor(t / 3600);
          const m = Math.floor((t % 3600) / 60);
          const s = Math.floor(t % 60);
          return h > 0 
            ? `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
            : `${m}:${s.toString().padStart(2, "0")}`;
        }}
        qualities={qualities}
        currentQuality={currentQuality}
        autoHeight={
          hlsRef.current?.currentLevel === -1 
            ? hlsRef.current.levels[hlsRef.current.loadLevel]?.height || 0 
            : 0
        }
        isQualityOpen={isQualityOpen}
        isFullscreen={isFullscreen}
        handleQualityChange={handleQualityChange}
        setIsQualityOpen={setIsQualityOpen}
        toggleFullscreen={toggleFullscreen}
      />

      <style>{playerStyles}</style>

      <style>{`
        .controls-hidden .netflix-header,
        .controls-hidden .netflix-controls {
          opacity: 0 !important;
          pointer-events: none !important;
        }
        .controls-visible .netflix-header,
        .controls-visible .netflix-controls {
          opacity: 1 !important;
          pointer-events: auto !important;
        }
        .action-ripple-container {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          pointer-events: none;
          z-index: 85;
        }
        .alignment-play, .alignment-pause { justify-content: center; }
        .alignment-rewind { justify-content: flex-start; padding-left: 15%; }
        .alignment-forward { justify-content: flex-end; padding-right: 15%; }
        
        .ripple-icon-circle {
          background: rgba(0, 0, 0, 0.7);
          border-radius: 50%;
          width: 90px;
          height: 90px;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: rippleEffect 0.8s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }
        .ripple-icon-circle svg { width: 50px; height: 50px; }
        
        .ripple-transparent-icon-circle {
          background: transparent;
          border-radius: 50%;
          width: 90px;
          height: 90px;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: rippleEffect 0.8s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }
        .ripple-transparent-icon-circle svg { width: 50px; height: 50px; }

        /* Cinema crossfade layout overlay rules */
        .scene-fade-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0);
          z-index: 95;
          pointer-events: none;
          transition: background 0.25s cubic-bezier(0.25, 1, 0.5, 1);
        }
        .scene-fade-overlay.fade-black {
          background: rgba(0, 0, 0, 1);
        }
        
        @keyframes rippleEffect {
          0% { transform: scale(0.6); opacity: 0; }
          30% { transform: scale(1.1); opacity: 0.9; }
          100% { transform: scale(1.3); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
