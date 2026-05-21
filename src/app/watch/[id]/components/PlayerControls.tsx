"use client";

import React from "react";

interface Quality {
  id: number;
  height: number;
}

interface PlayerControlsProps {
  isPlaying: boolean;
  progress: number;
  duration: number;
  buffered: number;
  volume: number;
  isMuted: boolean;
  qualities: Quality[];
  currentQuality: number;
  autoHeight: number;
  isQualityOpen: boolean;
  isFullscreen: boolean;

  togglePlay: () => void;
  toggleMute: () => void;
  skipTime: (amount: number) => void;
  handleVolumeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setSeek: (time: number) => void;
  formatTime: (time: number) => string;
  handleQualityChange: (id: number) => void;
  setIsQualityOpen: (isOpen: boolean) => void;
  toggleFullscreen: () => void;
}

export default function PlayerControls({
  isPlaying,
  progress,
  duration,
  buffered,
  volume,
  isMuted,
  qualities,
  currentQuality,
  autoHeight,
  isQualityOpen,
  isFullscreen,
  togglePlay,
  toggleMute,
  skipTime,
  handleVolumeChange,
  setSeek,
  formatTime,
  handleQualityChange,
  setIsQualityOpen,
  toggleFullscreen,
}: PlayerControlsProps) {
  
  const percentage = duration > 0 ? (progress / duration) * 100 : 0;

  const onTimelineScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetSecond = Number(e.target.value);
    setSeek(targetSecond);
  };

  return (
    <div className="netflix-controls">
      {/* TIMELINE COMPONENT TRACK */}
      <div className="progress-container">
        <div className="buffer-bar" style={{ width: `${buffered}%` }} />
        <div className="progress-fill" style={{ width: `${percentage}%` }} />
        <input
          type="range"
          min={0}
          max={duration || 100}
          value={progress}
          onChange={onTimelineScrub}
          className="progress-slider"
        />
        <div className="scrub-circle" style={{ left: `${percentage}%` }} />
      </div>

      {/* ROW CONTROLS FOOTER */}
      <div className="controls-row">
        {/* FOOTER LEFT CONTROLS */}
        <div className="controls-left">
          <button className="control-btn" onClick={togglePlay} aria-label={isPlaying ? "Pause" : "Play"}>
            {isPlaying ? (
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
            )}
          </button>

          {/* BACKWARD */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              skipTime(-10);
            }}
            className="control-btn hover-scale"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
              <text
                x="12"
                y="15"
                fontSize="6"
                fontWeight="bold"
                textAnchor="middle"
                fill="white"
              >
                10
              </text>
            </svg>
          </button>

          {/* FORWARD */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              skipTime(10);
            }}
            className="control-btn hover-scale"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 5V1l5 5-5 5V7c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8z" />
              <text
                x="12"
                y="15"
                fontSize="6"
                fontWeight="bold"
                textAnchor="middle"
                fill="white"
              >
                10
              </text>
            </svg>
          </button>

          <div className="volume-container">
            <button className="control-btn" onClick={toggleMute} aria-label="Toggle Volume Mode">
               {isMuted || volume === 0 ? (
                <svg viewBox="0 0 24 24">
                  <path
                    d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"
                    fill="white"
                  />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24">
                  <path
                    d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"
                    fill="white"
                  />
                </svg>
              )}
            </button>
            <input
              type="range"
              className="volume-slider"
              min={0}
              max={1}
              step={0.05}
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              style={{
                background: `linear-gradient(to right, #e50914 0%, #e50914 ${(isMuted ? 0 : volume) * 100}%, rgba(255, 255, 255, 0.2) ${(isMuted ? 0 : volume) * 100}%, rgba(255, 255, 255, 0.2) 100%)`
              }}
            />
          </div>

          <span className="time-display">
            {formatTime(progress)} / {formatTime(duration)}
          </span>
        </div>

        {/* FOOTER RIGHT CONTROLS */}
        <div className="controls-right">
          {qualities.length > 0 && (
            <div className="custom-quality-container">
              <button className="quality-trigger" onClick={() => setIsQualityOpen(!isQualityOpen)}>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l./*.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z"/></svg>
                {currentQuality === -1 
                  ? `Auto (${autoHeight ? autoHeight + "p" : "HD"})` 
                  : `${qualities.find((q) => q.id === currentQuality)?.height}p`}
              </button>

              {isQualityOpen && (
                <div className="quality-menu">
                  <button
                    className={currentQuality === -1 ? "active" : ""}
                    onClick={() => handleQualityChange(-1)}
                  >
                    Auto
                  </button>
                  {qualities.map((q) => (
                    <button
                      key={q.id}
                      className={currentQuality === q.id ? "active" : ""}
                      onClick={() => handleQualityChange(q.id)}
                    >
                      {q.height}p
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <button className="control-btn" onClick={toggleFullscreen} aria-label="Toggle Fullscreen Frame">
            {isFullscreen ? (
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/></svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
