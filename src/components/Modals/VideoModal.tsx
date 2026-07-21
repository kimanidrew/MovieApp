"use client";

import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import Link from "next/link";
import { normalizeUrl } from "@/utils/normalizeUrl";
import { Video } from "@/types/video";

interface VideoModalProps {
  video: Video | null;
  videos: Video[];
  onClose: () => void;
  type?: "movie" | "tv" | "home";
}

export default function VideoModal({
  video,
  videos,
  onClose,
  type = "movie",
}: VideoModalProps) {
  const [inMyList, setInMyList] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [activeSeason, setActiveSeason] = useState<number | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = "hidden";
    
    if (video?.seasons && video.seasons.length > 0) {
      setActiveSeason(video.seasons[0].seasonNumber);
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [video]);

  useEffect(() => {
    if (!video) return;
    const list = JSON.parse(localStorage.getItem("movieflix-mylist") || "[]");
    setInMyList(list.includes(video.id));
  }, [video]);

  useEffect(() => {
    if (!videoRef.current) return;
    videoRef.current.muted = isMuted;
  }, [isMuted]);

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

  if (!mounted || !video) return null;

  const relatedVideos = videos.filter((v) => v.id !== video.id).slice(0, 6);
  const seasons = video.seasons || [];
  const selectedSeasonData = seasons.find((s) => s.seasonNumber === activeSeason);
  const firstEpisode = selectedSeasonData?.episodes[0];

  const modal = (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>✕</button>

        <section className="hero">
          <img className="hero-image" src={normalizeUrl(video.backdropUrl || video.thumbnailUrl)} alt={video.title} />
          <video ref={videoRef} className="hero-video" autoPlay loop muted={isMuted} playsInline />
          <div className="hero-overlay" />
          <div className="hero-vignette" />
          <div className="hero-content">
            <div className="logo-area">
              <span className="netflix-badge">{type === "tv" ? "TV SHOW" : "MOVIE"}</span>
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
              href={type === "tv" && firstEpisode ? `/watch/${video.id}?season=${activeSeason}&ep=${firstEpisode.episodeNumber}` : `/watch/${video.id}`} 
              className="play-btn"
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
              <span>{type === "tv" ? `Play S${activeSeason} E${firstEpisode?.episodeNumber || 1}` : "Play"}</span>
            </Link>
            <button className="circle-btn" onClick={toggleMyList}>{inMyList ? <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z" /></svg> : <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6z" /></svg>}</button>
            <button className="circle-btn" onClick={() => setIsMuted(!isMuted)}>{isMuted ? <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71z" /></svg> : <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" /></svg>}</button>
          </div>

          <div className="details-grid">
            <div>
              {video.categories?.length ? (<div className="genres" style={{ marginBottom: '15px' }}>{video.categories.map((genre) => <span key={genre} className="genre-chip">{genre}</span>)}</div>) : null}
              <p className="description">{video.description}</p>
            </div>
            <div className="side-info">
              <p><span>Cast:</span> Coming Soon</p>
              <p><span>Director:</span> Unknown</p>
              <p><span>Language:</span> English</p>
              <p><span>Available:</span> HD • Full HD</p>
            </div>
          </div>

          {type === "tv" && seasons.length > 0 && activeSeason !== null && (
            <div className="tv-section">
              <h3 className="section-title">Episodes</h3>
              <div className="custom-dropdown">
                <select className="season-select" onChange={(e) => setActiveSeason(Number(e.target.value))} value={activeSeason}>
                  {seasons.map((season) => (
                    <option key={season.id} value={season.seasonNumber}>
                      Season {season.seasonNumber} ({season.episodes.length} Episodes)
                    </option>
                  ))}
                </select>
              </div>
              <div className="episodes-list">
                {selectedSeasonData?.episodes.map((ep) => (
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

        <section className="recommendations" style={{ padding: '0 55px 45px' }}>
          <div className="section-header">
            <h2>More Like This</h2>
            <span>{relatedVideos.length} recommendations</span>
          </div>
          <div className="recommend-grid">
            {relatedVideos.map((item) => (
              <Link href={`/watch/${item.id}`} key={item.id} className="recommend-card">
                <div className="recommend-image-wrapper">
                  <img src={normalizeUrl(item.backdropUrl || item.thumbnailUrl || "")} alt={item.title} className="recommend-image" />
                  <div className="recommend-gradient" />
                  <div className="recommend-play"><svg width="34" height="34" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg></div>
                </div>
                <div className="recommend-content">
                  <div className="recommend-top"><span className="recommend-year">{item.releaseYear}</span></div>
                  <h4 className="recommend-title">{item.title}</h4>
                  <div className="recommend-tags">{item.categories?.slice(0, 3).map((genre) => (<span key={genre} className="recommend-tag">{genre}</span>))}</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>

      <style jsx>{`
        .modal-overlay{ position:fixed; inset:0; z-index:9999; overflow-y:auto; display:flex; justify-content:center; align-items:flex-start; padding:20px 0; background: radial-gradient(circle at top, rgba(255,255,255,.05), transparent 40%), rgba(0,0,0,.82); backdrop-filter:blur(18px); -webkit-backdrop-filter:blur(18px); animation:fadeIn .25s ease; }
        .modal{ width:min(920px,92vw); background:#141414; border-radius:22px; overflow:hidden; position:relative; border:1px solid rgba(255,255,255,.05); box-shadow: 0 0 0 1px rgba(255,255,255,.02), 0 30px 90px rgba(0,0,0,.65), 0 80px 140px rgba(0,0,0,.85); animation:modalEnter .35s cubic-bezier(.2,.8,.2,1); }
        .close-btn{ position:absolute; top:22px; right:22px; width:46px; height:46px; border-radius:50%; border:none; cursor:pointer; color:#fff; font-size:20px; background:rgba(0,0,0,.55); backdrop-filter:blur(10px); transition:.25s; z-index:50; }
        .close-btn:hover{ transform:rotate(90deg) scale(1.05); background:#fff; color:#000; }
        .hero{ position:relative; height:520px; overflow:hidden; }
        .hero-image, .hero-video{ position:absolute; inset:0; width:100%; height:100%; object-fit:cover; }
        .hero-video{ opacity:.9; }
        .hero-overlay{ position:absolute; inset:0; background: linear-gradient(to top, #141414 8%, rgba(20,20,20,.75) 30%, rgba(20,20,20,.2) 58%, transparent); }
        .hero-vignette{ position:absolute; inset:0; background: radial-gradient(circle at center, transparent 45%, rgba(0,0,0,.45) 100%); }
        .hero-content{ position:absolute; left:55px; bottom:0px; right:55px; z-index:5; display:flex; justify-content:space-between; align-items:flex-end; }
        .netflix-badge{ display:inline-flex; padding:6px 12px; border-radius:999px; background:#e50914; color:white; font-weight:700; letter-spacing:.12em; font-size:.72rem; margin-bottom:18px; }
        .title{ margin:0; color:white; font-size:3.6rem; font-weight:900; line-height:1.02; text-shadow: 0 5px 18px rgba(0,0,0,.6); }
        .meta{ margin-top:20px; display:flex; flex-wrap:wrap; gap:12px; align-items:center; color:#d5d5d5; font-size:.95rem; font-weight:600; }
        .rating{ border:1px solid rgba(255,255,255,.45); padding:3px 8px; border-radius:5px; }
        .quality{ background:#2a2a2a; padding:3px 10px; border-radius:5px; color:#e8e8e8; }
        .hero-buttons{ display:flex; gap:14px; align-items:center; }
        :global(.play-btn){ display:flex!important; align-items:center!important; gap:12px!important; text-decoration:none!important; padding:15px 34px!important; border-radius:10px!important; background:white!important; color:black!important; font-weight:800!important; font-size:1rem!important; transition:.25s!important; box-shadow: 0 8px 25px rgba(255,255,255,.18)!important; }
        :global(.play-btn:hover){ transform:translateY(-3px) scale(1.03)!important; background:#ececec!important; }
        .circle-btn{ width:54px; height:54px; border-radius:50%; border:2px solid rgba(255,255,255,.35); background:rgba(42,42,42,.55); color:white; display:flex; justify-content:center; align-items:center; cursor:pointer; transition:.25s; backdrop-filter:blur(8px); }
        .circle-btn:hover{ transform:translateY(-3px); border-color:white; background:rgba(255,255,255,.14); }
        .content{ padding:30px 55px; }
        .details-grid{ display:grid; grid-template-columns:2fr 1fr; gap:55px; }
        .description{ color:#d2d2d2; line-height:1.85; font-size:1.05rem; margin-bottom:28px; }
        .genres{ display:flex; flex-wrap:wrap; gap:10px; }
        .genre-chip{ padding:8px 16px; border-radius:999px; background:#232323; color:#f0f0f0; font-size:.85rem; transition:.25s; }
        .genre-chip:hover{ background:#e50914; transform:translateY(-2px); }
        .side-info{ display:flex; flex-direction:column; gap:18px; color:#bfbfbf; font-size:.95rem; }
        .side-info span{ color:#888; font-weight:700; }
        .tv-section{ margin-top:40px; border-top:1px solid #2a2a2a; padding-top:30px; }
        .section-title{ color:white; margin:0 0 20px; font-size:1.5rem; }
        .custom-dropdown{ position:relative; display:inline-block; margin-bottom:25px; }
        .season-select{ background:#181818; color:white; padding:12px 40px 12px 20px; border-radius:8px; border:1px solid #404040; cursor:pointer; font-size:1rem; outline:none; appearance:none; width:260px; background-image:url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3e%3cpath d='M7 10l5 5 5-5z'/%3e%3c/svg%3e"); background-repeat:no-repeat; background-position:right 15px center; background-size:16px; }
        .episode-item { display: flex; align-items: center; gap: 40px; padding: 24px; border-radius: 12px; margin-bottom: 8px; border: 1px solid transparent; transition: all 0.3s ease; text-decoration: none; color: inherit; background: rgba(255, 255, 255, 0.02); }
        .episode-item:hover { background: rgba(255, 255, 255, 0.06); border-color: rgba(255, 255, 255, 0.1); transform: translateX(5px); }
        .ep-index{ color:#666; font-size:3rem; font-weight:700; width:30px; min-width: 30px; text-align: center; }
        .ep-title{ color:#fff; margin:0; font-weight:600; font-size:1.05rem; }
        .ep-desc{ color:#888; font-size:0.9rem; margin:6px 0 0; line-height:1.4; }
        .recommendations{ margin-top:60px; }
        .section-header{ display:flex; justify-content:space-between; align-items:center; margin-bottom:25px; }
        .section-header h2{ margin:0; color:white; font-size:1.7rem; }
        .section-header span{ color:#777; }
        .recommend-grid{ display:grid; grid-template-columns:repeat(3,1fr); gap:22px; }
        .recommend-card{ display:block; text-decoration:none; color:inherit; overflow:hidden; border-radius:16px; background:#1b1b1b; border:1px solid rgba(255,255,255,.05); transition: transform .35s, box-shadow .35s, border-color .35s; box-shadow: 0 12px 28px rgba(0,0,0,.28); }
        .recommend-card:hover{ transform: translateY(-8px) scale(1.03); border-color:rgba(255,255,255,.15); box-shadow: 0 28px 60px rgba(0,0,0,.5); }
        .recommend-image-wrapper{ position:relative; overflow:hidden; aspect-ratio:16/9; }
        .recommend-image{ width:100%; height:100%; object-fit:cover; transition: transform .45s ease; }
        .recommend-card:hover .recommend-image{ transform:scale(1.08); }
        .recommend-gradient{ position:absolute; inset:0; background: linear-gradient(to top, rgba(0,0,0,.75), transparent 55%); }
        .recommend-play{ position:absolute; left:50%; top:50%; transform: translate(-50%,-50%) scale(.85); width:70px; height:70px; border-radius:50%; display:flex; align-items:center; justify-content:center; color:white; background: rgba(0,0,0,.55); backdrop-filter:blur(8px); opacity:0; transition: .35s; }
        .recommend-card:hover .recommend-play{ opacity:1; transform: translate(-50%,-50%) scale(1); }
        .recommend-content{ padding:18px; }
        .recommend-top{ display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; }
        .recommend-year{ color:#9c9c9c; font-size:.82rem; }
        .recommend-title{ margin:0; color:white; font-size:1rem; line-height:1.35; }
        .recommend-tags{ display:flex; flex-wrap:wrap; gap:8px; margin-top:14px; }
        .recommend-tag{ padding:5px 10px; border-radius:999px; background:#262626; color:#d7d7d7; font-size:.72rem; }
        @media (max-width:900px){ .hero{ height:420px; } .hero-content{ left:30px; right:30px; bottom:30px; flex-direction:column; align-items:flex-start; gap:25px; } .title{ font-size:2.5rem; } .content{ padding:35px 30px; } .details-grid{ grid-template-columns:1fr; gap:35px; } .recommend-grid{ grid-template-columns:repeat(2,1fr); } }
        @media (max-width:640px){ .modal{ width:96vw; border-radius:16px; } .hero{ height:320px; } .title{ font-size:2rem; } .meta{ font-size:.82rem; gap:8px; } :global(.play-btn){ padding:13px 24px!important; } .circle-btn{ width:48px; height:48px; } .recommend-grid{ grid-template-columns:1fr; } .content{ padding:28px 22px; } .section-header{ flex-direction:column; align-items:flex-start; gap:8px; } }
        @keyframes fadeIn{ from{ opacity:0; } to{ opacity:1; } }
        @keyframes modalEnter{ from{ opacity:0; transform: translateY(40px) scale(.95); } to{ opacity:1; transform: translateY(0) scale(1); } }
      `}</style>
    </div>
  );

  return ReactDOM.createPortal(modal, document.body);
}