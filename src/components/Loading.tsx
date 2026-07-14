"use client";

import React from "react";

export default function Loading() {
  return (
    <div className="loading-screen">
      <div className="loading-container">
        {/* Pulsing MFLIX Logo */}
        <h1 className="loading-brand text-gradient">MFLIX</h1>
        
        {/* Modern Spinner */}
        <div className="spinner">
          <div className="spinner-inner"></div>
        </div>
      </div>

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
          gap: 1.5rem;
        }

        .loading-brand {
          font-size: 3rem;
          font-weight: 900;
          letter-spacing: 2px;
          animation: pulse 1.8s ease-in-out infinite;
          user-select: none;
        }

        /* Red gradient match to your branding */
        .text-gradient {
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
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 0.5;
            transform: scale(0.96);
          }
          50% {
            opacity: 1;
            transform: scale(1.04);
          }
        }
      `}</style>
    </div>
  );
}