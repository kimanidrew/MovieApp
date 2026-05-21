"use client";

import React from "react";

interface PlayerHeaderProps {
  title: string;
  showControls: boolean;
}

export default function PlayerHeader({ title, showControls }: PlayerHeaderProps) {
  const handleBackAction = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    window.history.back();
  };

  return (
    <header className="netflix-header">
      <button className="back-button" onClick={handleBackAction} aria-label="Go Back">
        <svg viewBox="0 0 24 24" width="36" height="36" fill="currentColor">
          <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
        </svg>
      </button>
      <h1 className="header-title">{title || "Cinematic Stream"}</h1>
    </header>
  );
}
