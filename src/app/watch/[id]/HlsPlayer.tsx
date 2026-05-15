"use client";

import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";

import Hls from "hls.js";

import PlayerControls from "./components/PlayerControls";
import PlayerHeader from "./components/PlayerHeader";
import PlayerOverlays from "./components/PlayerOverlays";

import { playerStyles } from "./components/playerStyles";
import { HlsPlayerProps } from "./components/types";

export default function HlsPlayer(
  props: HlsPlayerProps
) {
  const videoRef =
    useRef<HTMLVideoElement>(null);

  const wrapperRef =
    useRef<HTMLDivElement>(null);

  const hlsRef =
    useRef<Hls | null>(null);

  const controlsTimeout =
    useRef<NodeJS.Timeout | null>(
      null
    );

  const progressRAF =
    useRef<number | null>(null);

  const lastSavedTime =
    useRef(0);

  // =========================
  // STATES
  // =========================

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

  const [isMuted, setIsMuted] =
    useState(false);

  const [brightness] =
    useState(1);

  const [showControls, setShowControls] =
    useState(true);

  const [qualities, setQualities] =
    useState<any[]>([]);

  const [currentQuality, setCurrentQuality] =
    useState(-1);

  const [isQualityOpen, setIsQualityOpen] =
    useState(false);

  const [showCenterIcon, setShowCenterIcon] =
    useState(false);

  const [resumeTime, setResumeTime] =
    useState<number | null>(null);

  const [isFullscreen, setIsFullscreen] =
    useState(false);

  // =========================
  // CONTROLS AUTO HIDE
  // =========================

  const resetControlsTimer =
    useCallback(() => {
      if (controlsTimeout.current) {
        clearTimeout(
          controlsTimeout.current
        );
      }

      setShowControls(true);

      controlsTimeout.current =
        setTimeout(() => {
          if (
            videoRef.current &&
            !videoRef.current.paused
          ) {
            setShowControls(false);
          }
        }, 3000);
    }, []);

  // =========================
  // PROGRESS LOOP
  // =========================

  const updateProgress =
    useCallback(() => {
      const video =
        videoRef.current;

      if (!video) return;

      setProgress(video.currentTime);

      if (video.buffered.length) {
        const end =
          video.buffered.end(
            video.buffered.length - 1
          );

        setBuffered(
          (end / video.duration) * 100
        );
      }

      // SAVE WATCH HISTORY
      if (
        Math.abs(
          video.currentTime -
            lastSavedTime.current
        ) > 5
      ) {
        lastSavedTime.current =
          video.currentTime;

        const hist = JSON.parse(
          localStorage.getItem(
            "movieflix-history"
          ) || "{}"
        );

        hist[props.videoId] = {
          time: video.currentTime,
          duration: video.duration,
        };

        localStorage.setItem(
          "movieflix-history",
          JSON.stringify(hist)
        );
      }

      progressRAF.current =
        requestAnimationFrame(
          updateProgress
        );
    }, [props.videoId]);

  // =========================
  // HLS INIT
  // =========================

  useEffect(() => {
    const video =
      videoRef.current;

    if (!video || !props.src)
      return;

    let hls: Hls | null = null;

    // =====================
    // HLS.JS
    // =====================

    if (
      Hls.isSupported() &&
      props.src.includes(".m3u8")
    ) {
      hls = new Hls({
        enableWorker: true,

        lowLatencyMode: false,

        backBufferLength: 30,

        maxBufferLength: 20,

        maxMaxBufferLength: 30,

        liveSyncDurationCount: 3,

        capLevelToPlayerSize: true,

        startLevel: -1,

        abrEwmaDefaultEstimate:
          3000000,

        fragLoadingTimeOut: 20000,

        manifestLoadingTimeOut:
          10000,
      });

      hlsRef.current = hls;

      hls.loadSource(props.src);

      hls.attachMedia(video);

      // =====================
      // MANIFEST READY
      // =====================

      hls.on(
        Hls.Events.MANIFEST_PARSED,
        () => {
          const levels =
            hls?.levels.map(
              (level, index) => ({
                label: `${level.height}p`,
                value: index,
              })
            ) || [];

          setQualities([
            {
              label: "Auto",
              value: -1,
            },
            ...levels,
          ]);

          // AUTOPLAY
          video
            .play()
            .catch(() => {});
        }
      );

      // =====================
      // QUALITY SYNC
      // =====================

      hls.on(
        Hls.Events.LEVEL_SWITCHED,
        (_, data) => {
          setCurrentQuality(
            data.level
          );
        }
      );

      // =====================
      // ERROR HANDLING
      // =====================

      hls.on(
        Hls.Events.ERROR,
        (_, data) => {
          console.log(
            "HLS ERROR",
            data
          );

          if (!data.fatal) return;

          switch (data.type) {
            case Hls.ErrorTypes
              .NETWORK_ERROR:
              hls?.startLoad();
              break;

            case Hls.ErrorTypes
              .MEDIA_ERROR:
              hls?.recoverMediaError();
              break;

            default:
              hls?.destroy();
              break;
          }
        }
      );
    } else if (
      video.canPlayType(
        "application/vnd.apple.mpegurl"
      )
    ) {
      video.src = props.src;
    }

    // =====================
    // VIDEO EVENTS
    // =====================

    const onPlay = () => {
      setIsPlaying(true);

      if (!progressRAF.current) {
        updateProgress();
      }
    };

    const onPause = () => {
      setIsPlaying(false);

      if (progressRAF.current) {
        cancelAnimationFrame(
          progressRAF.current
        );

        progressRAF.current =
          null;
      }
    };

    const onWaiting = () => {
      setIsBuffering(true);
    };

    const onPlaying = () => {
      setIsBuffering(false);
    };

    const onLoadedMetadata =
      () => {
        setDuration(
          video.duration || 0
        );
      };

    // AUDIO/VIDEO DESYNC FIX
    const syncFixInterval =
      setInterval(() => {
        if (!video) return;

        if (
          video.readyState >= 3 &&
          video.paused === false
        ) {
          // force tiny correction
          const drift =
            Math.abs(
              video.currentTime -
                progress
            );

          if (drift > 1.5) {
            video.currentTime =
              progress;
          }
        }
      }, 5000);

    video.addEventListener(
      "play",
      onPlay
    );

    video.addEventListener(
      "pause",
      onPause
    );

    video.addEventListener(
      "waiting",
      onWaiting
    );

    video.addEventListener(
      "playing",
      onPlaying
    );

    video.addEventListener(
      "loadedmetadata",
      onLoadedMetadata
    );

    // =====================
    // CLEANUP
    // =====================

    return () => {
      clearInterval(
        syncFixInterval
      );

      if (progressRAF.current) {
        cancelAnimationFrame(
          progressRAF.current
        );
      }

      video.removeEventListener(
        "play",
        onPlay
      );

      video.removeEventListener(
        "pause",
        onPause
      );

      video.removeEventListener(
        "waiting",
        onWaiting
      );

      video.removeEventListener(
        "playing",
        onPlaying
      );

      video.removeEventListener(
        "loadedmetadata",
        onLoadedMetadata
      );

      hls?.destroy();
    };
  }, [
    props.src,
    props.videoId,
    progress,
    updateProgress,
  ]);

  // =========================
  // RESUME PLAYBACK
  // =========================

  useEffect(() => {
    const hist = JSON.parse(
      localStorage.getItem(
        "movieflix-history"
      ) || "{}"
    );

    const saved =
      hist[props.videoId];

    if (
      saved &&
      saved.time > 10
    ) {
      setResumeTime(saved.time);
    }
  }, [props.videoId]);

  // =========================
  // ACTIONS
  // =========================

  const togglePlay = () => {
    const video =
      videoRef.current;

    if (!video) return;

    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }

    setShowCenterIcon(true);

    setTimeout(() => {
      setShowCenterIcon(false);
    }, 400);
  };

  const toggleMute = () => {
    const video =
      videoRef.current;

    if (!video) return;

    video.muted = !video.muted;

    setIsMuted(video.muted);
  };

  const skipTime = (
    amount: number
  ) => {
    if (!videoRef.current)
      return;

    videoRef.current.currentTime +=
      amount;
  };

  const handleVolumeChange = (
    value: number
  ) => {
    if (!videoRef.current)
      return;

    videoRef.current.volume = value;

    setVolume(value);
  };

  const setSeek = (
    value: number
  ) => {
    if (!videoRef.current)
      return;

    videoRef.current.currentTime =
      value;

    setProgress(value);
  };

  const handleQualityChange = (
    level: number
  ) => {
    const hls =
      hlsRef.current;

    if (!hls) return;

    hls.currentLevel = level;

    setCurrentQuality(level);
  };

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

  const formatTime = (
    time: number
  ) => {
    if (!time) return "00:00";

    const mins = Math.floor(
      time / 60
    );

    const secs = Math.floor(
      time % 60
    );

    return `${mins}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // =========================
  // JSX
  // =========================

  return (
    <div
      ref={wrapperRef}
      className={`netflix-player-wrapper ${
        showControls
          ? ""
          : "hide-cursor"
      }`}
      style={{
        filter: `brightness(${brightness})`,
      }}
      onMouseMove={
        resetControlsTimer
      }
    >
      {/* VIDEO */}
      <video
        ref={videoRef}
        poster={props.poster}
        playsInline
        preload="metadata"
        crossOrigin="anonymous"
        controlsList="nodownload"
        disablePictureInPicture
        className="netflix-video"
      />

      {/* CLICK LAYER */}
      <div
        className="absolute inset-0 z-10 cursor-pointer"
        onClick={() => {
          togglePlay();
          resetControlsTimer();
        }}
      />

      {/* HEADER */}
      <PlayerHeader
        title={
          props.title || "Video"
        }
        showControls={
          showControls
        }
      />

      {/* OVERLAYS */}
      <PlayerOverlays
        isBuffering={
          isBuffering
        }
        showSkipButton={false}
        handleSkipIntro={() =>
          skipTime(85)
        }
        resumeTime={
          resumeTime
        }
        formatTime={
          formatTime
        }
        restoreVideo={() => {
          if (
            videoRef.current &&
            resumeTime
          ) {
            videoRef.current.currentTime =
              resumeTime;

            videoRef.current.play();

            setResumeTime(null);
          }
        }}
        closeResume={() =>
          setResumeTime(null)
        }
      />

      {/* CONTROLS */}
      <PlayerControls
        isPlaying={
          isPlaying
        }
        progress={progress}
        duration={duration}
        buffered={buffered}
        volume={volume}
        isMuted={isMuted}
        qualities={qualities}
        currentQuality={
          currentQuality
        }
        autoHeight={true}
        isQualityOpen={
          isQualityOpen
        }
        isFullscreen={
          isFullscreen
        }
        togglePlay={
          togglePlay
        }
        toggleMute={
          toggleMute
        }
        skipTime={skipTime}
        handleVolumeChange={
          handleVolumeChange
        }
        setSeek={setSeek}
        formatTime={
          formatTime
        }
        handleQualityChange={
          handleQualityChange
        }
        setIsQualityOpen={
          setIsQualityOpen
        }
        toggleFullscreen={
          toggleFullscreen
        }
      />

      <style>{`
        ${playerStyles}

        .netflix-video {
          width: 100%;
          height: 100%;
          object-fit: cover;

          background: black;

          transform: translateZ(0);

          backface-visibility: hidden;

          will-change: transform;
        }
      `}</style>
    </div>
  );
}