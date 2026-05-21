"use client";

import {
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";

import Hls from "hls.js";

import {
  HISTORY_KEY,
  SETTINGS_KEY,
  formatTime,
} from "./playerUtils";

import { HlsPlayerProps } from "./types";

export function usePlayer({
  src,
  videoId,
  autoPlay = true,
  introStart = 10,
  introEnd = 85,
}: HlsPlayerProps) {

  // =====================
  // REFS
  // =====================

  const videoRef = useRef<HTMLVideoElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const hlsRef = useRef<Hls | null>(null);

  const rafRef = useRef<number | null>(null);

  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const lastSavedTime = useRef(0);

  const isSeekingRef = useRef(false);
  const hlsInitialized = useRef(false);

  // =====================
  // STATES
  // =====================

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

  const [resumeTime, setResumeTime] = useState<number | null>(null);

  const [showSkipButton, setShowSkipButton] = useState(false);

  const [qualities, setQualities] = useState<{ id: number; height: number }[]>([]);
  const [currentQuality, setCurrentQuality] = useState(-1);

  const [isQualityOpen, setIsQualityOpen] = useState(false);

  const [gestureUI, setGestureUI] = useState<{
    type: "volume" | "brightness" | null;
    value: number;
  }>({ type: null, value: 0 });

  const [autoSkipEnabled] = useState(() => {
    if (typeof window === "undefined") return false;
    const saved = localStorage.getItem(SETTINGS_KEY);
    return saved ? JSON.parse(saved).autoSkip : false;
  });

  // =====================
  // PLAY / PAUSE
  // =====================

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }

    setShowControls(true);
  }, []);

  // =====================
  // SEEK SAFE (FIX LOOP BUG)
  // =====================

  const setSeek = (value: number) => {
    const video = videoRef.current;
    if (!video) return;

    isSeekingRef.current = true;

    video.currentTime = value;
    setProgress(value);

    setTimeout(() => {
      isSeekingRef.current = false;
    }, 500);
  };

  // =====================
  // SKIP INTRO
  // =====================

  const handleSkipIntro = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    isSeekingRef.current = true;

    video.currentTime = introEnd;
    setProgress(introEnd);

    setShowSkipButton(false);

    setTimeout(() => {
      isSeekingRef.current = false;
    }, 500);
  }, [introEnd]);

  // =====================
  // RESUME
  // =====================

  const restoreVideo = () => {
    const video = videoRef.current;
    if (!video || !resumeTime) return;

    video.currentTime = resumeTime;
    video.play();

    setResumeTime(null);
  };

  const closeResume = () => setResumeTime(null);

  // =====================
  // VOLUME / MUTE
  // =====================

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = Number(e.target.value);

    const video = videoRef.current;
    if (!video) return;

    video.volume = vol;

    setVolume(vol);
    setIsMuted(vol === 0);
  };

  // =====================
  // QUALITY
  // =====================

  const handleQualityChange = (id: number) => {
    const hls = hlsRef.current;
    if (!hls) return;

    hls.currentLevel = id;
    setCurrentQuality(id);
    setIsQualityOpen(false);
  };

  // =====================
  // FULLSCREEN
  // =====================

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

  // =====================
  // PROGRESS LOOP (SAFE)
  // =====================

  const updateProgress = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (!isSeekingRef.current) {
      const t = video.currentTime;

      setProgress(t);

      if (video.buffered.length) {
        const end = video.buffered.end(video.buffered.length - 1);
        setBuffered((end / video.duration) * 100);
      }

      // SAVE HISTORY
      if (Math.abs(t - lastSavedTime.current) > 5) {
        lastSavedTime.current = t;

        const hist = JSON.parse(localStorage.getItem(HISTORY_KEY) || "{}");

        hist[videoId] = {
          time: t,
          duration: video.duration,
        };

        localStorage.setItem(HISTORY_KEY, JSON.stringify(hist));
      }
    }

    rafRef.current = requestAnimationFrame(updateProgress);
  }, [videoId]);

  // =====================
  // HLS INIT (FIXED DOUBLE INIT BUG)
  // =====================

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    if (hlsInitialized.current) return;
    hlsInitialized.current = true;

    let hls: Hls | null = null;

    if (Hls.isSupported() && src.includes(".m3u8")) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        backBufferLength: 60,
      });

      hlsRef.current = hls;

      hls.loadSource(src);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        const levels = data.levels.map((l, i) => ({
          id: i,
          height: l.height,
        }));

        setQualities(levels);

        video.muted = true;
        video.play().catch(() => {});
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) hls?.destroy();
      });
    } else {
      video.src = src;
    }

    // EVENTS
    const onPlay = () => {
      setIsPlaying(true);
      if (!rafRef.current) rafRef.current = requestAnimationFrame(updateProgress);
    };

    const onPause = () => {
      setIsPlaying(false);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };

    const onWaiting = () => setIsBuffering(true);
    const onPlaying = () => setIsBuffering(false);

    const onLoaded = () => setDuration(video.duration || 0);

    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("waiting", onWaiting);
    video.addEventListener("playing", onPlaying);
    video.addEventListener("loadedmetadata", onLoaded);

    // RESUME
    const hist = JSON.parse(localStorage.getItem(HISTORY_KEY) || "{}");
    if (hist[videoId]?.time > 5) {
      setResumeTime(hist[videoId].time);
    }

    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("waiting", onWaiting);
      video.removeEventListener("playing", onPlaying);
      video.removeEventListener("loadedmetadata", onLoaded);

      if (rafRef.current) cancelAnimationFrame(rafRef.current);

      hls?.destroy();
      hlsInitialized.current = false;
    };
  }, [src, videoId, updateProgress]);

  // =====================
  // INTRO LOGIC (SAFE)
  // =====================

  useEffect(() => {
    if (progress >= introStart && progress < introEnd) {
      if (autoSkipEnabled) {
        handleSkipIntro();
      } else {
        setShowSkipButton(true);
      }
    } else {
      setShowSkipButton(false);
    }
  }, [progress, introStart, introEnd, autoSkipEnabled, handleSkipIntro]);

  return {
    videoRef,
    wrapperRef,

    // STATE
    isPlaying,
    isBuffering,
    progress,
    buffered,
    duration,
    volume,
    brightness,
    isMuted,
    isFullscreen,
    showControls,

    qualities,
    currentQuality,

    resumeTime,
    showSkipButton,
    isQualityOpen,

    gestureUI,

    // ACTIONS
    togglePlay,
    skipTime: (n: number) => {
      const v = videoRef.current;
      if (!v) return;
      v.currentTime += n;
    },
    toggleMute,
    handleVolumeChange,
    setSeek,
    handleQualityChange,
    toggleFullscreen,
    handleSkipIntro,
    restoreVideo,
    closeResume,
    handleMouseMove: () => setShowControls(true),

    formatTime,
  };
}