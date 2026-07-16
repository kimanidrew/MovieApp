"use client";

import React, { useState, useMemo, useEffect } from "react";
import YouTube from "react-youtube";

interface TrailerPlayerProps {
  url: string;
  isActive: boolean;
}

export default function TrailerPlayer({ url, isActive }: TrailerPlayerProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [progress, setProgress] = useState(0);

  const youtubeId = useMemo(() => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  }, [url]);

  useEffect(() => {
    if (isLoaded || !isActive) return;
    const interval = setInterval(() => {
      setProgress((prev) => (prev < 90 ? prev + 10 : 90));
    }, 150);
    return () => clearInterval(interval);
  }, [isLoaded, isActive]);

  const handleComplete = () => {
    setProgress(100);
    setTimeout(() => setIsLoaded(true), 300);
  };

  if (!isActive || !url) return null;

  return (
    <div className="player-wrapper">
      {!isLoaded && (
        <div className="loading-bar-container">
          <div className="loading-bar-fill" style={{ width: `${progress}%` }} />
        </div>
      )}

      {youtubeId ? (
        <YouTube
          videoId={youtubeId}
          opts={{
            width: "100%",
            height: "100%",
            playerVars: {
              autoplay: 1,
              controls: 0,
              loop: 1,
              playlist: youtubeId,
              modestbranding: 1,
              playsinline: 1,
              rel: 0,
              showinfo: 0,
              iv_load_policy: 3,
              disablekb: 1,
            },
          }}
          onReady={handleComplete}
          style={{
            width: "400px",    // Maintains 16:9 aspect ratio for 250px height
    height: "300px",   // Matches your target height
    position: "absolute",
    top: "-60px",
    left: "-42px",     // Centers the 444px width in the 350px container (444 - 350) / 2
    transform: "scale(1.0)",
    pointerEvents: "none",
          }}
        />
      ) : (
        <video
          src={url}
          autoPlay
          loop
          muted // Added muted back as it's required for autoplay in most browsers
          playsInline
          onLoadedData={handleComplete}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      )}

      <style jsx>{`
        .player-wrapper {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
          background-color: #000;
          pointer-events: none;
        }
        .loading-bar-container {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 3px;
          background: transparent;
          z-index: 10;
        }
        .loading-bar-fill {
          height: 100%;
          background: #e50914;
          transition: width 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}