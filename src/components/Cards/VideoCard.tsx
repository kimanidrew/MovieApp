"use client";

import React, { useState } from "react";
import Image from "next/image";
import TrailerPlayer from "../TrailerPlayer";
import { normalizeUrl } from "@/utils/normalizeUrl";

interface VideoCardProps {
  video: any;
  onSelect: () => void;
}

export default function VideoCard({ video, onSelect }: VideoCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  
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
      className="card-container" 
      onClick={onSelect} 
      onMouseEnter={() => setIsHovered(true)} 
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="media-wrapper">
        <Image 
          src={displayThumbnail} 
          alt={video.title} 
          fill 
          sizes="(max-width: 768px) 100vw, 320px"
          quality={75}
          style={{ objectFit: "cover", objectPosition: "center" }}
        />
        
        {isHovered && trailerTarget && (
          <div className="trailer-overlay">
            <TrailerPlayer url={trailerTarget} isActive={isHovered} />
          </div>
        )}
      </div>

      <div className="card-info">
        <h3>{video.title}</h3>
        
        <div className="card-footer">
          <div className="meta-row">
            {/* Styled Maturity Rating Badge */}
            <span className={`rating-badge ${video.maturityRating === '18+' ? 'explicit' : ''}`}>
              {video.maturityRating || 'G'}
            </span>
            <span className="hd-tag">HD</span>
            <span className="year">{video.releaseYear}</span>
          </div>

          <div className="category-container">
            {video.categories?.slice(0, 2).map((cat: any) => {
              const catName = typeof cat === 'string' ? cat : cat.category?.name;
              if (!catName) return null;
              return <span key={catName} className="pill">{catName}</span>;
            })}
          </div>
        </div>
      </div>

      <style jsx>{`
        .card-container {
          background: #000;
          border-radius: 8px;
          overflow: hidden;
          cursor: pointer;
          transition: transform 0.4s ease, box-shadow 0.4s ease;
          border: 1px solid #1a1a1a;
        }
        .card-container:hover {
          transform: translateY(-5px);
          box-shadow: 0 15px 30px rgba(0,0,0,0.8);
          border-color: #333;
        }
        .media-wrapper { position: relative; padding-top: 56.25%; background: #000; }
        .trailer-overlay { position: absolute; inset: 0; z-index: 5; pointer-events: none; }
        
        .card-info { padding: 0.8rem; }
        h3 { margin: 0 0 1rem 0; font-size: 0.95rem; color: #b3b3b3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        
        .card-footer { display: flex; flex-direction: column; gap: 6px; }
        .meta-row { display: flex; align-items: center; gap: 8px; color: #aaa; font-size: 0.7rem; }
        
        .rating-badge { 
          font-weight: bold; padding: 1px 4px; border: 1px solid #444; border-radius: 2px; color: #eee; 
        }
        .rating-badge.explicit { border-color: #e50914; color: #e50914; }
        
        .hd-tag { border: 1px solid #444; padding: 0 3px; border-radius: 2px; font-size: 0.6rem; color: #aaa; }
        
        .category-container { display: flex; gap: 4px; }
        .pill { font-size: 0.65rem; color: #666; }
      `}</style>
    </div>
  );
}