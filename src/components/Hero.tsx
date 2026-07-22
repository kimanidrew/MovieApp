"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import YouTube from "react-youtube";
import { Play, Info, Volume2, VolumeX } from "lucide-react";
import VideoModal from "@/components/Modals/VideoModal";

interface HeroProps {
  pageType: "home" | "movie" | "tv";
}

export default function Hero({ pageType }: HeroProps) {
  const heroRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const hasLoaded = useRef(false); // Tracks if the component has appeared before
  const [heroData, setHeroData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showVideo, setShowVideo] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [inView, setInView] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<any>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadHero() {
      try {
        setLoading(true);
        const response = await fetch(`/api/hero-content?type=${pageType}`);
        const json = await response.json();
        if (!cancelled) setHeroData(json.trailer);
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadHero();
    return () => { cancelled = true; };
  }, [pageType]);

  useEffect(() => {
    if (!heroRef.current) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting), 
      { threshold: 0.8 } 
    );
    
    observer.observe(heroRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!playerRef.current || !videoReady) return;

    try {
      if (inView && !selectedVideo) {
        if (typeof playerRef.current.playVideo === 'function') {
          playerRef.current.playVideo();
        }
      } else {
        if (typeof playerRef.current.pauseVideo === 'function') {
          playerRef.current.pauseVideo();
        }
      }
    } catch (error) {
      console.warn("Hero: YouTube player is not reachable", error);
    }
  }, [inView, videoReady, selectedVideo]);

  // Handle video pause when modal opens
  useEffect(() => {
    if (!playerRef.current) return;
    if (selectedVideo) {
      playerRef.current.pauseVideo();
    } else if (inView) {
      playerRef.current.playVideo();
    }
  }, [selectedVideo]);

  useEffect(() => {
    if (!heroData || !inView) {
      setShowVideo(false);
      return;
    }

    // On first load, delay by 2 seconds; afterwards, show immediately
    if (!hasLoaded.current) {
      const timer = setTimeout(() => {
        setShowVideo(true);
        hasLoaded.current = true;
      }, 2000);
      return () => clearTimeout(timer);
    } else {
      setShowVideo(true);
    }
  }, [heroData, inView]);

  const heroImages = heroData?.content?.images || [];
  const logo = heroImages.find((img: any) => img.type === "LOGO")?.url;
  const backgroundImage = heroImages.find((img: any) => img.type === "HERO_ART")?.url || 
                          heroImages.find((img: any) => img.type === "BACKDROP")?.url || 
                          heroImages.find((img: any) => img.type === "POSTER")?.url;

  const youtubeId = heroData?.hlsManifestUrl?.split("v=")[1]?.split("&")[0] || heroData?.hlsManifestUrl;

  function onPlayerReady(event: any) {
    playerRef.current = event.target;
    setVideoReady(true);
    event.target.unMute();
    event.target.playVideo();
  }

  function toggleMute() {
    if (!playerRef.current) return;
    if (isMuted) {
      playerRef.current.unMute();
      setIsMuted(false);
    } else {
      playerRef.current.mute();
      setIsMuted(true);
    }
  }

  return (
    <section ref={heroRef} className="hero">
      {backgroundImage && (
        <img
          src={backgroundImage}
          alt={heroData?.content?.title}
          className={`hero-image ${imageLoaded ? "loaded" : ""}`}
          onLoad={() => setImageLoaded(true)}
        />
      )}

      {showVideo && youtubeId && (
        <div className={`video-wrapper ${videoReady ? "visible" : ""}`}>
          <YouTube 
            videoId={youtubeId} 
            opts={{ 
                width: "100%", 
                height: "100%", 
                playerVars: { autoplay: 1, controls: 0, modestbranding: 1, loop: 1, mute: 0, playlist: youtubeId } 
            }} 
            onReady={onPlayerReady} 
            className="youtube-player" 
          />
        </div>
      )}

      <div className="overlay-left" />
      <div className="overlay-top" />
      <div className="overlay-vignette" />

      <div className="hero-content">
        <div className="hero-inner">
          {logo ? <img src={logo} className="hero-logo" alt={heroData?.content?.title} /> : <h1 className="hero-title">{heroData?.content?.title}</h1>}
          
          <div className="hero-meta">
            <span className="meta-item">{heroData?.content?.releaseYear}</span>
            <span className="meta-item badge">{heroData?.content?.maturityRating}</span>
            <span className="meta-categories">{heroData?.content?.categories?.slice(0, 3).join(" • ")}</span>
          </div>

          <p className="hero-description">{heroData?.content?.description}</p>
          
          <div className="hero-buttons">
            <Link href={`/watch/${heroData?.content?.id}`}>
            <div className="play-button">
            <Play size={24} fill="currentColor" /> Play
            </div></Link>
            
            <button className="info-button" onClick={() => setSelectedVideo(heroData.content)}>
                <Info size={24} /> More Info
            </button>
          </div>
        </div>
      </div>

      <div className="hero-controls">
        <button onClick={toggleMute} className="mute-button">
          {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
        </button>
      </div>

      {selectedVideo && (
        <VideoModal 
          video={selectedVideo} 
          videos={[selectedVideo]}
          type={pageType}
          onClose={() => setSelectedVideo(null)} 
        />
      )}

      {loading && <div className="shimmer-loader" />}

      <style jsx>{`
        .hero { position: relative; width: 100%; height: 100%; overflow: hidden; background: #000; border-radius: 20px;}
        .hero-image { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; animation: slowZoom 20s linear infinite alternate; }
        
        .video-wrapper { position: absolute; inset: 0; opacity: 0; transition: opacity 1.2s ease; z-index: 2; overflow: hidden; border-radius: 20px; }
        .video-wrapper.visible { opacity: 1; }
        .youtube-player { width: 100%; height: 100%; }
        :global(.youtube-player iframe) { 
          position: absolute; top: 50%; left: 50%; width: 100vw; height: 200px; object-fit: cover;
          min-width: 100%; min-height: 100%; transform: translate(-50%, -50%) scale(1.5); pointer-events: none;
        }

        .overlay-left { position: absolute; inset: 0; z-index: 3; background: linear-gradient(90deg, rgba(0,0,0,1) 0%, rgba(0,0,0,0.6) 40%, transparent 100%); }
        .overlay-top { position: absolute; inset: 0; z-index: 3; background: linear-gradient(to bottom, rgba(0,0,0,0.6), transparent 25%); }
        .overlay-vignette { position: absolute; inset: 0; z-index: 3; background: radial-gradient(circle, transparent 50%, rgba(0,0,0,0.3) 100%); }
        
        .hero-content { position: absolute; left: 5%; bottom: 10%; z-index: 10; width: 600px; }
        .hero-logo { max-width: 400px; margin-bottom: 10px; }
        .hero-title { 
            color: #fff; font-size: 4rem; font-weight: 800; text-shadow: 2px 2px 8px rgba(0,0,0,0.5);
            display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.2; 
        }
        .hero-meta { display: flex; flex-wrap: wrap; align-items: center; gap: 15px; color: #fff; margin-bottom: 15px; font-weight: 500; font-size: 1.1rem; }
        .meta-item { white-space: nowrap; }
        .meta-categories { white-space: normal; }
        .badge { border: 1px solid rgba(255,255,255,0.4); padding: 0 6px; border-radius: 2px; }
        .hero-description { color: #fff; font-size: 1rem; margin-bottom: 25px; text-shadow: 0 2px 4px rgba(0,0,0,0.5); display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
        
        .hero-buttons { display: flex; gap: 15px; }
        .play-button { display: flex; align-items: center; gap: 12px; background: #fff; color: #000; padding: 12px 30px; border-radius: 5px; font-weight: 800; text-decoration: none; transition: transform 0.2s, background 0.2s; }
        .play-button:hover { background: #e6e6e6; transform: scale(1.05); }
        .info-button { display: flex; align-items: center; gap: 12px; background: rgba(109,109,110,0.7); color: #fff; padding: 12px 30px; border-radius: 5px; border: none; font-weight: 800; cursor: pointer; transition: transform 0.2s, background 0.2s; }
        .info-button:hover { background: rgba(109,109,110,0.5); transform: scale(1.05); }
        
        .hero-controls { position: absolute; right: 5%; bottom: 15%; z-index: 20; }
        .mute-button { width: 50px; height: 50px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.3); background: rgba(0,0,0,0.4); color: white; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: 0.2s; }
        .mute-button:hover { border-color: #fff; background: rgba(255,255,255,0.1); }
        
        .shimmer-loader { position: absolute; inset: 0; z-index: 100; background: linear-gradient(90deg, #000 0%, #0a0a0a 50%, #000 100%); background-size: 200% 100%; animation: shimmer 3s infinite linear; }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        @keyframes slowZoom { from { transform: scale(1.05); } to { transform: scale(1.15); } }
      `}</style>
    </section>
  );
}