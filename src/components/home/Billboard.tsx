'use client';

import Image from "next/image";
import Link from "next/link";
import { Play, Info } from "lucide-react";
import { Video } from "@/types/video";

export default function Billboard({ content }: { content: Video | undefined }) {
  if (!content) return null;

  return (
    <div className="billboard-container">
      {/* Background Image */}
      <div className="image-wrapper">
        <Image 
          src={content.backdropUrl || "/placeholder.jpg"} 
          alt={content.title}
          fill
          priority
          className="responsive-image"
        />
      </div>

      <div className="overlay-bottom" />
      <div className="overlay-vignette" />

      <div className="info-container">
        <h1 className="title">{content.title}</h1>

        <div className="meta-container">
          <span className="badge">{content.maturityRating}</span>
          <span className="year">{content.releaseYear}</span>
          <span className="categories">{content.categories.slice(0, 3).join(" • ")}</span>
        </div>

        <p className="description">{content.description}</p>
        
        <div className="button-group">
          <Link href={`/watch/${content.id}`} className="play-button">
            <Play size={24} fill="currentColor" /> Play
          </Link>
          <Link href={`/movie/${content.id}`} className="info-button">
            <Info size={24} /> More Info
          </Link>
        </div>
      </div>

      <style jsx>{`
        /* ... (Keep your existing styles here) ... */
        .billboard-container { position: relative; width: 100%; height: 85vh; background: #000; overflow: hidden; }
        .image-wrapper { width: 100%; height: 100%; position: relative; }
        :global(.responsive-image) { object-fit: cover; }
        .overlay-bottom { position: absolute; inset: 0; z-index: 3; background: linear-gradient(to top, #000 0%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.3) 100%); }
        .overlay-vignette { position: absolute; inset: 0; z-index: 3; background: radial-gradient(circle at right center, transparent 30%, rgba(0,0,0,0.6) 100%); }
        .info-container { position: absolute; left: 4%; bottom: 15%; z-index: 10; max-width: 45%; }
        .title { color: white; font-size: 3.5rem; font-weight: 800; text-shadow: 2px 2px 4px rgba(0,0,0,0.5); margin-bottom: 1rem; }
        .meta-container { display: flex; align-items: center; gap: 1rem; color: #fff; font-size: 1.1rem; margin-bottom: 1rem; }
        .badge { border: 1px solid #fff; padding: 2px 8px; font-weight: bold; }
        .description { color: #fff; font-size: 1.2rem; margin-bottom: 2rem; text-shadow: 0 1px 4px rgba(0,0,0,0.8); line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
        .button-group { display: flex; gap: 1rem; }
        .play-button { display: flex; align-items: center; gap: 0.75rem; background: #fff; color: #000; padding: 1rem 2rem; border-radius: 4px; font-weight: 700; font-size: 1.1rem; transition: background 0.2s; text-decoration: none; }
        .play-button:hover { background: #e5e5e5; }
        .info-button { display: flex; align-items: center; gap: 0.75rem; background: rgba(109,109,110,0.7); color: #fff; padding: 1rem 2rem; border-radius: 4px; font-weight: 700; font-size: 1.1rem; transition: background 0.2s; text-decoration: none; }
        .info-button:hover { background: rgba(109,109,110,0.5); }
      `}</style>
    </div>
  );
}