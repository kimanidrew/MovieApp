"use client";

import React, { useEffect, useState } from "react";

interface Props {
  isBuffering: boolean;
  resumeTime: number | null;
  showSkipButton: boolean;

  restoreVideo: () => void;
  closeResume: () => void;
  handleSkipIntro: () => void;
}

export default function PlayerOverlays({
  isBuffering,
  resumeTime,
  showSkipButton,
  restoreVideo,
  closeResume,
  handleSkipIntro,
}: Props) {
  const [countdown, setCountdown] = useState<number>(10);
  const [shouldRenderResume, setShouldRenderResume] = useState<boolean>(false);

  useEffect(() => {
    if (resumeTime !== null && resumeTime > 0) {
      setShouldRenderResume(true);
      setCountdown(10);
    } else {
      setShouldRenderResume(false);
    }
  }, [resumeTime]);

  useEffect(() => {
    if (!shouldRenderResume) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          closeResume(); 
          return 0;
        }
        return prev - 1;
      });
    }, 2000);

    return () => clearInterval(timer);
  }, [shouldRenderResume, closeResume]);

  const formatOverlayTime = (t: number) => {
    if (isNaN(t) || t <= 0) return "00:00";
    const h = Math.floor(t / 3600);
    const m = Math.floor((t % 3600) / 60);
    const s = Math.floor(t % 60);
    return h > 0
      ? `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
      : `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <>
      {isBuffering && (
        <div className="buffer">
          <div className="spinner" />
        </div>
      )}

      {shouldRenderResume && resumeTime !== null && (
        <div className="resume-container">
          <button
            type="button"
            className="resume-btn"
            onClick={restoreVideo}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
            Resume at {formatOverlayTime(resumeTime)} <span className="countdown-timer">({countdown}s)</span>
          </button>

          <button
            type="button"
            className="close-resume-btn"
            onClick={closeResume}
          >
            ✕
          </button>
        </div>
      )}

      {showSkipButton && (
        <div className="skip-intro-container">
          <button
            type="button"
            className="skip-btn"
            onClick={handleSkipIntro}
          >
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="currentColor"
              style={{ marginRight: "6px" }}
            >
              <path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z" />
            </svg>
            Skip Intro
          </button>
        </div>
      )}

      <style jsx>{`
        .buffer {
          position: absolute;
          inset: 0;
          z-index: 120;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
        }

        .spinner {
          width: 60px;
          height: 60px;
          border: 6px solid rgba(255, 255, 255, 0.1);
          border-top-color: #e50914;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .resume-container {
          position: absolute;
          bottom: 140px;
          left: 4%;
          z-index: 130;
          display: flex;
          align-items: center;
          gap: 2px;
          background: rgba(20, 20, 20, 0.95);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 4px;
          overflow: hidden;
          pointer-events: auto;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.6);
        }

        .resume-btn {
          background: transparent;
          border: none;
          color: #ffffff;
          padding: 14px 20px;
          font-size: 0.95rem;
          font-weight: bold;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: background 0.2s;
        }

        .resume-btn:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .countdown-timer {
          color: #e50914;
          font-size: 0.9rem;
          font-weight: 500;
          margin-left: 4px;
        }

        .close-resume-btn {
          background: transparent;
          border: none;
          color: #aaa;
          padding: 14px 16px;
          font-size: 0.9rem;
          cursor: pointer;
          border-left: 1px solid rgba(255, 255, 255, 0.15);
          transition: color 0.2s;
        }

        .close-resume-btn:hover {
          color: #fff;
        }

        .skip-intro-container {
          position: absolute;
          bottom: 140px;
          right: 4%;
          z-index: 130;
          pointer-events: auto;
        }

        .skip-btn {
          background: rgba(20, 20, 20, 0.92);
          border: 1px solid rgba(255, 255, 255, 0.35);
          color: #ffffff;
          padding: 14px 28px;
          font-size: 1rem;
          font-weight: 600;
          letter-spacing: 1px;
          text-transform: uppercase;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
        }

        .skip-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: #ffffff;
          transform: scale(1.03);
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
