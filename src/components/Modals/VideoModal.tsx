"use client";

import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import Link from 'next/link';
import { normalizeUrl } from "@/utils/normalizeUrl";
import { Video } from "@/types/video";

interface VideoModalProps {
  video: Video | null;
  videos: Video[];
  onClose: () => void;
}

export default function VideoModal({ video, videos, onClose }: VideoModalProps) {
  const [inMyList, setInMyList] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  // SCROLL LOCK EFFECT
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  useEffect(() => {
    if (!video) return;
    const list = JSON.parse(localStorage.getItem('movieflix-mylist') || '[]');
    setInMyList(list.includes(video.id));
  }, [video]);

  const toggleMyList = () => {
    let list = JSON.parse(localStorage.getItem('movieflix-mylist') || '[]');
    if (inMyList) list = list.filter((id: string) => id !== video?.id);
    else list.push(video?.id);
    localStorage.setItem('movieflix-mylist', JSON.stringify(list));
    setInMyList(!inMyList);
  };

  if (!video) return null;

  const modal = (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        
        <div className="modal-hero">
          <img src={normalizeUrl((video as any).backdropUrl || video.thumbnailUrl)} className="hero-img" />
          <video ref={videoRef} className="modal-video" muted={isMuted} autoPlay loop playsInline />
          <div className="modal-gradient"></div>
          
          <div className="modal-hero-content">
            <h1 className="modal-title">{video.title}</h1>
            <div className="modal-controls">
              <Link href={`/watch/${video.id}`} className="btn-play">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                <span>Play</span>
              </Link>
              <button className="btn-circle" onClick={toggleMyList}>{inMyList ? <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" /></svg> : <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" /></svg>}</button>
              <button className="btn-circle" onClick={() => setIsMuted(!isMuted)}>{isMuted ? <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71z" /></svg> : <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" /></svg>}</button>
            </div>
          </div>
        </div>

        <div className="modal-details">
          <div className="modal-meta-row">
            <span className="match">98% Match</span>
            <span>{video.releaseYear}</span>
            <span className="rating">{video.maturityRating}</span>
          </div>
          <p className="categories"><strong>Genres:</strong> {video.categories?.join(", ")}</p>
          <p className="description">{video.description}</p>
        </div>

        <div className="more-like-this">
          <h3>More Like This</h3>
          <div className="grid">
            {videos.filter(v => v.id !== video.id).slice(0, 6).map((v) => (
              <div key={v.id} className="grid-item">
                <img src={normalizeUrl(v.thumbnailUrl || '')} alt={v.title} />
                <p>{v.title}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

     
      <style jsx>{`
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); z-index: 9999; display: flex; justify-content: center; align-items: flex-start; padding: 2rem 0; overflow-y: auto; backdrop-filter: blur(8px); }
        .modal-content { background: #181818; width: 90%; max-width: 850px; border-radius: 12px; overflow: hidden; position: relative; box-shadow: 0 20px 50px rgba(0,0,0,0.5); margin: auto; }
        .modal-hero { position: relative; height: 450px; }
        .hero-img, .modal-video { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
        .modal-gradient { position: absolute; inset: 0; background: linear-gradient(to top, #181818 10%, transparent 80%); }
        .modal-hero-content { position: absolute; bottom: 3rem; left: 3rem; }
        .modal-title { font-size: 3rem; color: #fff; margin-bottom: 1.5rem; text-shadow: 0 2px 4px rgba(0,0,0,0.5); }
        
        .modal-controls { display: flex; align-items: center; gap: 1rem; }
        
        :global(.btn-play) { background: #fff !important; color: #000 !important; padding: 0.8rem 2.5rem !important; border-radius: 4px !important; display: flex !important; align-items: center !important; gap: 0.5rem !important; font-weight: 700 !important; text-decoration: none !important; transition: transform 0.2s, background 0.2s !important; }
        :global(.btn-play:hover) { background: #e6e6e6 !important; transform: scale(1.05); }
        
        .btn-circle { background: rgba(42,42,42,0.6); border: 2px solid rgba(255,255,255,0.2); color: white; width: 45px; height: 45px; border-radius: 50%; cursor: pointer; transition: border 0.2s; display: flex; align-items: center; justify-content: center; }
        .btn-circle:hover { border: 2px solid white; }
        
        .modal-details { padding: 2rem 3rem; color: #fff; }
        .modal-meta-row { display: flex; gap: 1.5rem; font-weight: 600; margin-bottom: 1.5rem; }
        .match { color: #46d369; }
        .rating { border: 1px solid #777; padding: 0 0.4rem; border-radius: 2px; }
        .description { width: 75%; font-size: 1.1rem; line-height: 1.6; color: #d2d2d2; }
        
        .more-like-this { padding: 2rem 3rem; border-top: 1px solid #333; }
        .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; margin-top: 1.5rem; }
        .grid-item { background: #2f2f2f; border-radius: 8px; overflow: hidden; padding-bottom: 0.5rem; }
        .grid-item img { width: 100%; height: 140px; object-fit: cover; }
        .grid-item p { padding: 0.5rem; font-size: 0.9rem; font-weight: 500; }
        
        .modal-close { position: absolute; top: 1.5rem; right: 1.5rem; background: rgba(0,0,0,0.6); color: white; border: none; border-radius: 50%; width: 40px; height: 40px; cursor: pointer; z-index: 20; font-size: 1.2rem; }
      `}</style>
    </div>
  );
  return ReactDOM.createPortal(modal, document.body);
}