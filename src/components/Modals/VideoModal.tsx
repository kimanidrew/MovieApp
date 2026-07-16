"use client";

import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import Link from 'next/link';
import Hls from 'hls.js';
import { normalizeUrl } from "@/utils/normalizeUrl";
import { Video } from "@/types/video"; // Import shared type

const PREVIEW_START = 120;
const PREVIEW_DURATION = 150;
const FADE_DURATION = 800;

interface VideoModalProps {
  video: Video | null;
  videos: Video[];
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
    // Assuming trailerUrl is accessible via video object
    const src = (video as any).trailerUrl || video.videoUrl || '';
    if (!src) return;

    const startTime = history.time > 5 ? history.time : PREVIEW_START;

    const playVideo = async () => {
      vid.currentTime = Math.min(startTime, vid.duration ? vid.duration - 5 : startTime);
      try { await vid.play(); } catch (e) { console.error("Autoplay prevented", e); }
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

    const handleTimeUpdate = () => {
      if (!vid.duration) return;
      const endTime = startTime + PREVIEW_DURATION;
      if (vid.currentTime >= endTime - (FADE_DURATION / 1000) && !isFading) {
        setIsFading(true);
        vid.style.opacity = "0";
      }
      if (vid.currentTime >= endTime) {
        vid.currentTime = startTime + 0.05;
        vid.style.opacity = "1";
        setIsFading(false);
      }
    };
    vid.addEventListener('timeupdate', handleTimeUpdate);
    return () => { if (hls) hls.destroy(); vid.removeEventListener('timeupdate', handleTimeUpdate); };
  }, [video, history, isFading]);

  const toggleMyList = () => {
    try {
      let list = JSON.parse(localStorage.getItem('movieflix-mylist') || '[]');
      if (inMyList) list = list.filter((id: string) => id !== video?.id);
      else list.push(video?.id);
      localStorage.setItem('movieflix-mylist', JSON.stringify(list));
      setInMyList(!inMyList);
    } catch (e) { }
  };

  if (!video) return null;

  const modal = (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content animate-pop" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg></button>
        <div className="modal-hero">
          <div className="modal-video-wrapper">
             {/* Using 'any' cast for backdropUrl as it might not be in the base interface yet */}
             <img src={normalizeUrl((video as any).backdropUrl || video.thumbnailUrl)} style={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'cover' }} />
            {( (video as any).trailerUrl || video.videoUrl) && (
              <video ref={videoRef} className="modal-video" muted={isMuted} playsInline style={{ opacity: 0, position: 'relative', zIndex: 1 }} />
            )}
            <div className="modal-gradient"></div>
          </div>
          <div className="modal-hero-content">
            <h1 className="modal-title">{video.title}</h1>
            <div className="modal-controls">
              <Link href={`/watch/${video.id}`} className="btn-play"><svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>Play</Link>
              <button className="btn-circle" onClick={toggleMyList}>{inMyList ? <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" /></svg> : <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" /></svg>}</button>
              <button className="btn-circle" onClick={() => setIsMuted(!isMuted)}>{isMuted ? <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71z" /></svg> : <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" /></svg>}</button>
            </div>
          </div>
        </div>
        <div className="modal-details">
          <div className="modal-meta-row"><span>98% Match</span><span>{video.releaseYear}</span><span>{video.maturityRating}</span></div>
          <p>{video.description}</p>
          <p><strong>Genres:</strong> {video.categories.join(", ")}</p>
        </div>
      </div>
      <style jsx>{`
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); z-index: 9999; display: flex; justify-content: center; align-items: flex-start; overflow-y: auto; padding: 2rem 0; backdrop-filter: blur(5px); }
        .modal-content { background: #181818; width: 90%; max-width: 850px; border-radius: 12px; overflow: hidden; position: relative; margin-top: 2rem; }
        .modal-hero { position: relative; width: 100%; height: 400px; }
        .modal-video { width: 100%; height: 100%; object-fit: cover; }
        .modal-gradient { position: absolute; bottom: 0; width: 100%; height: 150px; background: linear-gradient(to top, #181818, transparent); }
        .modal-hero-content { position: absolute; bottom: 2rem; left: 2rem; z-index: 10; }
        .modal-title { font-size: 2.5rem; margin-bottom: 1rem; }
        .modal-controls { display: flex; gap: 1rem; }
        .btn-play { background: white; color: black; padding: 0.6rem 2rem; border-radius: 4px; display: flex; align-items: center; gap: 0.5rem; font-weight: bold; text-decoration: none; }
        .btn-circle { background: rgba(42,42,42,0.6); border: 1px solid rgba(255,255,255,0.5); color: white; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; }
        .modal-details { padding: 2rem; color: #fff; }
        .modal-meta-row { display: flex; gap: 1rem; margin-bottom: 1rem; }
        .modal-close { position: absolute; top: 1rem; right: 1rem; z-index: 20; background: #181818; color: white; border: none; border-radius: 50%; width: 36px; height: 36px; cursor: pointer; }
      `}</style>
    </div>
  );
  return ReactDOM.createPortal(modal, document.body);
}