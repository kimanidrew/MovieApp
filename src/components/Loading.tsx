"use client";

import React from "react";

export default function Loading() {
  return (
    <div className="loading-screen">
      <div className="loading-container">
        {/* Pulsing MFLIX Logo */}
        <h1 className="loading-brand text-gradient-2">MFLIX</h1>
        
        {/* Modern Spinner */}
        <div className="spinner">
          <div className="spinner-inner"></div>
        </div>
      </div>

      {/* Using standard style tag to bypass client-side CSS injection lag */}
      <style>{`
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
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2.5rem; /* Increased spacing between title and spinner */
        }

        .loading-brand {
          margin: 0;
          font-size: 3rem;
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
          background: linear-gradient(135deg, #e50914 0%, #9b0007 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .spinner {
          width: 44px;
          height: 44px;
          border: 3px solid rgba(255, 255, 255, 0.1);
          border-radius: 50%;
          border-top-color: #e50914;
          
          /* GPU-accelerated spin */
          animation: spin 0.9s linear infinite;
          transform: translate3d(0, 0, 0);
          will-change: transform;
        }

        @keyframes spin {
          to {
            transform: translate3d(0, 0, 0) rotate(360deg);
          }
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