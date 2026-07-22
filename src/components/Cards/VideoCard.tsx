"use client";

import React, { useState } from "react";
import Image from "next/image";
import TrailerPlayer from "../TrailerPlayer";
import { normalizeUrl } from "@/utils/normalizeUrl";

interface VideoCardProps {
  video: any;
  onSelect: () => void;
  isTvPage?: boolean; // New prop to toggle TV logic
}

export default function VideoCard({ video, onSelect, isTvPage = false }: VideoCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  
  const [displayThumbnail] = useState(() => {
    if (!video.images || !Array.isArray(video.images)) {
      return normalizeUrl(video.thumbnailUrl);
    }
    const posters = video.images.filter((img: any) => img.type === "POSTER");
    const selected = posters.length > 0 
      ? posters[Math.floor(Math.random() * posters.length)] 
      : video.images[0];
    return normalizeUrl(selected?.url || video.thumbnailUrl);
  });

  const trailerTarget = video.trailerUrl || video.videoSource;

  return (
    <div
      className="card"
      onClick={onSelect}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="poster">
        <Image
          src={displayThumbnail}
          alt={video.title}
          fill
          quality={80}
          sizes="(max-width:768px) 100vw, 320px"
          style={{ objectFit: "cover", objectPosition: "center" }}
          className="poster-image"
        />

        {isHovered && trailerTarget && (
          <div className="video-layer">
            <TrailerPlayer url={trailerTarget} isActive={isHovered} />
          </div>
        )}

        <div className="overlay" />

        <div className="content">
          <div className="top">
            <div className="badges">
              <span className="new-badge">New</span>
              <span className={`rating ${video.maturityRating === "18+" ? "adult" : ""}`}>
                {video.maturityRating || "G"}
              </span>
              <span className="quality">HD</span>
              {/* Show season count if TV page, else show year */}
              {isTvPage ? (
                <span className="year">{video.seasonCount} Season{video.seasonCount !== 1 ? 's' : ''}</span>
              ) : (
                video.releaseYear && <span className="year">{video.releaseYear}</span>
              )}
            </div>
          </div>

          <div className="bottom">
            <h3 className="title">{video.title}</h3>
            
            <div className="genres">
              {video.categories?.slice(0, 3).map((cat: any) => {
                const name = typeof cat === "string" ? cat : cat.category?.name;
                if (!name) return null;
                return <span key={name} className="genre">{name}</span>;
              })}
            </div>

            <div className="expandable-content">
              <p className="description">
                {video.description || "Watch now on MovieFlix."}
              </p>

              <div className="actions">
                <button className="circle play" onClick={(e) => { e.stopPropagation(); onSelect(); }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                </button>
                <button className="circle" onClick={(e) => { e.stopPropagation(); setIsAdded(!isAdded); }}>
                  {isAdded ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6z" /></svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .card { position: relative; cursor: pointer; overflow: hidden; border-radius: 10px; background: #111; border: 1px solid #000; transition: transform .35s ease, box-shadow .35s ease, border-color .35s ease; box-shadow: 0 10px 25px rgba(0,0,0,.30), 0 25px 50px rgba(0,0,0,.45); }
        .card:hover { transform: translateY(-8px); border-color: rgba(255,255,255,.14); box-shadow: 0 25px 55px rgba(0,0,0,.55), 0 50px 90px rgba(0,0,0,.70); }
        .poster { position: relative; aspect-ratio: 2/3; overflow: hidden; background: #000; }
        .poster-image { transition: transform .6s ease, opacity .35s ease; }
        .card:hover .poster-image { transform: scale(1.08); }
        .video-layer { position: absolute; inset: 0; z-index: 5; opacity: 0; animation: fade .4s forwards; pointer-events: none; }
        .overlay { position: absolute; inset: 0; z-index: 3; background: linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.85) 40%, rgba(0,0,0,0.3) 100%); transition: .35s; }
        .content { position: absolute; inset: 0; z-index: 6; display: flex; flex-direction: column; justify-content: flex-end; padding: 15px 5px 15px 12px; }
        .top { position: absolute; top: 12px; left: 12px; right: 12px; }
        .badges { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
        .new-badge { background: #e50914; color: white; padding: 3px 8px; border-radius: 4px; font-size: 0.65rem; font-weight: 800; text-transform: uppercase; }
        .rating, .quality, .year { background: rgba(0,0,0,.5); backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,.15); color: white; padding: 3px 8px; border-radius: 6px; font-size: 0.7rem; font-weight: 600; }
        .adult { color: #ff5757; border-color: #ff5757; }
        .bottom { display: flex; flex-direction: column; }
        .title { margin: 0 0 10px 0; color: white; font-size: 1rem; font-weight: 600; }
        .genres { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 0; }
        .expandable-content { overflow: visible; max-height: 0; transition: max-height 0.35s ease-out, opacity 0.35s ease; opacity: 0; }
        .card:hover .expandable-content { max-height: 200px; opacity: 1; }
        .genre { background: rgba(255,255,255,.08); backdrop-filter: blur(8px); color: #efefef; padding: 5px 11px; border-radius: 999px; font-size: .70rem; }
        .description { color: #ffffff; font-size: .82rem; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; margin-top: 12px; }
        .actions { display: flex; gap: 10px; margin-top: 14px; padding: 8px; overflow: visible; }
        .circle { width: 42px; height: 42px; border-radius: 50%; border: 1px solid rgba(255,255,255,.25); background: rgba(20,20,20,.55); color: white; display: flex; justify-content: center; align-items: center; cursor: pointer; transition: transform .3s ease; }
        .circle:hover { background: white; color: black; transform: scale(1.15); }
        .play { background: white; color: black; }
        @keyframes fade { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
}