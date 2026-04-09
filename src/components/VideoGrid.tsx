"use client";

import React, { useState, useEffect } from 'react';
import VideoModal from './VideoModal';
import Link from 'next/link';

interface Video {
  id: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  videoUrl?: string | null;
  hlsManifestUrl?: string | null;
  releaseYear: number | null;
}

interface VideoGridProps {
  videos: Video[];
  isTvPage?: boolean;
}

export default function VideoGrid({ videos, isTvPage = false }: VideoGridProps) {
  const [history, setHistory] = useState<{ [id: string]: { time: number, duration: number } }>({});
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  useEffect(() => {
    try {
      const hist = JSON.parse(localStorage.getItem('movieflix-history') || '{}');
      setHistory(hist);
    } catch (e) { }
  }, [selectedVideo]); // re-fetch history tracking locally when popup closes so UI lines refresh

  if (videos.length === 0) {
    return <p style={{ color: '#777', fontSize: '1.2rem' }}>No cinematic drops found in the database. Head to Uploads to cast the first stone.</p>;
  }

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '2.5rem' }}>
        {videos.map(video => {
          const hist = history[video.id];
          const hasHistory = hist && hist.time > 5;
          const progressPct = hasHistory && hist.duration > 0 ? Math.min(100, Math.max(0, (hist.time / hist.duration) * 100)) : 0;

          return (
            <div
              key={video.id}
              className="premium-poster-card"
              onClick={() => setSelectedVideo(video)}
            >
              <div className="poster-img-wrapper">
                <img src={video.thumbnailUrl || 'https://images.unsplash.com/photo-1552526922-8393e878411d?q=80&w=600'} alt={video.title} />

                {hasHistory && (
                  <div className="poster-progress-container">
                    <div className="poster-progress-fill" style={{ width: `${progressPct}%` }}></div>
                  </div>
                )}

                <div className="poster-play-overlay">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z" /></svg>
                </div>
              </div>
              <div className="poster-info">
                <h3>{video.title}</h3>
                <p>
                  <span className="match-score">98% Match</span>
                  <span className="release-year">{video.releaseYear || '2024'}</span>
                  <span className="type-badge">{isTvPage ? 'TV Series' : 'Feature Film'}</span>
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {selectedVideo && (
        <VideoModal
          video={selectedVideo}
          onClose={() => setSelectedVideo(null)}
          isTvShow={isTvPage || selectedVideo.id.includes('tv')}
        />
      )}

      <style>{`
        .premium-poster-card {
          cursor: pointer;
          border-radius: 8px;
          overflow: hidden;
          background: #181818;
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease;
          box-shadow: 0 4px 6px rgba(0,0,0,0.3);
        }
        .premium-poster-card:hover {
          transform: scale(1.05) translateY(-5px);
          box-shadow: 0 10px 20px rgba(0,0,0,0.6);
          z-index: 10;
        }
        
        .poster-img-wrapper {
          position: relative;
          width: 100%;
          padding-top: 56.25%; /* 16:9 Aspect Ratio */
          overflow: hidden;
          background: #222;
        }
        .poster-img-wrapper img {
          position: absolute;
          top: 0; left: 0;
          width: 100%; height: 100%;
          object-fit: cover;
          transition: opacity 0.3s ease;
        }
        .premium-poster-card:hover .poster-img-wrapper img {
          opacity: 0.7;
        }

        .poster-progress-container {
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 4px;
          background: rgba(255,255,255,0.2);
          z-index: 5;
        }
        .poster-progress-fill {
          height: 100%;
          background: #e50914;
        }

        .poster-play-overlay {
          position: absolute;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          width: 60px; height: 60px;
          background: rgba(0,0,0,0.6);
          border: 1px solid rgba(255,255,255,0.4);
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          opacity: 0;
          transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), background 0.3s ease;
          z-index: 5;
        }
        .premium-poster-card:hover .poster-play-overlay {
          opacity: 1;
        }
        .poster-play-overlay:hover {
          background: rgba(229, 9, 20, 0.8);
          border-color: transparent;
        }

        .poster-info {
          padding: 1rem;
        }
        .poster-info h3 {
          font-size: 1.1rem;
          margin: 0 0 0.5rem 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .poster-info p {
          margin: 0;
          font-size: 0.85rem;
          display: flex;
          align-items: center;
          gap: 0.6rem;
          color: #bcbcbc;
        }
        .match-score { color: #46d369; font-weight: bold; }
        .type-badge {
          border: 1px solid rgba(255,255,255,0.3);
          padding: 0 0.3rem;
          border-radius: 3px;
          font-size: 0.75rem;
        }
      `}</style>
    </>
  );
}
