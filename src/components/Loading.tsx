"use client";

import React from "react";

export default function Loading() {
  return (
    <div className="loading-screen">
      <div className="loading-container">
        {/* Pulsing MFLIX Logo */}
        <h1 className="loading-brand text-gradient-2">MFLIX</h1>
    
      </div>

      {/* Using standard style tag to bypass client-side CSS injection lag */}
      <style jsx>{`
        .loading-screen {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background-color: #000000;
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 9999;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2.5rem; /* Increased spacing between title and spinner */
        }

        .loading-brand {
          margin: 0;
          font-size: 4rem;
          font-weight: 900;
          letter-spacing: 2px;
          user-select: none;
          
          /* GPU-accelerated smooth animations */
          animation: smooth-pulse 2.2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          transform: translate3d(0, 0, 0);
          will-change: transform, opacity;
        }

        /* Red gradient match to your branding */
        .text-gradient-2 {
          background: linear-gradient(to right, #3b82f6, #ec4899);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        @keyframes smooth-pulse {
          0%, 100% {
            opacity: 0.45;
            transform: translate3d(0, 0, 0) scale(0.97);
          }
          50% {
            opacity: 1;
            transform: translate3d(0, 0, 0) scale(1.03);
          }
        }
      `}</style>
    </div>
  );
}