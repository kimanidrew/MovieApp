"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import YouTube from "react-youtube";
import { Play, Volume2, VolumeX, Plus, Check, RotateCcw } from "lucide-react";
import type { Video } from "@/types/video";
import { normalizeUrl } from "@/utils/normalizeUrl";

interface VideoModalProps {
  video: Video | null;
  videos: Video[];
  onClose: () => void;
  type?: "show" | "movie"; // Updated to match server-side logic
}

export default function VideoModal({
  video,
  videos,
  onClose,
  type = "movie",
}: VideoModalProps) {
  const router = useRouter();
  const [inMyList, setInMyList] = useState(false);
  const [isMuted, setIsMuted] = useState(true); // Default to true
  const [mounted, setMounted] = useState(false);
  const [activeSeason, setActiveSeason] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);
  const [isReady, setIsReady] = useState(false);
  
  const playerRef = useRef<any>(null);

  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = "hidden";
    
    setHasPlayed(false);
    setIsPlaying(false);
    setIsReady(false);
    
    if (video?.seasons && video.seasons.length > 0) {
      setActiveSeason(video.seasons[0].seasonNumber);
    }

    return () => {
      document.body.style.overflow = "";
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, [video]);

  useEffect(() => {
    if (!video) return;
    const list = JSON.parse(localStorage.getItem("movieflix-mylist") || "[]");
    setInMyList(list.includes(video.id));
  }, [video]);

  const toggleMyList = () => {
    if (!video) return;
    let list = JSON.parse(localStorage.getItem("movieflix-mylist") || "[]");
    if (inMyList) {
      list = list.filter((id: string) => id !== video.id);
    } else {
      list.push(video.id);
    }
    localStorage.setItem("movieflix-mylist", JSON.stringify(list));
    setInMyList(!inMyList);
  };

  const toggleMute = () => {
    if (!playerRef.current) return;
    if (isMuted) {
      playerRef.current.unMute();
      setIsMuted(false);
    } else {
      playerRef.current.mute();
      setIsMuted(true);
    }
  };

  const replayTrailer = () => {
    if (playerRef.current) {
      playerRef.current.seekTo(0);
      playerRef.current.playVideo();
    }
  };

  if (!mounted || !video) return null;

  const youtubeId = video.trailerUrl?.split("v=")[1]?.split("&")[0] || video.trailerUrl;

  const relatedVideos = videos
    .filter((v) => v.id !== video.id && v.categories?.some((cat) => video.categories?.includes(cat)))
    .slice(0, 6);

  const seasons = video.seasons || [];
  const selectedSeasonData = seasons.find((s) => s.seasonNumber === activeSeason);
  
  const sortedEpisodes = selectedSeasonData
    ? [...selectedSeasonData.episodes].sort((a, b) => a.episodeNumber - b.episodeNumber)
    : [];

  const firstEpisode = sortedEpisodes[0];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>✕</button>

        <section className="hero">
          <img 
            className={`hero-image ${isPlaying ? "hidden" : ""}`} 
            src={normalizeUrl(video.backdropUrl || video.thumbnailUrl)} 
            alt={video.title} 
          />
          
          <div className={`video-wrapper ${isPlaying ? "visible" : ""}`}>
            {youtubeId && (
              <YouTube 
                videoId={youtubeId} 
                opts={{ 
                    width: "100%", 
                    height: "100%", 
                    playerVars: { 
                        autoplay: 1, 
                        controls: 0, 
                        modestbranding: 1, 
                        loop: 0, 
                        mute: 1, // Start muted
                        rel: 0,
                        playsinline: 1 
                    } 
                }} 
                onReady={(event) => {
                    playerRef.current = event.target;
                    setIsReady(true);
                }}
                onStateChange={(event) => {
                    if (event.data === 1) setIsPlaying(true);
                    if (event.data === 0) {
                        setIsPlaying(false);
                        setHasPlayed(true);
                    }
                }}
                className="youtube-player" 
              />
            )}
          </div>

          {!isPlaying && hasPlayed && (
            <button className="replay-btn" onClick={replayTrailer}>
              <RotateCcw size={32} />
            </button>
          )}

          <div className="hero-overlay" />
          <div className="hero-vignette" />
          <div className="hero-content">
            <div className="logo-area">
              <span className="netflix-badge">{type === "show" ? "TV SHOW" : "MOVIE"}</span>
              <h1 className="title">{video.title}</h1>
              <div className="meta">
                <span>{video.releaseYear}</span>
                <span className="rating">{video.maturityRating}</span>
                <span className="quality">HD</span>
                <span className="quality">5.1</span>
              </div>
            </div>
          </div>
        </section>

        <section className="content">
          <div className="hero-buttons" style={{ marginBottom: '25px' }}>
            <Link 
              href={type === "show" && firstEpisode ? `/watch/${video.id}?season=${activeSeason}&ep=${firstEpisode.episodeNumber}` : `/watch/${video.id}`} 
            >
              <div className="play-button">
              <Play size={20} fill="currentColor" />
              <span>{type === "show" ? `Play S${activeSeason} E${firstEpisode?.episodeNumber || 1}` : "Play"}</span>
              </div>
            </Link>
            <button className="circle-btn" onClick={toggleMyList}>
              {inMyList ? <Check size={20} /> : <Plus size={20} />}
            </button>
            <button className="circle-btn" onClick={toggleMute}>
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
          </div>

          <div className="details-stack">
            {video.categories?.length ? (<div className="genres" style={{ marginBottom: '15px' }}>{video.categories.map((genre) => <span key={genre} className="genre-chip">{genre}</span>)}</div>) : null}
            <p className="description">{video.description}</p>
            
            <div className="meta-info-bar">
              <p><span>Cast:</span> {video.cast?.slice(0, 3).map(c => c.name).join(", ") || "N/A"}</p>
              <p><span>Director:</span> Unknown</p>
              <p><span>Language:</span> English</p>
            </div>
          </div>

          {type === "show" && seasons.length > 0 && activeSeason !== null && (
            <div className="tv-section">
              <h3 className="section-title">Episodes</h3>
              
              <div className="custom-dropdown">
                <select className="season-select" onChange={(e) => setActiveSeason(Number(e.target.value))} value={activeSeason}>
                  {seasons.map((season) => (
                    <option key={season.id} value={season.seasonNumber}>
                      Season {season.seasonNumber}
                    </option>
                  ))}
                </select>
              </div>

              <div className="episodes-list">
                {sortedEpisodes.map((ep) => (
                  <Link href={`/watch/${video.id}?season=${activeSeason}&ep=${ep.episodeNumber}`} key={ep.id}>
                    <div className="episode-item">
                    <span className="ep-index">{ep.episodeNumber}</span>
                    <div className="ep-details">
                      <p className="ep-title">{ep.title}</p>
                      <p className="ep-desc">{ep.description}</p>
                    </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </section>

        {relatedVideos.length > 0 && (
          <section className="recommendations" style={{ padding: '0 55px 45px' }}>
            <div className="section-header">
              <h2>More Like This</h2>
            </div>
            <div className="recommend-grid">
              {relatedVideos.map((item) => (
                <Link href={`/watch/${item.id}`} key={item.id} className="recommend-card">
                  <div className="recommend-image-wrapper">
                    <img src={normalizeUrl(item.backdropUrl || item.thumbnailUrl || "")} alt={item.title} className="recommend-image" />
                    <div className="recommend-gradient" />
                    <div className="recommend-play"><Play size={34} fill="currentColor" /></div>
                  </div>
                  <div className="recommend-content">
                    <div className="recommend-top"><span className="recommend-year">{item.releaseYear}</span></div>
                    <h4 className="recommend-title">{item.title}</h4>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      <style jsx>{`
        .modal-overlay{ position:fixed; inset:0; z-index:9999; overflow-y:auto; display:flex; justify-content:center; padding:40px 0; background: rgba(0,0,0,0.5); backdrop-filter:blur(5px); animation:fadeIn .25s ease; }
        .modal{ width:min(920px,92vw); background-color:#000; border-radius: 22px; position:relative; box-shadow: 0 30px 90px rgba(0,0,0,.65); animation:modalEnter .35s cubic-bezier(.2,.8,.2,1); margin: auto; display: flex; flex-direction: column; }
        .hero { position:relative; height:520px; overflow:hidden; border-radius: 22px 22px 0 0; background: #000; flex-shrink: 0; display: block; }
        .hero-image { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; z-index: 2; transition: opacity 0.6s ease; opacity: 1; }
        .hero-image.hidden { opacity: 0; pointer-events: none; }
        .video-wrapper { position: absolute; inset: 0; z-index: 3; opacity: 0; transition: opacity 0.6s ease; }
        .video-wrapper.visible { opacity: 1; }
        .youtube-player { width: 100%; height: 100%; }
        .youtube-player iframe { width: 100%; height: 100%; }
        .hero-overlay{ position:absolute; inset:0; background: linear-gradient(to top, #000 8%, rgba(0,0,0,.75) 30%, rgba(0,0,0,.2) 58%, transparent); z-index: 4; }
        .hero-vignette{ position:absolute; inset:0; background: radial-gradient(circle at center, transparent 45%, rgba(0,0,0,.45) 100%); z-index: 2; }
        .replay-btn { position: absolute; bottom: 120px; right: 55px; z-index: 10; background: rgba(0,0,0,0.5); color: white; border: 2px solid rgba(255,255,255,0.2); border-radius: 50%; width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; cursor: pointer; backdrop-filter: blur(5px); transition: 0.3s; }
        .replay-btn:hover { background: rgba(255,255,255,0.2); border-color: white; transform: scale(1.1); }
        .close-btn{ position:absolute; top:22px; right:22px; width:46px; height:46px; border-radius:50%; border:none; cursor:pointer; color:#fff; font-size:20px; background:rgba(0,0,0,.55); backdrop-filter:blur(10px); transition:.25s; z-index:50; }
        .close-btn:hover{ transform:rotate(90deg) scale(1.05); background:#fff; color:#000; }
        .hero-content{ position:absolute; left:55px; bottom:0px; right:55px; z-index:5; display:flex; justify-content:space-between; align-items:flex-end; }
        .netflix-badge{ display:inline-flex; padding:6px 12px; border-radius:999px; background:#e50914; color:white; font-weight:700; letter-spacing:.12em; font-size:.72rem; margin-bottom:18px; }
        .title{ margin:0; color:white; font-size:3.6rem; font-weight:900; line-height:1.02; text-shadow: 0 5px 18px rgba(0,0,0,.6); }
        .meta{ margin-top:20px; display:flex; flex-wrap:wrap; gap:12px; align-items:center; color:#d5d5d5; font-size:.95rem; font-weight:600; }
        .rating{ border:1px solid rgba(255,255,255,.45); padding:3px 8px; border-radius:5px; }
        .quality{ background:#2a2a2a; padding:3px 10px; border-radius:5px; color:#e8e8e8; }
        .hero-buttons{ display:flex; gap:14px; align-items:center; }
        .play-button { display: flex; align-items: center; gap: 12px; background: #fff; color: #000; padding: 12px 30px; border-radius: 5px; font-weight: 800; text-decoration: none; transition: transform 0.2s, background 0.2s; cursor: pointer; border: none; font-size: 1rem; }
        .play-button:hover { background: #e6e6e6; transform: scale(1.05); }
        .circle-btn{ width:54px; height:54px; border-radius:50%; border:2px solid rgba(255,255,255,.35); background:rgba(42,42,42,.55); color:white; display:flex; justify-content:center; align-items:center; cursor:pointer; transition:.25s; backdrop-filter:blur(8px); }
        .circle-btn:hover{ transform:translateY(-3px); border-color:white; background:rgba(255,255,255,.14); }
        .content{ padding:30px 55px; }
        .details-stack{ display:flex; flex-direction:column; gap:20px; max-width:800px; }
        .description{ color:#d2d2d2; line-height:1.8; font-size:1.1rem; }
        .genres{ display:flex; flex-wrap:wrap; gap:10px; }
        .genre-chip{ padding:8px 16px; border-radius:999px; background:#232323; color:#f0f0f0; font-size:.85rem; }
        .meta-info-bar{ display:flex; flex-wrap:wrap; gap:25px; color:#bfbfbf; font-size:0.95rem; border-top:1px solid #2a2a2a; padding-top:20px; }
        .meta-info-bar span{ color:#888; font-weight:700; }
        .tv-section{ margin-top:40px; border-top:1px solid #2a2a2a; padding-top:30px; }
        .section-title{ color:white; margin:0 0 20px; font-size:1.5rem; }
        .custom-dropdown{ position:relative; display:inline-block; width:220px; margin-bottom:25px; }
        .season-select{ width:100%; background:#080808; color:white; padding:14px 20px; border-radius:12px; border:1px solid #333; cursor:pointer; font-size:1rem; outline:none; appearance:none; transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1); background-image:url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3e%3cpath d='M7 10l5 5 5-5z'/%3e%3c/svg%3e"); background-repeat:no-repeat; background-position:right 15px center; background-size:16px; font-weight: 500; letter-spacing: 0.02em; }
        .season-select:hover { border-color: #555; background: #0c0c0c; }
        .season-select:focus { border-color: #e50914; box-shadow: 0 0 0 1px #e50914; }
        .episode-item { display: flex; align-items: center; gap: 40px; padding: 24px; border-radius: 12px; margin-bottom: 8px; border: 1px solid transparent; transition: all 0.3s ease; text-decoration: none; color: inherit; background: rgba(255, 255, 255, 0.02); }
        .episode-item:hover { background: rgba(255, 255, 255, 0.06); border-color: rgba(255, 255, 255, 0.1); transform: translateX(5px); }
        .ep-index{ color:#666; font-size:3rem; font-weight:700; width:30px; min-width: 30px; text-align: center; }
        .ep-title{ color:#fff; margin:0; font-weight:600; font-size:1.05rem; }
        .ep-desc{ color:#888; font-size:0.9rem; margin:6px 0 0; line-height:1.4; }
        .recommendations{ margin-top:60px; }
        .section-header{ display:flex; justify-content:space-between; align-items:center; margin-bottom:25px; }
        .section-header h2{ margin:0; color:white; font-size:1.7rem; }
        .recommend-grid{ display:grid; grid-template-columns:repeat(3,1fr); gap:22px; }
        .recommend-card{ display:block; text-decoration:none; color:inherit; overflow:hidden; border-radius:16px; background:#1b1b1b; border:1px solid rgba(255,255,255,.05); transition: transform .35s, box-shadow .35s; }
        .recommend-card:hover{ transform: translateY(-8px) scale(1.03); box-shadow: 0 28px 60px rgba(0,0,0,.5); }
        .recommend-image-wrapper{ position:relative; overflow:hidden; aspect-ratio:16/9; }
        .recommend-image{ width:100%; height:100%; object-fit:cover; }
        .recommend-gradient{ position:absolute; inset:0; background: linear-gradient(to top, rgba(0,0,0,.75), transparent 55%); }
        .recommend-play{ position:absolute; left:50%; top:50%; transform: translate(-50%,-50%) scale(.85); width:70px; height:70px; border-radius:50%; display:flex; align-items:center; justify-content:center; color:white; background: rgba(0,0,0,.55); backdrop-filter:blur(8px); opacity:0; transition: .35s; }
        .recommend-card:hover .recommend-play{ opacity:1; transform: translate(-50%,-50%) scale(1); }
        .recommend-content{ padding:18px; }
        .recommend-top{ display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; }
        .recommend-year{ color:#9c9c9c; font-size:.82rem; }
        .recommend-title{ margin:0; color:white; font-size:1rem; line-height:1.35; }
        @media (max-width:900px){ .hero{ height:420px; } .hero-content{ left:30px; right:30px; bottom:30px; flex-direction:column; align-items:flex-start; gap:25px; } .title{ font-size:2.5rem; } .content{ padding:35px 30px; } .recommend-grid{ grid-template-columns:repeat(2,1fr); } }
        @media (max-width:640px){ .modal{ width:96vw; border-radius:16px; } .hero{ height:320px; } .title{ font-size:2rem; } .play-button{ padding:13px 24px!important; } .circle-btn{ width:48px; height:48px; } .recommend-grid{ grid-template-columns:1fr; } .content{ padding:28px 22px; } }
        @keyframes fadeIn{ from{ opacity:0; } to{ opacity:1; } }
        @keyframes modalEnter{ from{ opacity:0; } to{ opacity:1; } }
        `}</style>
    </div>
  );
}