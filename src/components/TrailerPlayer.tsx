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
            position: "absolute",
            top: "50%",
            left: "50%",
            width: "150%", // Scale up to cover gaps
            height: "180%",
            transform: "translate(-50%, -50%)",
            pointerEvents: "none",
          }}
        />
      ) : (
        <video
          src={url}
          autoPlay
          loop
          muted
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