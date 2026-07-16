"use client";

import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import Link from 'next/link';
import Hls from 'hls.js';
import { normalizeUrl } from "@/utils/normalizeUrl";
import { Video } from "@/types/video";

const PREVIEW_START = 120;
const PREVIEW_DURATION = 150;
const FADE_DURATION = 800;

interface VideoModalProps {
  video: Video | null;
  videos: Video[];
  onClose: () => void;
  isTvShow?: boolean;
}

export default function VideoModal({ video, onClose }: VideoModalProps) {
  const [history, setHistory] = useState<{ time: number, duration: number }>({ time: 0, duration: 0 });
  const [inMyList, setInMyList] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);

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
    const src = (video as any).trailerUrl || video.videoUrl || '';
    if (!src) return;

    const playVideo = async () => {
      vid.style.transition = `opacity ${FADE_DURATION}ms ease`;
      vid.style.opacity = "1";
      try { await vid.play(); } catch (e) { }
    };

    if (src.endsWith('.m3u8') && Hls.isSupported()) {
      hls = new Hls();
      hls.loadSource(src);
      hls.attachMedia(vid);
      hls.on(Hls.Events.MANIFEST_PARSED, playVideo);
    } else {
      vid.src = src;
      vid.addEventListener('loadedmetadata', playVideo, { once: true });
    }
    return () => { if (hls) hls.destroy(); };
  }, [video]);

  if (!video) return null;

  const modal = (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <div className="modal-hero">
          <img src={normalizeUrl((video as any).backdropUrl || video.thumbnailUrl)} className="hero-img" />
          <video ref={videoRef} className="modal-video" muted={isMuted} playsInline />
          <div className="modal-gradient"></div>
          <div className="modal-hero-content">
            <h1 className="modal-title">{video.title}</h1>
            <div className="modal-controls">
              <Link href={`/watch/${video.id}`} className="btn-play">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                <span>Play</span>
              </Link>
            </div>
          </div>
        </div>
        <div className="modal-details">
          <p>{video.description}</p>
        </div>
      </div>
      <style jsx>{`
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 9999; display: flex; justify-content: center; align-items: flex-start; overflow-y: auto; padding: 2rem 0; }
        .modal-content { background: #181818; width: 90%; max-width: 850px; border-radius: 8px; overflow: hidden; }
        .modal-hero { position: relative; height: 400px; }
        .hero-img, .modal-video { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
        .modal-gradient { position: absolute; inset: 0; background: linear-gradient(to top, #181818, transparent); }
        .modal-hero-content { position: absolute; bottom: 2rem; left: 2rem; }
        .modal-title { font-size: 2.5rem; margin-bottom: 1rem; }
        .modal-controls { display: flex; gap: 1rem; }
        
        /* Fixed Link Styling */
        :global(.btn-play) { 
          background: white !important; 
          color: black !important; 
          padding: 0.6rem 2rem !important; 
          border-radius: 4px !important; 
          display: flex !important; 
          align-items: center !important; 
          gap: 0.5rem !important; 
          font-weight: bold !important; 
          text-decoration: none !important; 
          transition: background 0.2s !important;
        }
        :global(.btn-play:hover) { background: #e6e6e6 !important; }
        
        .modal-close { position: absolute; top: 1rem; right: 1rem; background: #181818; color: white; border: none; border-radius: 50%; width: 36px; height: 36px; cursor: pointer; }
      `}</style>
    </div>
  );
  return ReactDOM.createPortal(modal, document.body);
}