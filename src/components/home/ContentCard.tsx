"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useMemo } from "react";
import { Play, Plus, Check, ThumbsUp, ChevronDown, Star, Sparkles, Clock } from "lucide-react";
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

  const cardStyle = (style || "STANDARD_POSTER").toUpperCase();
  const isWide = cardStyle === "WIDE_BACKDROP" || cardStyle === "CONTINUE_WATCHING";
  const isTop10 = cardStyle === "TOP_10_NUMERIC";
  const isFeatured = cardStyle === "FEATURED_CARD";

  const imageUrl = useMemo(() => {
    const rawUrl = (isWide || isFeatured)
      ? (content.backdropUrl || content.thumbnailUrl || "/placeholder.jpg")
      : (content.thumbnailUrl || content.backdropUrl || "/placeholder.jpg");
    return normalizeUrl(rawUrl);
  }, [content, isWide, isFeatured]);

  const sticker = useMemo(() => getStickerState(content), [content]);
  const detailHref = content.isTvShow ? `/shows/${content.id}` : `/movies/${content.id}`;

  const toggleMyList = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setInMyList(!inMyList);
  };

  const handlePlayClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    window.location.href = `/watch/${content.id}`;
  };

  // =========================================================================
  // CARD STYLE 1: TOP 10 NUMERIC RANKED CARD (#1 - #10)
  // =========================================================================
  if (isTop10) {
    const rankNumber = index + 1;
    return (
      <div
        className="card-wrapper top10"
        style={{ animationDelay: `${Math.min(index * 0.05, 0.5)}s` }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Link href={detailHref} className="card-link" aria-label={`#${rankNumber} ${content.title}`}>
          <div className="top10-container">
            <div className="rank-number-wrapper">
              <span className="rank-number">{rankNumber}</span>
            </div>
            <div className="card-container standard-poster">
              <div className="image-wrapper">
                <Image
                  src={imageUrl}
                  alt={content.title}
                  fill
                  loading="lazy"
                  quality={80}
                  className="card-image"
                  sizes="160px"
                  onError={(e) => (e.currentTarget.style.visibility = "hidden")}
                />
              </div>
              <div className="card-overlay" />
              <div className={`hover-actions-bottom ${isHovered ? "visible" : ""}`}>
                <button className="action-btn play" aria-label={`Play ${content.title}`} onClick={handlePlayClick}>
                  <Play size={12} fill="currentColor" />
                </button>
                <button className="action-btn" aria-label="My List" onClick={toggleMyList}>
                  {inMyList ? <Check size={12} /> : <Plus size={12} />}
                </button>
              </div>
            </div>
          </div>
        </Link>
        <style jsx>{`
          .card-wrapper.top10 {
            flex-shrink: 0;
            width: 13.5rem;
            cursor: pointer;
            animation: cardFadeIn 0.4s ease forwards;
            scroll-snap-align: start;
          }
          .card-link { display: block; text-decoration: none; color: inherit; }
          .top10-container {
            display: flex;
            align-items: center;
            position: relative;
            height: 13.5rem;
          }
          .rank-number-wrapper {
            width: 5.5rem;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2;
            margin-right: -1.2rem;
            user-select: none;
          }
          .rank-number {
            font-size: 7.5rem;
            font-weight: 900;
            line-height: 1;
            font-family: system-ui, -apple-system, sans-serif;
            color: #000;
            -webkit-text-stroke: 3px #555;
            text-shadow: 0 0 15px rgba(255,255,255,0.2);
            transition: all 0.3s ease;
          }
          .top10-container:hover .rank-number {
            -webkit-text-stroke: 3px #e50914;
            color: #111;
            transform: scale(1.08);
          }
          .standard-poster {
            width: 9rem;
            height: 13.5rem;
            position: relative;
            border-radius: 8px;
            overflow: hidden;
            background: #111;
            transition: transform 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.35s ease;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
            z-index: 1;
          }
          .top10-container:hover .standard-poster {
            transform: scale(1.05);
            box-shadow: 0 12px 25px rgba(229, 9, 20, 0.3);
            z-index: 10;
          }
          .image-wrapper { position: absolute; inset: 0; }
          .card-image { object-fit: cover; transition: transform 0.5s ease; border-radius: 8px; }
          .top10-container:hover .card-image { transform: scale(1.08); }
          .card-overlay {
            position: absolute;
            inset: 0;
            background: linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.85) 100%);
          }
          .hover-actions-bottom {
            position: absolute;
            bottom: 10px;
            left: 8px;
            right: 8px;
            display: flex;
            gap: 6px;
            opacity: 0;
            transform: translateY(8px);
            transition: all 0.25s ease;
            z-index: 5;
          }
          .hover-actions-bottom.visible { opacity: 1; transform: translateY(0); }
          .action-btn {
            width: 26px; height: 26px; border-radius: 50%;
            border: 1px solid rgba(255,255,255,0.3);
            background: rgba(0,0,0,0.6); color: #fff;
            display: flex; align-items: center; justify-content: center;
            cursor: pointer; backdrop-filter: blur(4px); transition: all 0.2s ease;
          }
          .action-btn.play { background: #fff; color: #000; border-color: #fff; }
          .action-btn:hover { transform: scale(1.15); }
          @keyframes cardFadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @media (max-width: 768px) {
            .card-wrapper.top10 { width: 11rem; }
            .top10-container { height: 11rem; }
            .rank-number { font-size: 5.5rem; }
            .standard-poster { width: 7.5rem; height: 11rem; }
          }
        `}</style>
      </div>
    );
  }

  // =========================================================================
  // CARD STYLE 2: FEATURED CINEMATIC SPOTLIGHT CARD
  // =========================================================================
  if (isFeatured) {
    return (
      <div
        className="card-wrapper featured"
        style={{ animationDelay: `${Math.min(index * 0.05, 0.5)}s` }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Link href={detailHref} className="card-link" aria-label={content.title}>
          <div className="featured-container">
            <div className="image-wrapper">
              <Image
                src={imageUrl}
                alt={content.title}
                fill
                loading="lazy"
                quality={85}
                className="card-image"
                sizes="340px"
                onError={(e) => (e.currentTarget.style.visibility = "hidden")}
              />
            </div>

            <div className="featured-badge">
              <Sparkles size={10} className="sparkle-icon" />
              <span>FEATURED</span>
            </div>

            <div className="featured-overlay" />

            <div className="featured-body">
              <h3 className="featured-title">{content.title}</h3>
              <div className="featured-meta">
                {content.releaseYear > 0 && <span className="meta-tag">{content.releaseYear}</span>}
                <span className="meta-tag maturity">{content.maturityRating || "PG-13"}</span>
                {content.duration ? <span className="meta-tag duration"><Clock size={10} /> {formatDuration(content.duration)}</span> : null}
              </div>
              {content.description && (
                <p className="featured-desc">{content.description}</p>
              )}
              {content.categories.length > 0 && (
                <div className="featured-categories">
                  {content.categories.slice(0, 3).map(cat => (
                    <span key={cat} className="category-pill">{cat}</span>
                  ))}
                </div>
              )}
              <div className="featured-actions">
                <button className="btn-play-now" onClick={handlePlayClick}>
                  <Play size={13} fill="currentColor" /> Watch Now
                </button>
                <button className="btn-icon" aria-label="Add to List" onClick={toggleMyList}>
                  {inMyList ? <Check size={14} /> : <Plus size={14} />}
                </button>
              </div>
            </div>
          </div>
        </Link>
        <style jsx>{`
          .card-wrapper.featured {
            flex-shrink: 0;
            width: 22rem;
            cursor: pointer;
            animation: cardFadeIn 0.4s ease forwards;
            scroll-snap-align: start;
          }
          .card-link { display: block; text-decoration: none; color: inherit; }
          .featured-container {
            position: relative;
            height: 12.5rem;
            border-radius: 12px;
            overflow: hidden;
            background: #111;
            border: 1px solid rgba(255, 255, 255, 0.12);
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
            transition: all 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          }
          .featured-container:hover {
            transform: translateY(-6px) scale(1.02);
            border-color: rgba(229, 9, 20, 0.5);
            box-shadow: 0 16px 36px rgba(229, 9, 20, 0.25), 0 4px 20px rgba(0,0,0,0.6);
          }
          .image-wrapper { position: absolute; inset: 0; }
          .card-image { object-fit: cover; transition: transform 0.6s ease; border-radius: 12px; }
          .featured-container:hover .card-image { transform: scale(1.06); }
          .featured-badge {
            position: absolute; top: 10px; left: 10px; z-index: 5;
            display: flex; align-items: center; gap: 4px;
            background: rgba(229, 9, 20, 0.9); color: #fff;
            padding: 3px 8px; border-radius: 20px;
            font-size: 0.55rem; font-weight: 800; letter-spacing: 0.8px;
            backdrop-filter: blur(6px); border: 1px solid rgba(255,255,255,0.2);
          }
          .featured-overlay {
            position: absolute; inset: 0; z-index: 2;
            background: linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.4) 60%, transparent 100%);
          }
          .featured-body {
            position: absolute; bottom: 12px; left: 12px; right: 12px; z-index: 4;
            display: flex; flex-direction: column; gap: 4px;
          }
          .featured-title {
            color: #fff; font-size: 1.1rem; font-weight: 700; margin: 0;
            white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
            text-shadow: 0 2px 4px rgba(0,0,0,0.8);
          }
          .featured-meta { display: flex; align-items: center; gap: 6px; }
          .meta-tag {
            font-size: 0.6rem; color: #ccc; background: rgba(0,0,0,0.6);
            padding: 1px 5px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.15);
            display: flex; align-items: center; gap: 3px;
          }
          .meta-tag.maturity { color: #e50914; border-color: #e50914; font-weight: 700; }
          .featured-desc {
            color: #bbb; font-size: 0.65rem; line-height: 1.3; margin: 2px 0;
            display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
            overflow: hidden; text-overflow: ellipsis;
          }
          .featured-categories { display: flex; gap: 4px; flex-wrap: wrap; margin-top: 2px; }
          .category-pill {
            background: rgba(255,255,255,0.12); color: #ddd;
            font-size: 0.55rem; padding: 2px 6px; border-radius: 10px;
            backdrop-filter: blur(4px);
          }
          .featured-actions { display: flex; align-items: center; gap: 8px; margin-top: 4px; }
          .btn-play-now {
            display: inline-flex; align-items: center; gap: 4px;
            background: #e50914; color: #fff; border: none;
            padding: 5px 12px; border-radius: 6px; font-size: 0.7rem; font-weight: 700;
            cursor: pointer; transition: all 0.2s ease;
          }
          .btn-play-now:hover { background: #ff0f1a; transform: scale(1.05); }
          .btn-icon {
            width: 28px; height: 28px; border-radius: 50%;
            background: rgba(255,255,255,0.15); color: #fff;
            border: 1px solid rgba(255,255,255,0.25); display: flex;
            align-items: center; justify-content: center; cursor: pointer;
            backdrop-filter: blur(4px); transition: all 0.2s ease;
          }
          .btn-icon:hover { background: rgba(255,255,255,0.3); transform: scale(1.1); }
          @keyframes cardFadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @media (max-width: 768px) {
            .card-wrapper.featured { width: 17rem; }
            .featured-container { height: 10.5rem; }
            .featured-desc { display: none; }
          }
        `}</style>
      </div>
    );
  }

  // =========================================================================
  // CARD STYLES 3, 4, 5: STANDARD POSTER, WIDE BACKDROP, CONTINUE WATCHING
  // =========================================================================
  const isContinueWatching = cardStyle === "CONTINUE_WATCHING";

  return (
    <div
      className={`card-wrapper ${isWide ? "wide" : "standard"} ${isContinueWatching ? "continue" : ""}`}
      style={{ animationDelay: `${Math.min(index * 0.04, 0.4)}s` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link href={detailHref} className="card-link" aria-label={content.title}>
        <div className="card-container">
          {/* Main Artwork */}
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

          {/* Sticker Tag */}
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

          {/* Top Badges */}
          <div className={`default-badges ${isHovered ? "hidden" : ""}`}>
            <span className={`maturity-badge ${content.maturityRating === "18+" ? "adult" : ""}`}>
              {content.maturityRating || "G"}
            </span>
            <span className="quality-badge">HD</span>
          </div>

          {/* Dark Gradient Overlay */}
          <div className={`card-overlay ${isHovered ? "visible" : ""}`} />

          {/* Progress Track for Continue Watching */}
          {(content.progress !== undefined && content.progress > 0) || isContinueWatching ? (
            <div className="progress-track" aria-label={`${content.progress || 35}% watched`}>
              <div className="progress-fill" style={{ width: `${content.progress || 35}%` }} />
            </div>
          ) : null}

          {/* Top Hover Details */}
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

          {/* Bottom Hover Actions */}
          <div className={`hover-actions-bottom ${isHovered ? "visible" : ""}`}>
            <div className="quick-actions">
              <button className="action-btn play" aria-label={`Play ${content.title}`} onClick={handlePlayClick}>
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
        .card-wrapper.continue { width: 15.5rem; }

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

        .card-wrapper.standard .card-container { height: 13.5rem; }
        .card-wrapper.wide .card-container { height: 8.5rem; }
        .card-wrapper.continue .card-container { height: 8.8rem; border: 1px solid rgba(255,255,255,0.08); }

        .card-container:hover {
          transform: scale(1.06);
          box-shadow: 0 16px 30px rgba(0, 0, 0, 0.6);
          z-index: 50;
        }

        .image-wrapper { position: absolute; inset: 0; }
        .card-image { object-fit: cover; transition: transform 0.5s ease; border-radius: 8px; }
        .card-container:hover .card-image { transform: scale(1.08); }

        .new-sticker {
          position: absolute; bottom: 0px; left: 50%;
          transform: translateX(-50%); white-space: nowrap;
          backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px);
          padding: 3px 6px; border-top-left-radius: 4px; border-top-right-radius: 4px;
          font-size: 0.5rem; font-weight: 700; text-transform: uppercase;
          z-index: 6; letter-spacing: 0.5px; border: 1px solid rgba(255, 255, 255, 0.1);
          opacity: 1; transition: opacity 0.25s ease, transform 0.25s ease;
        }
        .new-sticker.hidden { opacity: 0; transform: translateX(-50%) translateY(6px); pointer-events: none; }
        .sticker-new-episode { background: rgba(255, 255, 255, 0.9); color: black; }
        .sticker-recent { background: rgba(229, 9, 20, 0.9); color: white; }

        .default-badges {
          position: absolute; top: 6px; left: 6px;
          display: flex; gap: 3px; z-index: 4; transition: opacity 0.2s ease;
        }
        .default-badges.hidden { opacity: 0; pointer-events: none; }

        .maturity-badge, .quality-badge {
          background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(6px);
          border: 1px solid rgba(255, 255, 255, 0.15); color: white;
          padding: 1px 4px; border-radius: 3px; font-size: 0.55rem; font-weight: 600;
        }
        .maturity-badge.adult { color: #ff5757; border-color: #ff5757; }

        .rating-badge {
          position: absolute; top: 6px; right: 6px; z-index: 4;
          display: flex; align-items: center; gap: 2px;
          background: rgba(0, 0, 0, 0.75); color: #fbbf24;
          padding: 1px 5px; border-radius: 3px; font-size: 0.6rem; font-weight: 600;
          backdrop-filter: blur(4px);
        }

        .card-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 40%, rgba(0,0,0,0.85) 100%);
          opacity: 0; transition: opacity 0.3s ease; z-index: 2;
        }
        .card-overlay.visible { opacity: 1; }

        .progress-track {
          position: absolute; bottom: 0; left: 0; right: 0;
          height: 3px; background: rgba(255, 255, 255, 0.25); z-index: 5;
        }
        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #e50914, #ff5252);
        }

        .hover-info-top {
          position: absolute; top: 10px; left: 8px; right: 8px; z-index: 6;
          opacity: 0; transform: translateY(-4px); transition: opacity 0.3s ease, transform 0.3s ease;
        }
        .hover-info-top.visible { opacity: 1; transform: translateY(0); }

        .card-title {
          color: #fff; font-size: 0.8rem; font-weight: 600; margin: 0 0 0.1rem;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .card-meta {
          display: flex; align-items: center; gap: 0.3rem;
          color: #b3b3b3; font-size: 0.6rem; margin-bottom: 0.1rem;
        }
        .card-categories {
          color: #999; font-size: 0.55rem;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }

        .hover-actions-bottom {
          position: absolute; bottom: 10px; left: 8px; right: 8px;
          display: flex; justify-content: space-between; align-items: center;
          z-index: 6; opacity: 0; transform: translateY(10px);
          transition: opacity 0.3s ease, transform 0.3s ease;
        }
        .hover-actions-bottom.visible { opacity: 1; transform: translateY(0); }

        .quick-actions { display: flex; gap: 0.3rem; }

        .action-btn {
          width: 24px; height: 24px; border-radius: 50%;
          border: 1px solid rgba(255, 255, 255, 0.3); background: rgba(0, 0, 0, 0.6);
          color: #fff; display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all 0.2s ease; backdrop-filter: blur(4px);
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
          .card-wrapper.continue { width: 12.5rem; }
          .card-wrapper.standard .card-container { height: 11.5rem; }
          .card-wrapper.wide .card-container { height: 7rem; }
          .card-wrapper.continue .card-container { height: 7.2rem; }
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