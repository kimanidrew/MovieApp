"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import TrailerPlayer from "../TrailerPlayer";
import { normalizeUrl } from "@/utils/normalizeUrl";
import { getStickerState } from "@/utils/stickerUtils";

interface VideoCardProps {
  video: any;
  onSelect: () => void;
  isTvPage?: boolean;
}

export default function VideoCard({ video, onSelect, isTvPage = false }: VideoCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const sticker = useMemo(() => getStickerState(video), [video]);

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

  const trailerTarget = video.trailerUrl || (video.videoSources && video.videoSources[0]?.url);

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

        {sticker && (
          <div className={`new-sticker ${sticker.className}`}>
            {sticker.text}
          </div>
        )}

        {isHovered && trailerTarget && (
          <div className="video-layer">
            <TrailerPlayer url={trailerTarget} isActive={isHovered} />
          </div>
        )}

        <div className="overlay" />

        <div className="content">
          <div className="top">
            <div className="badges">
              <span className={`rating ${video.maturityRating === "18+" ? "adult" : ""}`}>
                {video.maturityRating || "G"}
              </span>
              <span className="quality">HD</span>
              {isTvPage ? (
                <span className="year">{video.seasonCount} Season{video.seasonCount !== 1 ? 's' : ''}</span>
              ) : (
                video.releaseYear && <span className="year">{video.releaseYear}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .card { 
          position: relative; 
          cursor: pointer; 
          overflow: hidden; 
          border-radius: 12px; 
          background: #111; 
          isolation: isolate;
          transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.4s ease; 
          box-shadow: 0 4px 6px rgba(0,0,0,0.3), 0 10px 20px rgba(0,0,0,0.3); 
        }
        
        .card:hover { 
          transform: translateY(-10px) scale(1.02); 
          box-shadow: 0 20px 30px rgba(0,0,0,0.6), 0 30px 60px rgba(0,0,0,0.8);
        }

        .poster { position: relative; aspect-ratio: 2/3; overflow: hidden; background: #000; }
        
        .poster-image { transition: transform 0.6s ease; }
        .card:hover .poster-image { transform: scale(1.1); }
        
        .video-layer { position: absolute; inset: 0; z-index: 5; opacity: 0; animation: fade 0.4s forwards; pointer-events: none; }
        
        /* Shared Base Styles */
        .new-sticker {
          position: absolute;
          bottom: 0px;
          left: 50%;
          transform: translateX(-50%);
          white-space: nowrap;
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          padding: 10px 15px;
          border-top-left-radius: 6px;
          border-top-right-radius: 6px;
          border-bottom-left-radius: 0px;
          border-bottom-right-radius: 0px;
          font-size: 0.65rem;
          font-weight: 700;
          text-transform: uppercase;
          z-index: 10;
          letter-spacing: 0.5px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .sticker-new-episode { background: rgba(255, 255, 255, 0.9); color: black; }
        .sticker-recent { background: rgba(229, 9, 20, 0.85); color: white; }

        /* Animation for hiding overlay and content */
        .overlay, .content { 
          position: absolute; 
          inset: 0; 
          z-index: 3; 
          transition: opacity 0.4s ease;
          opacity: 1;
        }

        .card:hover .overlay,
        .card:hover .content {
          opacity: 0;
        }

        .overlay { 
          z-index: 3; 
          background: linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.05) 100%); 
          pointer-events: none; 
        }

        .content { z-index: 6; display: flex; flex-direction: column; padding: 12px; }
        .top { display: flex; flex-direction: column; }
        .badges { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
        .rating, .quality, .year { background: rgba(0,0,0,.5); backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,.15); color: white; padding: 3px 8px; border-radius: 6px; font-size: 0.7rem; font-weight: 600; }
        .adult { color: #ff5757; border-color: #ff5757; }
        
        @keyframes fade { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
}