"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";
import YouTube from "react-youtube";
import { Play, Info, Volume2, VolumeX } from "lucide-react";
import { HomepageItem } from "@/types/homepage";

interface HeroBannerProps {
  content: HomepageItem | null;
}

// Helper to safely extract YouTube ID
const extractYoutubeId = (url: string | null | undefined): string | null => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
};

// Format duration from seconds or fallback safely
const formatDuration = (duration?: number): string => {
  if (!duration) return "";
  const hours = Math.floor(duration / 3600);
  const minutes = Math.floor((duration % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

export default function HeroBanner({ content }: HeroBannerProps) {
  const modalSegment = useSelectedLayoutSegment("modal");
  const isModalOpen = !!modalSegment;

  const heroRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const [showVideo, setShowVideo] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [inView, setInView] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const backdropUrl = content?.backdropUrl || content?.thumbnailUrl || "/placeholder.jpg";
  const youtubeId = content?.trailerUrl?.split("v=")[1]?.split("&")[0] || content?.trailerUrl;
  const detailHref = content ? (content.isTvShow ? `/shows/${content.id}` : `/movies/${content.id}`) : "#";

  // Intersection Observer for auto-play behavior
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.6 }
    );
    if (heroRef.current) observer.observe(heroRef.current);
    return () => observer.disconnect();
  }, []);

  // Trailer delay and visibility management
  useEffect(() => {
    if (isModalOpen || !inView) {
      setShowVideo(false);
      if (playerRef.current?.pauseVideo) {
        try {
          playerRef.current.pauseVideo();
        } catch (e) {
          console.warn("Could not pause player", e);
        }
      }
      return;
    }

    const timer = setTimeout(() => {
      setShowVideo(true);
    }, 2500);

    return () => clearTimeout(timer);
  }, [inView, isModalOpen]);

  // Handle playback state when visibility changes
  useEffect(() => {
    if (!playerRef.current || !videoReady) return;
    try {
      if (inView && !isModalOpen) {
        playerRef.current.playVideo();
      } else {
        playerRef.current.pauseVideo();
      }
    } catch (e) {
      console.warn("Player control error:", e);
    }
  }, [inView, isModalOpen, videoReady]);

  if (!content) return null;

  return (
    <section className="hero-container" ref={heroRef} aria-label={`Featured: ${content.title}`}>
      {/* Background Image Layer with smooth fade-in */}
      <div className="hero-background">
        <Image 
          src={backdropUrl} 
          alt={content.title} 
          fill 
          priority 
          className={`hero-image ${imageLoaded ? "loaded" : ""}`}
          sizes="100vw"
          onLoad={() => setImageLoaded(true)}
          style={{ objectFit: 'cover', objectPosition: 'center' }}
        />
      </div>

      {/* Trailer Layer (Crossfades when ready) */}
      {showVideo && youtubeId && (
        <div className={`video-layer ${videoReady ? "active" : ""}`}>
          <YouTube 
            videoId={youtubeId} 
            opts={{ 
              playerVars: { 
                autoplay: 1, 
                controls: 0, 
                modestbranding: 1, 
                loop: 1, 
                mute: 1, 
                playlist: youtubeId, 
                rel: 0,
                fs: 0,
                iv_load_policy: 3
              } 
            }} 
            onReady={(e) => { 
              playerRef.current = e.target; 
              setVideoReady(true); 
              try {
                e.target.playVideo();
              } catch (err) {
                console.warn("Auto-play error:", err);
              }
            }} 
            className="youtube-container"
            iframeClassName="youtube-iframe"
          />
        </div>
      )}

      {/* Cinematic Gradient Overlays */}
      <div className="gradient-overlay-left" />
      <div className="gradient-overlay-bottom" />
      <div className="gradient-overlay-top" />

      {/* Content Info (Lower Left) */}
      <div className="hero-content">
        <h1 className="hero-title">{content.title}</h1>
        
        <div className="hero-meta">
          {content.releaseYear > 0 && <span className="meta-item">{content.releaseYear}</span>}
          {content.maturityRating && <span className="badge">{content.maturityRating}</span>}
          {content.duration ? <span className="meta-item">{formatDuration(content.duration)}</span> : null}
          {content.seasonCount && content.seasonCount > 0 ? (
            <span className="meta-item">{content.seasonCount} Season{content.seasonCount > 1 ? 's' : ''}</span>
          ) : null}
          {content.categories && content.categories.length > 0 && (
            <span className="meta-categories">{content.categories.slice(0, 3).join(" • ")}</span>
          )}
        </div>

        <p className="hero-description">{content.description || content.storyline}</p>
        
        <div className="hero-buttons">
          <Link href={`/watch/${content.id}`} aria-label={`Play ${content.title}`}>
           <div className="play-button"> <Play size={24} fill="currentColor" /> Play </div>
          </Link>
          <Link 
            href={detailHref}  
            aria-label={`More info about ${content.title}`}
            onClick={() => {
              if (playerRef.current && typeof playerRef.current.pauseVideo === 'function') {
                try {
                  playerRef.current.pauseVideo();
                } catch (e) {
                  console.warn("Could not pause player", e);
                }
              }
            }}
          >
           <div  className="info-button"> <Info size={24} /> More Info </div>
          </Link>
        </div>
      </div>

      {/* Mute Toggle Control (Lower Right) */}
      <div className="hero-controls">
        <button 
          className="mute-button" 
          aria-label={isMuted ? "Unmute trailer" : "Mute trailer"}
          onClick={() => {
            if (!playerRef.current) return;
            if (isMuted) {
              playerRef.current.unMute();
              setIsMuted(false);
            } else {
              playerRef.current.mute();
              setIsMuted(true);
            }
          }}
        >
          {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
        </button>
      </div>

      <style jsx>{`
        .hero-container {
          position: relative;
          width: 100%;
          height: 80vh;
          min-height: 550px;
          max-height: 900px;
          background-color: #000;
          overflow: hidden;
          box-sizing: border-box;
        }

        .hero-background, .video-layer, .hero-image {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
        }

        .hero-image {
          opacity: 0;
          transition: opacity 0.8s ease;
        }

        .hero-image.loaded {
          opacity: 1;
        }

        .video-layer {
          opacity: 0;
          transition: opacity 1.2s ease;
          z-index: 2;
        }

        .video-layer.active { 
          opacity: 1; 
        }

        /* Perfectly maintain 16:9 aspect ratio and cinematic framing */
        :global(.youtube-container) {
          position: relative;
          width: 100%;
          height: 100%;
          overflow: hidden;
          pointer-events: none;
        }
        
        :global(.youtube-iframe) {
          width: 100vw;
          height: 56.25vw; /* 16:9 calc */
          min-height: 100vh;
          min-width: 177.77vh; /* 16:9 calc */
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          pointer-events: none;
        }

        /* Netflix-style Multi-layered Gradients */
        .gradient-overlay-left {
          position: absolute;
          inset: 0;
          z-index: 3;
          background: linear-gradient(77deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.5) 45%, transparent 85%);
          pointer-events: none;
        }

        .gradient-overlay-bottom {
          position: absolute;
          inset: 0;
          z-index: 3;
          background: linear-gradient(180deg, transparent 60%, rgba(0,0,0,0.7) 85%, #000 100%);
          pointer-events: none;
        }

        .gradient-overlay-top {
          position: absolute;
          inset: 0;
          z-index: 3;
          background: linear-gradient(180deg, rgba(0,0,0,0.6) 0%, transparent 20%);
          pointer-events: none;
        }

        .hero-content {
          position: absolute;
          bottom: 18%;
          left: 4%;
          z-index: 10;
          width: 90%;
          max-width: 600px;
        }

        .hero-title { 
          font-size: 3.5rem; 
          font-weight: 800; 
          color: #fff; 
          margin-bottom: 1rem; 
          text-shadow: 2px 2px 8px rgba(0,0,0,0.6);
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          line-height: 1.1;
        }

        .hero-meta { 
          display: flex; 
          flex-wrap: wrap;
          align-items: center;
          gap: 12px; 
          color: #fff; 
          font-weight: 500; 
          font-size: 1.05rem;
          margin-bottom: 1rem; 
        }

        .meta-item {
          white-space: nowrap;
        }

        .meta-categories {
          color: #d1d5db;
          font-size: 0.95rem;
        }

        .badge { 
          border: 1px solid rgba(255, 255, 255, 0.4); 
          padding: 0 6px; 
          font-size: 0.85rem; 
          font-weight: 700;
          border-radius: 2px;
          background: rgba(255, 255, 255, 0.1);
        }

        .hero-description { 
          color: #fff; 
          font-size: 1.1rem; 
          line-height: 1.45; 
          margin-bottom: 1.5rem; 
          text-shadow: 1px 1px 4px rgba(0,0,0,0.6); 
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .hero-buttons { 
          display: flex; 
          gap: 1rem; 
          flex-wrap: wrap;
        }
        
        .play-button { 
          display: flex; 
          align-items: center; 
          gap: 12px; 
          background: #fff; 
          color: #000; 
          padding: 0.9rem 2rem; 
          border-radius: 8px; 
          font-weight: 800; 
          font-size: 1.1rem;
          text-decoration: none; 
          transition: transform 0.2s, background 0.2s; 
        }
        .play-button:hover { background: rgba(255,255,255,0.75); transform: scale(1.02); }
        
        .info-button { 
          display: flex; 
          align-items: center; 
          gap: 12px; 
          background: rgba(109,109,110,0.7); 
          color: #fff; 
          padding: 0.9rem 2rem; 
          border-radius: 8px; 
          border: none; 
          font-weight: 800; 
          font-size: 1.1rem;
          cursor: pointer; 
          transition: transform 0.2s, background 0.2s; 
          text-decoration: none; 
          backdrop-filter: blur(8px);
        }
        .info-button:hover { background: rgba(109,109,110,0.5); transform: scale(1.02); }

        .hero-controls {
          position: absolute;
          right: 4%;
          bottom: 18%;
          z-index: 10;
          display: flex;
          align-items: center;
        }
        
        .mute-button { 
          width: 50px; 
          height: 50px; 
          border-radius: 50%; 
          border: 1px solid rgba(255,255,255,0.3); 
          background: rgba(0,0,0,0.4); 
          color: white; 
          cursor: pointer; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          transition: 0.2s; 
          backdrop-filter: blur(4px);
        }
        .mute-button:hover { border-color: #fff; background: rgba(255,255,255,0.1); }

        @media (max-width: 1024px) {
          .hero-content {
            max-width: 500px;
          }
          .hero-title {
            font-size: 2.8rem;
          }
        }

        @media (max-width: 768px) {
          .hero-container { 
            height: 65vh; 
            min-height: 450px;
          }
          .hero-content { 
            bottom: 12%; 
            width: 92%;
            left: 4%;
          }
          .hero-title { 
            font-size: 2rem; 
            margin-bottom: 0.5rem;
          }
          .hero-description {
            font-size: 0.95rem;
            -webkit-line-clamp: 3;
            margin-bottom: 1rem;
          }
          .play-button, .info-button { 
            padding: 0.7rem 1.5rem; 
            font-size: 0.95rem; 
          }
          .mute-button { 
            width: 40px; 
            height: 40px; 
          }
          .hero-controls {
            bottom: 12%;
          }
        }
      `}</style>
    </section>
  );
}