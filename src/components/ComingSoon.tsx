'use client'
import React from "react";
import PageBackground from "@/components/PageBackground";

export default function ComingSoon() {
  return (
    <main className="coming-soon-container">
      {/* Background container */}
      <div className="bg-wrapper">
        <PageBackground overlayOpacity={0.85} />
      </div>
      
      {/* Centered Content */}
      <div className="content-card">
        <h1 className="text-gradient pulse-text">COMING SOON</h1>
        <p>We are currently working on something amazing. <br /> Check back shortly.</p>
      </div>

      <style jsx>{`
        .coming-soon-container {
          position: relative;
          width: 100vw;
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .bg-wrapper {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: -1;
        }

        .content-card {
          padding: 4rem;
          border-radius: 24px;
          text-align: center;
          /* Increased width */
          max-width: 700px;
          width: 90%;
          z-index: 10;
        }

        .pulse-text {
          font-size: 5rem;
          font-weight: 900;
          margin-bottom: 1.5rem;
          letter-spacing: -2px;
          animation: pulse 2s infinite ease-in-out;
        }

        p {
          color: #94a3b8;
          font-size: 1.25rem;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(0.98); }
        }
      `}</style>
    </main>
  );
}