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
    const src = (video as any).trailerUrl || video.videoUrl || '';
    if (!src) return;

    const startTime = history.time > 5 ? history.time : PREVIEW_START;

    const playVideo = async () => {
      vid.currentTime = Math.min(startTime, vid.duration ? vid.duration - 5 : startTime);
      try { await vid.play(); } catch (e) { }
      vid.style.transition = `opacity ${FADE_DURATION}ms ease`;
      vid.style.opacity = "1";
    };

    if (src.endsWith('.m3u8') && Hls.isSupported()) {
      hls = new Hls({ startPosition: startTime });
      hls.loadSource(src);
      hls.attachMedia(vid);
      hls.on(Hls.Events.MANIFEST_PARSED, playVideo);
    } else {
      vid.src = src;
      vid.addEventListener('loadedmetadata', playVideo, { once: true });
    }

    return () => { if (hls) hls.destroy(); };
  }, [video, history]);

  if (!video) return null;

  const modal = (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        
        <div className="modal-hero">
          <img src={normalizeUrl((video as any).backdropUrl || video.thumbnailUrl)} className="backdrop-img" />
          <video ref={videoRef} className="modal-video" muted={isMuted} playsInline />
          <div className="modal-gradient"></div>
          
          <div className="modal-hero-content">
            <h1 className="modal-title">{video.title}</h1>
            <div className="modal-controls">
              <Link href={`/watch/${video.id}`} className="btn-play">
                <span className="play-icon">▶</span> Play
              </Link>
              <button className="btn-circle" onClick={() => setIsMuted(!isMuted)}>
                {isMuted ? '🔇' : '🔊'}
              </button>
            </div>
          </div>
        </div>

        <div className="modal-details">
          <p>{video.description}</p>
        </div>
      </div>

      <style jsx>{`
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); z-index: 9999; display: flex; justify-content: center; align-items: flex-start; padding: 2rem 0; overflow-y: auto; }
        .modal-content { background: #181818; width: 90%; max-width: 850px; border-radius: 8px; overflow: hidden; position: relative; }
        .modal-hero { position: relative; height: 450px; }
        .backdrop-img, .modal-video { position: absolute; width: 100%; height: 100%; object-fit: cover; }
        .modal-gradient { position: absolute; inset: 0; background: linear-gradient(to top, #181818, transparent 60%); }
        .modal-hero-content { position: absolute; bottom: 3rem; left: 3rem; }
        .modal-title { font-size: 3rem; margin-bottom: 1.5rem; color: #fff; }
        
        .modal-controls { display: flex; gap: 1rem; }
        .btn-play { 
          background: white; color: black; padding: 0.8rem 2rem; border-radius: 4px; 
          display: flex; align-items: center; gap: 0.6rem; font-weight: 700; 
          text-decoration: none; font-size: 1.2rem; transition: background 0.2s;
        }
        .btn-play:hover { background: #e6e6e6; }
        .play-icon { font-size: 0.8rem; }
        
        .btn-circle { 
          background: rgba(42,42,42,0.7); border: 2px solid rgba(255,255,255,0.2); 
          color: white; width: 50px; height: 50px; border-radius: 50%; 
          display: flex; align-items: center; justify-content: center; cursor: pointer;
        }
        .modal-close { position: absolute; top: 1rem; right: 1rem; background: rgba(0,0,0,0.5); color: white; border: none; border-radius: 50%; width: 40px; height: 40px; cursor: pointer; font-size: 1.2rem; }
        .modal-details { padding: 3rem; color: #fff; font-size: 1.1rem; }
      `}</style>
    </div>
  );
  return ReactDOM.createPortal(modal, document.body);
}