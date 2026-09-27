"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import YouTube from "react-youtube";
import { Play, Volume2, VolumeX, Plus, Check, RotateCcw } from "lucide-react";
import type { Video } from "@/types/video";
import { normalizeUrl } from "@/utils/normalizeUrl";

interface VideoDetailsPageProps {
  video: Video;
  allVideos: Video[];
  type: "show" | "movie";
}

export default function VideoDetailsPage({ video, allVideos, type }: VideoDetailsPageProps) {
  const [inMyList, setInMyList] = useState(false);
  const [isMuted, setIsMuted] = useState(true); // Default to true for autoplay
  const [activeSeason, setActiveSeason] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);
  
  const playerRef = useRef<any>(null);

  useEffect(() => {
    if (video?.seasons && video.seasons.length > 0) {
      setActiveSeason(video.seasons[0].seasonNumber);
    }
  }, [video]);

  useEffect(() => {
    const list = JSON.parse(localStorage.getItem("movieflix-mylist") || "[]");
    setInMyList(list.includes(video.id));
  }, [video.id]);

  const toggleMyList = () => {
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
      setIsPlaying(true);
    }
  };

  const youtubeId = video.trailerUrl?.split("v=")[1]?.split("&")[0] || video.trailerUrl;
  
  const relatedVideos = allVideos
    .filter((v) => v.id !== video.id && v.categories?.some((cat) => video.categories?.includes(cat)))
    .slice(0, 6);

  const seasons = video.seasons || [];
  const selectedSeasonData = seasons.find((s) => s.seasonNumber === activeSeason);
  const sortedEpisodes = selectedSeasonData ? [...selectedSeasonData.episodes].sort((a, b) => a.episodeNumber - b.episodeNumber) : [];
  const firstEpisode = sortedEpisodes[0];

  return (
    <main className="details-page">
      <section className="story-hero">
        <img
          className={`hero-art ${isPlaying ? "hero-art-hidden" : ""}`}
          src={normalizeUrl(video.backdropUrl || video.thumbnailUrl)}
          alt={video.title}
        />

        <div className="hero-wash" />
        <div className="hero-grid" />

        <div className="story-copy">
          <div className="eyebrow">
            <span className="eyebrow-mark" />
            {type === "show" ? "SERIES" : "AFRICAN CINEMA"}
          </div>

          <h1 className="title">{video.title}</h1>

          <div className="meta-line">
            <span>{video.releaseYear}</span>
            <span className="meta-dot">•</span>
            <span>{video.maturityRating}</span>
            {type === "show" && video.seasons?.length ? (
              <>
                <span className="meta-dot">•</span>
                <span>{video.seasons.length} {video.seasons.length === 1 ? "season" : "seasons"}</span>
              </>
            ) : null}
          </div>

          <p className="description hero-description">{video.description}</p>

          <div className="hero-actions">
            <Link href={type === "show" && firstEpisode ? `/watch/${video.id}?season=${activeSeason}&ep=${firstEpisode.episodeNumber}` : `/watch/${video.id}`}>
              <span className="primary-action"><Play size={17} fill="currentColor" /> Watch now</span>
            </Link>
            <button className={`secondary-action ${inMyList ? "selected" : ""}`} onClick={toggleMyList}>
              {inMyList ? <Check size={17} /> : <Plus size={17} />} {inMyList ? "In library" : "Save to library"}
            </button>
            {youtubeId && (
              <button className="icon-action" onClick={toggleMute} aria-label={isMuted ? "Unmute trailer" : "Mute trailer"}>
                {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
            )}
          </div>

          {video.categories?.length ? (
            <div className="genres">
              {video.categories.map((genre) => <span key={genre} className="genre-chip">{genre}</span>)}
            </div>
          ) : null}
        </div>

        <div className={`trailer-frame ${isPlaying ? "visible" : ""}`}>
          {youtubeId && (
            <YouTube
              videoId={youtubeId}
              opts={{ playerVars: { autoplay: 1, controls: 0, modestbranding: 1, loop: 0, mute: 1, rel: 0, playsinline: 1 } }}
              onReady={(event) => { playerRef.current = event.target; }}
              onStateChange={(event) => {
                if (event.data === 1) setIsPlaying(true);
                if (event.data === 0) { setIsPlaying(false); setHasPlayed(true); }
              }}
              className="youtube-player"
            />
          )}
        </div>

        {hasPlayed && !isPlaying && (
          <button className="replay-btn" onClick={replayTrailer} aria-label="Replay trailer"><RotateCcw size={18} /></button>
        )}
      </section>

      <section className="content">
        <div className="story-layout">
          <div className="story-panel">
            <div className="panel-kicker">THE STORY</div>
            <p className="description">{video.description}</p>
          </div>
          <div className="facts-panel">
            <div><span>Format</span><strong>{type === "show" ? "Series" : "Feature film"}</strong></div>
            <div><span>Release</span><strong>{video.releaseYear}</strong></div>
            <div><span>Rating</span><strong>{video.maturityRating}</strong></div>
          </div>
        </div>

        {type === "show" && seasons.length > 0 && activeSeason !== null && (
          <section className="tv-section">
            <div className="section-heading">
              <div>
                <span className="panel-kicker">WATCH IN ORDER</span>
                <h2>Episodes</h2>
              </div>
              <select className="season-select" onChange={(e) => setActiveSeason(Number(e.target.value))} value={activeSeason}>
                {seasons.map((season) => <option key={season.id} value={season.seasonNumber}>Season {season.seasonNumber}</option>)}
              </select>
            </div>
            <div className="episodes-list">
              {sortedEpisodes.map((ep) => (
                <Link href={`/watch/${video.id}?season=${activeSeason}&ep=${ep.episodeNumber}`} key={ep.id}>
                  <div className="episode-item">
                    <span className="ep-index">{String(ep.episodeNumber).padStart(2, "0")}</span>
                    <div className="ep-details">
                      <p className="ep-title">{ep.title}</p>
                      <p className="ep-desc">{ep.description}</p>
                    </div>
                    <span className="episode-arrow">→</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="recommendations">
          <div className="section-heading">
            <div>
              <span className="panel-kicker">KEEP EXPLORING</span>
              <h2>Stories you may like</h2>
            </div>
            <span className="section-rule" />
          </div>
          <div className="recommend-grid">
            {relatedVideos.map((item) => (
              <Link href={`/movies/${item.id}`} key={item.id} className="recommend-card">
                <div className="recommend-image-wrapper">
                  <img src={normalizeUrl(item.backdropUrl || item.thumbnailUrl || "")} alt={item.title} className="recommend-image" />
                  <div className="recommend-content">
                    <span>{item.releaseYear}</span>
                    <h3>{item.title}</h3>
                  </div>
                  <span className="recommend-arrow">↗</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </section>
      <style jsx>{`
        .details-page { background: #000; min-height: 100vh; color: white; padding-bottom: 60px; }
        .hero { position: relative; height: 100vh; overflow: hidden; background: #000; }
        
        .hero-top-gradient { position: absolute; top: 0; left: 0; width: 100%; height: 300px; background: linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 100%); z-index: 3; pointer-events: none; }
        .hero-left-gradient { position: absolute; inset: 0; width: 100%; height: 100%; background: linear-gradient(90deg, rgba(0,0,0,0.7) 0%, transparent 60%); z-index: 3; pointer-events: none; }
        
        .hero-image { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; z-index: 2; transition: opacity 0.6s ease; opacity: 1; }
        .hero-image.hidden { opacity: 0; }
        .hero-image.pulse { animation: pulse 12s infinite ease-in-out; }

        .video-wrapper { position: absolute; inset: 0; z-index: 3; opacity: 0; transition: opacity 0.6s ease; pointer-events: none; }
        .video-wrapper.visible { opacity: 1; }
        
        .youtube-player { width: 100%; height: 100%; position: relative; display: flex; align-items: center; justify-content: center; }
        :global(.youtube-player iframe) { width: 100vw !important; height: 100vh !important; pointer-events: none; transform: scale(1.5); }
        
        .hero-overlay { position: absolute; inset: 0; background: radial-gradient(ellipse at bottom left, #000 0%, rgba(0,0,0,0.5) 30%, transparent 70%); z-index: 4; }
        .hero-vignette{ position:absolute; inset:0; background: radial-gradient(circle at center, transparent 45%, rgba(0,0,0,.3) 100%); z-index: 2; }
        
        .hero-content { position: absolute; left: 55px; bottom: 30px; z-index: 5; max-width: 600px; }
        .title { font-size: 4rem; font-weight: 900; margin: 0; text-shadow: 0 5px 18px rgba(0,0,0,.6); line-height: 1.1; }
        
        .meta-container { margin-top: 20px; }
        .meta-top { display: flex; align-items: center; gap: 15px; margin-bottom: 10px; }
        .meta-bottom { display: flex; align-items: center; gap: 15px; color: #d5d5d5; font-size: 1rem; }
        
        .year-box { background-color: #000; padding: 4px 8px; border-radius: 4px; color: #fff; font-size: 1rem; border: 1px solid rgba(255,255,255,0.2); }
        .season-count { font-size: 1.1rem; font-weight: 600; color: #fff; text-shadow: 0 1px 2px rgba(0,0,0,0.5); }
        
        .rating{ border:2px solid rgba(255,255,255,.45); padding:4px 10px; border-radius:4px; font-weight:600; }
        .quality{ background:#2a2a2a; padding:3px 10px; border-radius:4px; color:#e8e8e8; font-size: 0.9rem; }
        
        .hero-buttons { display: flex; gap: 15px; margin-top: 30px; align-items: center; }
        .play-button { display: inline-flex; align-items: center; gap: 12px; background: white; color: black; padding: 12px 35px; border-radius: 6px; font-weight: 800; cursor: pointer; transition: 0.2s; font-size: 1.1rem; }
        .play-button:hover { background: #e6e6e6; }
        .circle-btn { width: 50px; height: 50px; border-radius: 50%; border: 2px solid rgba(255,255,255,.35); background: rgba(42,42,42,.6); color: white; cursor: pointer; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(8px); transition: 0.2s; }
        .circle-btn:hover { border-color: white; background: rgba(255,255,255,.14); transform: scale(1.05); }

        .replay-btn { position: absolute; bottom: 40px; right: 55px; z-index: 10; background: rgba(0,0,0,0.5); color: white; border: 2px solid rgba(255,255,255,0.2); border-radius: 50%; width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; cursor: pointer; backdrop-filter: blur(5px); transition: 0.3s; }
        .replay-btn:hover { background: rgba(255,255,255,0.2); border-color: white; transform: scale(1.1); }

        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
        }

        .netflix-badge{ display:inline-flex; padding:6px 12px; border-radius:4px; background:#e50914; color:white; font-weight:700; letter-spacing:.15em; font-size:.8rem; margin-bottom:12px; }
        
        .content { padding: 40px 55px; }
        .genres { display: flex; flex-wrap: wrap; gap: 12px; }
        .genre-chip{ padding:8px 18px; border-radius:999px; background:#181818; border: 1px solid #333; color:#f0f0f0; font-size:.9rem; }
        
        .description { font-size: 1.2rem; line-height: 1.6; color: #d2d2d2; max-width: 800px; margin-bottom: 40px; }
        
        .tv-section { margin-top: 40px; }
        .section-title { font-size: 1.8rem; margin-bottom: 25px; }
        
        .season-select { background: #181818; color: white; padding: 12px 40px 12px 20px; border-radius: 6px; border: 1px solid #444; font-size: 1rem; cursor: pointer; margin-bottom: 30px; min-width: 200px; appearance: none; background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23ffffff%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E"); background-repeat: no-repeat; background-position: right 15px center; background-size: 10px; }
        
        .episode-item { display: flex; align-items: flex-start; gap: 20px; padding: 25px 0; border-top: 1px solid #222; }
        .ep-index { font-size: 1.5rem; color: #888; font-weight: 500; min-width: 30px; }
        .ep-title { font-size: 1.1rem; margin: 0 0 8px 0; font-weight: 600; }
        .ep-desc { color: #888; font-size: 0.95rem; line-height: 1.5; }
        
        .recommendations { margin-top: 60px; }
        .recommend-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 22px; margin-top: 20px; }
        .recommend-card { display: block; border-radius: 8px; background: #181818; overflow: hidden; transition: 0.3s; }
        .recommend-card:hover { transform: translateY(-5px); background: #222; }
        .recommend-image-wrapper { position: relative; aspect-ratio: 16/9; }
        .recommend-image { width: 100%; height: 100%; object-fit: cover; }
        .recommend-play { position: absolute; left: 50%; top: 50%; transform: translate(-50%,-50%); color: white; background: rgba(0,0,0,.5); border-radius: 50%; display: flex; align-items: center; justify-content: center; width: 50px; height: 50px; }
        .recommend-content { padding: 15px; }
        .recommend-title { margin: 0; font-size: 1.1rem; color: #fff; }
      `}</style>
    </main>
  );
}