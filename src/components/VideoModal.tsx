"use client";

import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import Link from 'next/link';
import Hls from 'hls.js';

const FALLBACK_IMAGE = "/fallback.jpg";
const PREVIEW_START = 120; // 2 minutes
const PREVIEW_DURATION = 150; // 2.5 minutes
const FADE_DURATION = 800; // ms

interface Video {
  id: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  videoUrl?: string | null;
  hlsManifestUrl?: string | null;
  releaseYear: number | null;
}

interface VideoModalProps {
  video: Video | null;
  onClose: () => void;
  isTvShow?: boolean;
}

export default function VideoModal({ video, onClose, isTvShow }: VideoModalProps) {
  const [history, setHistory] = useState<{ time: number, duration: number }>({ time: 0, duration: 0 });
  const [inMyList, setInMyList] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    if (!video) return;
    try {
      const hist = JSON.parse(localStorage.getItem('movieflix-history') || '{}');
      if (hist[video.id]) setHistory(hist[video.id]);

      const list = JSON.parse(localStorage.getItem('movieflix-mylist') || '[]');
      setInMyList(list.includes(video.id));
    } catch (e) { }
  }, [video]);

  useEffect(() => {
  if (!video || !videoRef.current) return;

  const vid = videoRef.current;
  let hls: Hls | null = null;

  const src = video.hlsManifestUrl || video.videoUrl || '';
  if (!src) return;

  const startTime = history.time > 5 ? history.time : PREVIEW_START;

  const applyStartTime = () => {
    const safeStart = Math.min(
      startTime,
      vid.duration ? vid.duration - 5 : startTime
    );

    vid.currentTime = safeStart;

    // 🔥 fade in on start
    vid.style.opacity = "0";
    requestAnimationFrame(() => {
      vid.style.transition = `opacity ${FADE_DURATION}ms ease`;
      vid.style.opacity = "1";
    });
  };

  if (src.endsWith('.m3u8') && Hls.isSupported()) {
    hls = new Hls({ startPosition: startTime });
    hls.loadSource(src);
    hls.attachMedia(vid);

    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      applyStartTime();
      vid.play().catch(() => {});
    });
  } else {
    vid.src = src;

    vid.addEventListener('loadedmetadata', () => {
      applyStartTime();
      vid.play().catch(() => {});
    }, { once: true });
  }

  // 🔁 LOOP WITH FADE
  const handleTimeUpdate = () => {
    if (!vid.duration) return;

    const endTime = startTime + PREVIEW_DURATION;

    // 🔥 start fade-out slightly before end
    if (
      vid.currentTime >= endTime - (FADE_DURATION / 1000) &&
      !isFading
    ) {
      setIsFading(true);

      vid.style.transition = `opacity ${FADE_DURATION}ms ease`;
      vid.style.opacity = "0";
    }

    // 🔁 loop
    if (vid.currentTime >= endTime) {
      const safeStart = Math.min(
        startTime,
        vid.duration ? vid.duration - 5 : startTime
      );

      vid.currentTime = safeStart + 0.05;

      // 🔥 fade back in
      requestAnimationFrame(() => {
        vid.style.transition = `opacity ${FADE_DURATION}ms ease`;
        vid.style.opacity = "1";
      });

      setIsFading(false);
    }
  };

  vid.addEventListener('timeupdate', handleTimeUpdate);

  return () => {
    if (hls) hls.destroy();
    vid.removeEventListener('timeupdate', handleTimeUpdate);
  };
}, [video, history, isFading]);

  if (!video) return null;

  const toggleMyList = () => {
    try {
      let list = JSON.parse(localStorage.getItem('movieflix-mylist') || '[]');
      if (inMyList) {
        list = list.filter((id: string) => id !== video.id);
      } else {
        list.push(video.id);
      }
      localStorage.setItem('movieflix-mylist', JSON.stringify(list));
      setInMyList(!inMyList);
    } catch (e) { }
  };

  const hasHistory = history.time > 5;
  const progressPct = history.duration > 0 ? Math.min(100, Math.max(0, (history.time / history.duration) * 100)) : 0;

 const normalizeUrl = (url?: string | null) => {
  if (!url) return FALLBACK_IMAGE;

  // Fix duplicated https
  if (url.startsWith("https://https://")) {
    return url.replace("https://https://", "https://");
  }

  // If already valid absolute URL, return as-is
  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  // If it's a relative path, return as-is
  if (url.startsWith("/")) {
    return url;
  }

  // Otherwise, prepend https
  return `https://${url}`;
};

 // Mock episodes if it's a TV show
  const episodes = [
    { num: 1, title: "Pilot", desc: "The beginning of an epic journey into the unknown.", img: video.thumbnailUrl },
    { num: 2, title: "The Awakening", desc: "New friends are made, but old enemies return.", img: video.thumbnailUrl },
    { num: 3, title: "Shattered Elements", desc: "A devastating loss forces the crew to adapt.", img: video.thumbnailUrl },
    { num: 4, title: "Rebirth", desc: "Finding light in the darkest of places.", img: video.thumbnailUrl }
  ];

  const modal = (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content animate-pop" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
        </button>

        <div className="modal-hero">
          <div className="modal-video-wrapper">
            {video.hlsManifestUrl || video.videoUrl ? (
              <video
                ref={videoRef}
                className="modal-video"
                muted={isMuted}
                loop={false} // 🔥 IMPORTANT (we control looping manually)
                playsInline
                poster={normalizeUrl(video.thumbnailUrl) || undefined}
                style={{ opacity: 0 }} // 🔥 start hidden for fade-in
              />
            ) : (
              <img src={normalizeUrl(video.thumbnailUrl) || ''} alt={video.title} className="modal-video" />
            )}
            <div className="modal-gradient"></div>
          </div>

          <div className="modal-hero-content">
            <h1 className="modal-title">{video.title}</h1>

            <div className="modal-controls">
              <Link href={`/watch/${video.id}`} className="btn-play">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                {hasHistory ? 'Resume' : 'Play'}
              </Link>

              <button className="btn-circle" onClick={toggleMyList} title={inMyList ? "Remove from My List" : "Add to My List"}>
                {inMyList ? (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" /></svg>
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" /></svg>
                )}
              </button>

              <button className="btn-circle" onClick={() => setIsMuted(!isMuted)} style={{ marginLeft: 'auto' }}>
                {isMuted ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" /></svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" /></svg>
                )}
              </button>
            </div>

            {hasHistory && (
              <div className="modal-progress">
                <div className="modal-progress-fill" style={{ width: `${progressPct}%` }}></div>
              </div>
            )}
          </div>
        </div>

        <div className="modal-details">
          <div className="modal-meta-row">
            <span className="match">98% Match</span>
            <span className="year">{video.releaseYear || '2024'}</span>
            <span className="age">TV-MA</span>
            <span className="hd">HD</span>
          </div>

          <p className="modal-desc">
            {video.description || 'Experience this massive cinematic event natively on MovieFlix.'}
          </p>

          {isTvShow && (
            <div className="modal-episodes">
              <div className="episodes-header">
                <h3>Episodes</h3>
                <span className="season-selector">Season 1</span>
              </div>

              <div className="episodes-list">
                {episodes.map(ep => (
                  <Link href={`/watch/${video.id}`} key={ep.num} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div className="episode-card">
                      <span className="ep-num">{ep.num}</span>
                      <div className="ep-img">
                        <img src={ep.img || 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=200'} alt={ep.title} />
                        <div className="ep-play-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z" /></svg></div>
                      </div>
                      <div className="ep-info">
                        <div className="ep-title-row">
                          <h4>{ep.title}</h4>
                          <span>45m</span>
                        </div>
                        <p>{ep.desc}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>


      <style>{`
        .modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.7);
          z-index: 9999;
          display: flex;
          justify-content: center;
          align-items: flex-start;
          overflow-y: auto;
          padding: 2rem 0;
          backdrop-filter: blur(5px);
        }
        .modal-content {
          background: #181818;
          width: 90%;
          max-width: 850px;
          border-radius: 12px;
          overflow: hidden;
          position: relative;
          box-shadow: 0 0 20px rgba(0,0,0,0.8);
          margin-top: 2rem;
          margin-bottom: 2rem;
        }
        .animate-pop {
          animation: modalPop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.1) forwards;
        }
        @keyframes modalPop {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        .modal-close {
          position: absolute;
          top: 1rem; right: 1rem;
          z-index: 20;
          background: #181818;
          color: white;
          border: none;
          border-radius: 50%;
          width: 36px; height: 36px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          transition: background 0.2s;
        }
        .modal-close:hover { background: #333; }
        
        .modal-hero {
          position: relative;
          width: 100%;
          height: 400px;
          background: #000;
        }
        .modal-video-wrapper {
          width: 100%; height: 100%;
          position: relative;
          overflow: hidden;
        }
        .modal-video {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: opacity 0.8s ease;
        }
        .modal-gradient {
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 150px;
          background: linear-gradient(to top, #181818, transparent);
        }
        .modal-hero-content {
          position: absolute;
          bottom: 2rem; left: 2rem; right: 2rem;
          z-index: 10;
        }
        .modal-title {
          font-size: 2.5rem;
          font-weight: 800;
          margin-bottom: 1.5rem;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
        }
        .modal-controls {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .btn-play {
          background: white;
          color: black;
          padding: 0.6rem 2rem;
          border-radius: 4px;
          text-decoration: none;
          font-weight: bold;
          font-size: 1.1rem;
          display: flex; align-items: center; gap: 0.5rem;
          transition: background 0.2s;
        }
        .btn-play:hover { background: rgba(255,255,255,0.8); }
        .btn-circle {
          background: rgba(42,42,42,0.6);
          border: 1px solid rgba(255,255,255,0.5);
          color: white;
          width: 40px; height: 40px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          transition: border-color 0.2s, background 0.2s;
        }
        .btn-circle:hover { border-color: white; background: rgba(255,255,255,0.1); }
        
        .modal-progress {
          margin-top: 1rem;
          width: 100%;
          max-width: 300px;
          height: 4px;
          background: rgba(255,255,255,0.2);
          border-radius: 2px;
        }
        .modal-progress-fill {
          height: 100%;
          background: #e50914;
          border-radius: 2px;
        }

        .modal-details {
          padding: 1rem 2rem 3rem;
        }
        .modal-meta-row {
          display: flex; gap: 1rem; align-items: center; margin-bottom: 1rem;
          font-weight: 500;
        }
        .match { color: #46d369; font-weight: bold; }
        .age { border: 1px solid rgba(255,255,255,0.4); padding: 0 0.4rem; font-size: 0.9rem; }
        .hd { border: 1px solid rgba(255,255,255,0.4); padding: 0 0.4rem; font-size: 0.8rem; border-radius: 3px; }
        .modal-desc {
          font-size: 1.1rem;
          line-height: 1.6;
          color: #fff;
          max-width: 65%;
          margin-bottom: 3rem;
        }

        .modal-episodes {
          margin-top: 2rem;
        }
        .episodes-header {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 1rem;
        }
        .episodes-header h3 { font-size: 1.5rem; }
        .season-selector {
          background: #242424; padding: 0.5rem 1rem; border-radius: 4px; font-weight: bold;
        }
        .episodes-list {
          display: flex; flexDirection: column; gap: 0;
        }
        .episode-card {
          display: flex; align-items: center; gap: 1rem;
          padding: 1rem; border-bottom: 1px solid #404040;
          cursor: pointer; transition: background 0.2s;
        }
        .episode-card:hover { background: #333; }
        .episode-card:hover .ep-play-icon { opacity: 1; }
        .ep-num { font-size: 1.5rem; color: #d2d2d2; width: 30px; text-align: center; }
        .ep-img { position: relative; width: 130px; height: 75px; border-radius: 4px; overflow: hidden; flex-shrink: 0; }
        .ep-img img { width: 100%; height: 100%; object-fit: cover; }
        .ep-play-icon {
          position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
          width: 32px; height: 32px; background: rgba(0,0,0,0.6); borderRadius: 50%;
          display: flex; align-items: center; justify-content: center;
          border: 1px solid white; opacity: 0; transition: opacity 0.2s;
        }
        .ep-info { flex: 1; }
        .ep-title-row { display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-weight: bold; color: white; }
        .ep-info p { margin: 0; font-size: 0.9rem; color: #d2d2d2; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
      `}</style>
    </div>
  );

  // Properly render modal in portal
  return ReactDOM.createPortal(modal, document.body);
}