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
  
  // Use lazy initializer to pick a random image ONCE when the component mounts
  const [displayThumbnail] = useState(() => {
    if (!video.images || !Array.isArray(video.images)) {
      return normalizeUrl(video.thumbnailUrl);
    }
    
    // Filter for POSTER type
    const posters = video.images.filter((img: any) => img.type === "POSTER");
    
    // Pick random index, or fall back to the first image if no posters exist
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
          style={{ 
            objectFit: "cover",
            objectPosition: "center" 
          }}
        />
        
        {isHovered && trailerTarget && (
          <div className="trailer-overlay">
            <TrailerPlayer url={trailerTarget} isActive={isHovered} />
          </div>
        )}
      </div>

      <div className="card-info">
        <h3>{video.title}</h3>
        <div className="category-container">
          {video.categories?.map((cat: any) => {
            const catName = typeof cat === 'string' ? cat : cat.category?.name;
            if (!catName) return null;
            return <span key={catName} className="pill">{catName}</span>;
          })}
        </div>
        <div className="meta-row">
          <span className="rating">{video.maturityRating}</span>
          <span className="year">{video.releaseYear}</span>
        </div>
      </div>

      <style jsx>{`
        .card-container {
          background: #121212;
          border-radius: 8px;
          overflow: hidden;
          cursor: pointer;
          transition: transform 0.4s ease, box-shadow 0.4s ease;
          border: 1px solid transparent;
        }
        .card-container:hover {
          transform: translateY(-5px);
          box-shadow: 0 15px 30px rgba(0,0,0,0.5);
        }
        .media-wrapper { 
          position: relative; 
          padding-top: 56.25%; 
          background: #000; 
        }
        .trailer-overlay { position: absolute; inset: 0; z-index: 5; pointer-events: none; }
        .card-info { padding: 1rem; }
        h3 { margin: 0 0 0.5rem 0; font-size: 1.1rem; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .category-container { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 0.8rem; }
        .pill { font-size: 0.7rem; color: #888; background: #1a1a1a; padding: 2px 8px; border-radius: 4px; }
        .meta-row { display: flex; align-items: center; gap: 10px; color: #666; font-size: 0.75rem; }
        .rating { border: 1px solid #333; padding: 0 4px; border-radius: 2px; }
      `}</style>
    </div>
  );
}