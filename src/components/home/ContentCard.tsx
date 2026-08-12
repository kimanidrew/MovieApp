"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useMemo } from "react";
import { Play, Plus, Check, ThumbsUp, ChevronDown, Star } from "lucide-react";
import { HomepageItem } from "@/types/homepage";
import { normalizeUrl } from "@/utils/normalizeUrl";
import { getStickerState } from "@/utils/stickerUtils";

interface ContentCardProps {
  content: HomepageItem;
  style?: string;
  index?: number;
}

export default function ContentCard({ content, style = "STANDARD_POSTER", index = 0 }: ContentCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [inMyList, setInMyList] = useState(content.isInMyList || false);

  const isWide = style === "WIDE_BACKDROP" || style === "CONTINUE_WATCHING";
  
  const imageUrl = useMemo(() => {
    const rawUrl = isWide
      ? (content.backdropUrl || content.thumbnailUrl || "/placeholder.jpg")
      : (content.thumbnailUrl || content.backdropUrl || "/placeholder.jpg");
    return normalizeUrl(rawUrl);
  }, [content, isWide]);

  const sticker = useMemo(() => getStickerState(content), [content]);
  const detailHref = content.isTvShow ? `/shows/${content.id}` : `/movies/${content.id}`;

  const toggleMyList = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setInMyList(!inMyList);
  };

  return (
    <div
      className={`card-wrapper ${isWide ? "wide" : "standard"}`}
      style={{ animationDelay: `${Math.min(index * 0.04, 0.4)}s` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link href={detailHref} className="card-link" aria-label={content.title}>
        <div className="card-container">
          
          {/* Poster Image Layer */}
          <div className="image-wrapper">
            <Image
              src={imageUrl}
              alt={content.title}
              fill
              loading="lazy"
              quality={80}
              className="card-image"
              sizes={isWide ? "260px" : "150px"}
              onError={(e) => (e.currentTarget.style.visibility = "hidden")}
            />
          </div>

          {/* Dynamic Sticker Label */}
          {sticker && (
            <div className={`new-sticker ${sticker.className} ${isHovered ? "hidden" : ""}`}>
              {sticker.text}
            </div>
          )}

          {/* Rating Badge */}
          {content.rating ? (
            <div className="rating-badge">
              <Star size={10} fill="currentColor" />
              {content.rating.toFixed(1)}
            </div>
          ) : null}

          {/* Default Top Badges */}
          <div className={`default-badges ${isHovered ? "hidden" : ""}`}>
            <span className={`maturity-badge ${content.maturityRating === "18+" ? "adult" : ""}`}>
              {content.maturityRating || "G"}
            </span>
            <span className="quality-badge">HD</span>
          </div>

          {/* Gradient Overlay */}
          <div className={`card-overlay ${isHovered ? "visible" : ""}`} />

          {/* Progress Bar for Continue Watching */}
          {content.progress !== undefined && content.progress > 0 && (
            <div className="progress-track" aria-label={`${content.progress}% watched`}>
              <div className="progress-fill" style={{ width: `${content.progress}%` }} />
            </div>
          )}

          {/* Card Info Appearing From Top */}
          <div className={`hover-info-top ${isHovered ? "visible" : ""}`}>
            <h3 className="card-title">{content.title}</h3>
            <div className="card-meta">
              {content.releaseYear > 0 && <span>{content.releaseYear}</span>}
              {content.duration ? <span>{formatDuration(content.duration)}</span> : null}
            </div>
            {content.categories.length > 0 && (
              <div className="card-categories">{content.categories.slice(0, 2).join(" • ")}</div>
            )}
          </div>

          {/* Quick Actions Anchored at Bottom */}
          <div className={`hover-actions-bottom ${isHovered ? "visible" : ""}`}>
            <div className="quick-actions">
              <button 
                className="action-btn play" 
                aria-label={`Play ${content.title}`} 
                onClick={(e) => { 
                  e.preventDefault(); 
                  window.location.href = `/watch/${content.id}`; 
                }}
              >
                <Play size={12} fill="currentColor" />
              </button>
              <button className="action-btn" aria-label={inMyList ? "Remove from My List" : "Add to My List"} onClick={toggleMyList}>
                {inMyList ? <Check size={12} /> : <Plus size={12} />}
              </button>
              <button className="action-btn" aria-label="Like">
                <ThumbsUp size={12} />
              </button>
            </div>
            <button className="action-btn" aria-label="More options">
              <ChevronDown size={12} />
            </button>
          </div>

        </div>
      </Link>

      <style jsx>{`
        .card-wrapper {
          flex-shrink: 0;
          cursor: pointer;
          opacity: 0;
          animation: cardFadeIn 0.4s ease forwards;
          scroll-snap-align: start;
        }

        .card-wrapper.standard { width: 9.5rem; }
        .card-wrapper.wide { width: 15rem; }

        .card-link { display: block; text-decoration: none; color: inherit; }

        .card-container {
          position: relative;
          border-radius: 8px;
          overflow: hidden;
          background: #111;
          isolation: isolate;
          transition: transform 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.35s ease;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
          transform-origin: center center;
        }

        /* Reduced heights */
        .card-wrapper.standard .card-container { height: 13.5rem; }
        .card-wrapper.wide .card-container { height: 8rem; }

        .card-container:hover {
          transform: scale(1.06);
          box-shadow: 0 16px 30px rgba(0, 0, 0, 0.6);
          z-index: 50;
        }

        .image-wrapper { position: absolute; inset: 0;  }
        .card-image { object-fit: cover; transition: transform 0.5s ease; border-radius: 8px;}
        .card-container:hover .card-image { transform: scale(1.08); }

        /* Sticker Label Styling with Smooth Fade/Scale Transition */
        .new-sticker {
          position: absolute;
          bottom: 0px;
          left: 50%;
          transform: translateX(-50%);
          white-space: nowrap;
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          padding: 3px 6px;
          border-top-left-radius: 4px;
          border-top-right-radius: 4px;
          font-size: 0.5rem;
          font-weight: 700;
          text-transform: uppercase;
          z-index: 6;
          letter-spacing: 0.5px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          opacity: 1;
          transition: opacity 0.25s ease, transform 0.25s ease;
        }
        .new-sticker.hidden {
          opacity: 0;
          transform: translateX(-50%) translateY(6px);
          pointer-events: none;
        }
        .sticker-new-episode { background: rgba(255, 255, 255, 0.9); color: black; }
        .sticker-recent { background: rgba(229, 9, 20, 0.9); color: white; }

        /* Default Top Badges */
        .default-badges {
          position: absolute;
          top: 6px;
          left: 6px;
          display: flex;
          gap: 3px;
          z-index: 4;
          transition: opacity 0.2s ease;
        }
        .default-badges.hidden { opacity: 0; pointer-events: none; }

        .maturity-badge, .quality-badge {
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(6px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: white;
          padding: 1px 4px;
          border-radius: 3px;
          font-size: 0.55rem;
          font-weight: 600;
        }
        .maturity-badge.adult { color: #ff5757; border-color: #ff5757; }

        /* Rating Badge */
        .rating-badge {
          position: absolute;
          top: 6px;
          right: 6px;
          z-index: 4;
          display: flex;
          align-items: center;
          gap: 2px;
          background: rgba(0, 0, 0, 0.75);
          color: #fbbf24;
          padding: 1px 5px;
          border-radius: 3px;
          font-size: 0.6rem;
          font-weight: 600;
          backdrop-filter: blur(4px);
        }

        /* Overlay */
        .card-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 40%, rgba(0,0,0,0.85) 100%);
          opacity: 0;
          transition: opacity 0.3s ease;
          z-index: 2;
        }
        .card-overlay.visible { opacity: 1; }

        /* Progress Track */
        .progress-track {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: rgba(255, 255, 255, 0.25);
          z-index: 5;
        }
        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #3b82f6, #ec4899);
        }

        /* Top Hover Info Group */
        .hover-info-top {
          position: absolute;
          top: 10px;
          left: 6px;
          right: 6px;
          z-index: 6;
          opacity: 0;
          transform: translateY(-4px);
          transition: opacity 0.3s ease, transform 0.3s ease;
        }
        .hover-info-top.visible { opacity: 1; transform: translateY(0); }

        .card-title {
          color: #fff;
          font-size: 0.8rem;
          font-weight: 600;
          margin: 0 0 0.1rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .card-meta {
          display: flex;
          align-items: center;
          gap: 0.3rem;
          color: #b3b3b3;
          font-size: 0.6rem;
          margin-bottom: 0.1rem;
        }

        .card-categories {
          color: #999;
          font-size: 0.55rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* Bottom Hover Actions Group */
        .hover-actions-bottom {
          position: absolute;
          bottom: 10px;
          left: 6px;
          right: 6px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          z-index: 6;
          opacity: 0;
          transform: translateY(10px);
          transition: opacity 0.3s ease, transform 0.3s ease;
        }
        .hover-actions-bottom.visible { opacity: 1; transform: translateY(0); }

        .quick-actions {
          display: flex;
          gap: 0.3rem;
        }

        .action-btn {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: 1px solid rgba(255, 255, 255, 0.3);
          background: rgba(0, 0, 0, 0.6);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          backdrop-filter: blur(4px);
        }
        .action-btn:hover { background: #fff; color: #000; border-color: #fff; }
        .action-btn.play { background: #fff; color: #000; border-color: #fff; }

        @keyframes cardFadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 768px) {
          .card-wrapper.standard { width: 8rem; }
          .card-wrapper.wide { width: 12.5rem; }
          .card-wrapper.standard .card-container { height: 11.5rem; }
          .card-wrapper.wide .card-container { height: 7rem; }
        }
      `}</style>
    </div>
  );
}

function formatDuration(seconds: number): string {
  if (!seconds) return "";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}