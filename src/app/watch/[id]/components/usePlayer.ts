"use client";

import {
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";

import Hls from "hls.js";

import { HlsPlayerProps } from "./types";

import {
  HISTORY_KEY,
  SETTINGS_KEY,
  formatTime,
} from "./playerUtils";

export function usePlayer({
  src,
  videoId,
  autoPlay = true,
  introStart = 10,
  introEnd = 85,
}: HlsPlayerProps) {

  // REFS
  const videoRef =
    useRef<HTMLVideoElement>(null);

  const wrapperRef =
    useRef<HTMLDivElement>(null);

  const hlsRef =
    useRef<Hls | null>(null);

  const controlsTimeoutRef =
    useRef<NodeJS.Timeout | null>(null);

  const lastSavedTime =
    useRef<number>(0);

  const lastTapRef =
    useRef({
      time: 0,
      x: 0,
      y: 0,
    });

  const touchStartRef =
    useRef<{
      x: number;
      y: number;
    } | null>(null);

  // STATES
  const [isPlaying, setIsPlaying] =
    useState(false);

  const [isBuffering, setIsBuffering] =
    useState(false);

  const [progress, setProgress] =
    useState(0);

  const [buffered, setBuffered] =
    useState(0);

  const [duration, setDuration] =
    useState(0);

  const [volume, setVolume] =
    useState(1);

  const [brightness, setBrightness] =
    useState(1);

  const [isMuted, setIsMuted] =
    useState(false);

  const [isFullscreen, setIsFullscreen] =
    useState(false);

  const [showControls, setShowControls] =
    useState(true);

  const [resumeTime, setResumeTime] =
    useState<number | null>(null);

  const [showSkipButton, setShowSkipButton] =
    useState(false);

  const [showCenterIcon, setShowCenterIcon] =
    useState(false);

  const [qualities, setQualities] =
    useState<
      {
        id: number;
        height: number;
      }[]
    >([]);

  const [currentQuality, setCurrentQuality] =
    useState(-1);

  const [autoHeight, setAutoHeight] =
    useState(0);

  const [isQualityOpen, setIsQualityOpen] =
    useState(false);

  const [gestureUI, setGestureUI] =
    useState<{
      type:
        | "volume"
        | "brightness"
        | null;

      value: number;
    }>({
      type: null,
      value: 0,
    });

  const [skipAnim, setSkipAnim] =
    useState<{
      side:
        | "left"
        | "right"
        | null;
    }>({
      side: null,
    });

  const [autoSkipEnabled, setAutoSkipEnabled] =
    useState(() => {

      if (
        typeof window !== "undefined"
      ) {

        const saved =
          localStorage.getItem(
            SETTINGS_KEY
          );

        return saved
          ? JSON.parse(saved).autoSkip
          : false;
      }

      return false;
    });

  // PLAY / PAUSE
  const togglePlay = useCallback(() => {

    if (!videoRef.current) return;

    if (videoRef.current.paused) {

      videoRef.current
        .play()
        .catch(() => {});

    } else {

      videoRef.current.pause();
    }

    setShowCenterIcon(true);

    setTimeout(() => {
      setShowCenterIcon(false);
    }, 500);

  }, []);

  // SKIP
  const skipTime = (
    amount: number
  ) => {

    if (!videoRef.current) return;

    videoRef.current.currentTime += amount;

    const side =
      amount > 0
        ? "right"
        : "left";

    setSkipAnim({ side });

    setTimeout(() => {
      setSkipAnim({
        side: null,
      });
    }, 600);
  };

  // MUTE
  const toggleMute = () => {

    if (!videoRef.current) return;

    videoRef.current.muted =
      !videoRef.current.muted;

    setIsMuted(
      videoRef.current.muted
    );
  };

  // VOLUME
  const handleVolumeChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {

    const vol =
      Number(e.target.value);

    setVolume(vol);

    if (videoRef.current) {

      videoRef.current.volume =
        vol;

      setIsMuted(vol === 0);
    }
  };

  // SEEK
  const setSeek = (
    value: number
  ) => {

    if (!videoRef.current) return;

    videoRef.current.currentTime =
      value;

    setProgress(value);
  };

  // FULLSCREEN
  const toggleFullscreen =
    async () => {

      if (!wrapperRef.current)
        return;

      if (
        !document.fullscreenElement
      ) {

        await wrapperRef.current.requestFullscreen();

        setIsFullscreen(true);

      } else {

        await document.exitFullscreen();

        setIsFullscreen(false);
      }
    };

  // QUALITY
  const handleQualityChange = (
    id: number
  ) => {

    if (!hlsRef.current) return;

    hlsRef.current.currentLevel =
      id;

    setCurrentQuality(id);

    setIsQualityOpen(false);
  };

  // SKIP INTRO
  const handleSkipIntro =
    useCallback(() => {

      if (!videoRef.current)
        return;

      videoRef.current.currentTime =
        introEnd;

      setShowSkipButton(false);

    }, [introEnd]);

  // RESTORE VIDEO
  const restoreVideo = () => {

    if (
      !videoRef.current ||
      !resumeTime
    )
      return;

    videoRef.current.currentTime =
      resumeTime;

    videoRef.current.play();

    setResumeTime(null);
  };

  const closeResume = () => {
    setResumeTime(null);
  };

  // TOUCH START
  const handleTouchStart = (
    e: React.TouchEvent
  ) => {

    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
  };

  // TOUCH MOVE
  const handleTouchMove = (
    e: React.TouchEvent
  ) => {

    if (
      !touchStartRef.current ||
      !videoRef.current
    )
      return;

    const touchY =
      e.touches[0].clientY;

    const deltaY =
      touchStartRef.current.y -
      touchY;

    const change =
      deltaY / 200;

    const rect =
      e.currentTarget.getBoundingClientRect();

    const isLeftSide =
      touchStartRef.current.x <
      rect.width / 2;

    if (isLeftSide) {

      const newBrightness =
        Math.min(
          Math.max(
            brightness + change,
            0.2
          ),
          1.5
        );

      setBrightness(
        newBrightness
      );

      setGestureUI({
        type: "brightness",
        value: Math.round(
          (newBrightness / 1.5) * 100
        ),
      });

    } else {

      const newVolume =
        Math.min(
          Math.max(
            volume + change,
            0
          ),
          1
        );

      videoRef.current.volume =
        newVolume;

      setVolume(newVolume);

      setGestureUI({
        type: "volume",
        value: Math.round(
          newVolume * 100
        ),
      });
    }

    touchStartRef.current.y =
      touchY;
  };

  // TOUCH END
  const handleTouchEnd = () => {

    touchStartRef.current =
      null;

    setTimeout(() => {

      setGestureUI({
        type: null,
        value: 0,
      });

    }, 1000);
  };

  // SHOW / HIDE CONTROLS
  const handleMouseMove = () => {

    setShowControls(true);

    if (
      controlsTimeoutRef.current
    ) {
      clearTimeout(
        controlsTimeoutRef.current
      );
    }

    controlsTimeoutRef.current =
      setTimeout(() => {

        if (
          isPlaying &&
          !isQualityOpen &&
          !gestureUI.type
        ) {

          setShowControls(false);
        }

      }, 4000);
  };

  // VIDEO SETUP
  useEffect(() => {

    const video =
      videoRef.current;

    if (!video) return;

    if (
      src.endsWith(".m3u8") &&
      Hls.isSupported()
    ) {

      const hls = new Hls({
        capLevelToPlayerSize: true,
        startLevel: -1,
      });

      hlsRef.current = hls;

      hls.loadSource(src);

      hls.attachMedia(video);

      hls.on(
        Hls.Events.MANIFEST_PARSED,
        (_, data) => {

          const sorted =
            data.levels
              .map((l, i) => ({
                id: i,
                height: l.height,
              }))
              .sort(
                (a, b) =>
                  b.height - a.height
              );

          setQualities(sorted);

          if (sorted.length > 0) {

            hls.currentLevel =
              sorted[0].id;

            setCurrentQuality(
              sorted[0].id
            );
          }

          const hist =
            JSON.parse(
              localStorage.getItem(
                HISTORY_KEY
              ) || "{}"
            );

          if (
            hist[videoId]?.time > 10
          ) {

            setResumeTime(
              hist[videoId].time
            );
          }

          if (autoPlay) {

            video
              .play()
              .catch(() => {

                video.muted = true;

                setIsMuted(true);

                video.play();
              });
          }
        }
      );

      hls.on(
        Hls.Events.LEVEL_SWITCHED,
        (_, data) => {

          const level =
            hls.levels[data.level];

          if (level) {

            setAutoHeight(
              level.height
            );
          }
        }
      );

    } else {

      video.src = src;

      if (autoPlay) {

        video
          .play()
          .catch(() => {

            video.muted = true;

            setIsMuted(true);

            video.play();
          });
      }
    }

    return () => {
      hlsRef.current?.destroy();
    };

  }, [
    src,
    videoId,
    autoPlay,
  ]);

  // INTRO DETECTION
  useEffect(() => {

    const insideIntro =
      progress >= introStart &&
      progress < introEnd;

    if (insideIntro) {

      if (autoSkipEnabled) {

        handleSkipIntro();

      } else {

        setShowSkipButton(true);
      }

    } else {

      setShowSkipButton(false);
    }

  }, [
    progress,
    introStart,
    introEnd,
    autoSkipEnabled,
    handleSkipIntro,
  ]);

  return {

    videoRef,
    wrapperRef,

    // STATES
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
    autoHeight,

    resumeTime,

    isQualityOpen,

    showCenterIcon,

    gestureUI,

    skipAnim,

    showSkipButton,

    // REFS
    lastTapRef,
    lastSavedTime,

    // SETTERS
    setProgress,
    setBuffered,
    setDuration,

    setIsPlaying,
    setIsBuffering,

    setShowControls,
    setIsQualityOpen,

    // HANDLERS
    togglePlay,
    toggleMute,

    skipTime,

    handleVolumeChange,

    setSeek,

    handleQualityChange,

    toggleFullscreen,

    handleSkipIntro,

    restoreVideo,
    closeResume,

    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,

    handleMouseMove,

    formatTime,
  };
}