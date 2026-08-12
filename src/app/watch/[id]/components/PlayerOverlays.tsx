"use client";

import React, { useEffect, useState } from "react";

interface Props {
  isBuffering: boolean;
  resumeTime: number | null;
  showSkipButton: boolean;
  recommendations: any[]; // New Prop

  restoreVideo: () => void;
  closeResume: () => void;
  handleSkipIntro: () => void;
}

export default function PlayerOverlays({
  isBuffering,
  resumeTime,
  showSkipButton,
  recommendations,
  restoreVideo,
  closeResume,
  handleSkipIntro,
}: Props) {
  const [countdown, setCountdown] = useState<number>(10);
  const [shouldRenderResume, setShouldRenderResume] = useState<boolean>(false);
  const [showRecs, setShowRecs] = useState(false); // UI toggle for recommendations

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
    return h > 0 ? `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}` : `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
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
          <button type="button" className="resume-btn" onClick={restoreVideo}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
            Resume at {formatOverlayTime(resumeTime)} <span className="countdown-timer">({countdown}s)</span>
          </button>
          <button type="button" className="close-resume-btn" onClick={closeResume}>✕</button>
        </div>
      )}

      {showSkipButton && (
        <div className="skip-intro-container">
          <button type="button" className="skip-btn" onClick={handleSkipIntro}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" style={{ marginRight: "6px" }}><path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z" /></svg>
            Skip Intro
          </button>
        </div>
      )}

      {/* NEW: Recommendation Trigger / Overlay */}
      {recommendations.length > 0 && (
        <div className="recs-trigger">
          <button onClick={() => setShowRecs(!showRecs)}>More Like This</button>
        </div>
      )}

      {showRecs && (
        <div className="recs-overlay">
          <h3>More Like This</h3>
          <div className="recs-grid">
            {recommendations.map((rec) => (
              <div key={rec.id} className="rec-item">
                <img src={rec.thumbnailUrl || "/placeholder.jpg"} alt={rec.title} />
                <p>{rec.title}</p>
              </div>
            ))}
          </div>
          <button className="close-recs" onClick={() => setShowRecs(false)}>✕</button>
        </div>
      )}

      <style jsx>{`
        /* Existing Styles ... */
        .buffer { position: absolute; inset: 0; z-index: 120; display: flex; align-items: center; justify-content: center; pointer-events: none; }
        .spinner { width: 60px; height: 60px; border: 6px solid rgba(255, 255, 255, 0.1); border-top-color: #ec4899; border-radius: 50%; animation: spin 1s linear infinite; }
        .resume-container { position: absolute; bottom: 140px; left: 4%; z-index: 130; display: flex; align-items: center; gap: 2px; background: rgba(20, 20, 20, 0.95); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 4px; pointer-events: auto; }
        .resume-btn { background: transparent; border: none; color: #ffffff; padding: 14px 20px; font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 8px; }
        .countdown-timer { color: #ec4899; }
        .close-resume-btn { background: transparent; border: none; color: #aaa; padding: 14px 16px; cursor: pointer; border-left: 1px solid rgba(255, 255, 255, 0.15); }
        .skip-intro-container { position: absolute; bottom: 140px; right: 4%; z-index: 130; pointer-events: auto; }
        .skip-btn { background: rgba(20, 20, 20, 0.92); border: 1px solid rgba(255, 255, 255, 0.35); color: #ffffff; padding: 14px 28px; font-weight: 600; text-transform: uppercase; border-radius: 4px; cursor: pointer; }
        
        /* New Recommendation UI */
        .recs-trigger { position: absolute; top: 20px; right: 20px; z-index: 130; pointer-events: auto; }
        .recs-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.9); z-index: 140; padding: 40px; display: flex; flex-direction: column; }
        .recs-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 20px; }
        .rec-item img { width: 100%; border-radius: 4px; }
        .close-recs { position: absolute; top: 20px; right: 20px; background: none; border: none; color: white; font-size: 2rem; cursor: pointer; }
        
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}