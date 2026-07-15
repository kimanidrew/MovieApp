"use client";

import { useEffect, useMemo, useState } from "react";

interface PageBackgroundProps {
  /**
   * Peak opacity of the dark gradient overlay at its darkest point.
   * @default 0.92
   */
  overlayOpacity?: number;
}

const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
const POSTER_BASE = "https://image.tmdb.org/t/p/w500";

/**
 * Smart Poster component that pre-loads and pre-decodes images off-screen.
 */
function PosterImage({ src }: { src: string }) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!src) return;

    let active = true;
    const img = new Image();
    img.src = src;

    img.decode()
      .then(() => {
        if (active) setIsReady(true);
      })
      .catch((err) => {
        if (active) setIsReady(true);
        console.warn("Failed to hardware-decode image pre-render:", err);
      });

    return () => {
      active = false;
    };
  }, [src]);

  return (
    <div
      className={`poster ${isReady ? "loaded" : ""}`}
      style={{
        backgroundImage: isReady ? `url(${src})` : "none",
      }}
    >
      <style jsx>{`
        .poster {
          width: 130px;
          height: 200px;
          background-size: cover;
          background-repeat: no-repeat;
          background-position: center;
          flex-shrink: 0;
          border-radius: 0;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
          transition: opacity 1.5s cubic-bezier(0.25, 1, 0.5, 1);
          transform: translate3d(0, 0, 0); 
          backface-visibility: hidden;
          background-color: #111;
          opacity: 0;
        }

        .poster.loaded {
          opacity: 1;
        }

        @media (max-width: 768px) {
          .poster {
            width: 80px;
            height: 170px;
          }
        }
      `}</style>
    </div>
  );
}

export default function PageBackground({
  overlayOpacity = 0.92, // Deepened default opacity for a richer backdrop
}: PageBackgroundProps) {
  const [posters, setPosters] = useState<string[]>([]);

  useEffect(() => {
    if (!TMDB_API_KEY) {
      console.error(
        "PageBackground error: NEXT_PUBLIC_TMDB_API_KEY environment variable is not defined."
      );
      return;
    }

    async function loadTrendingMovies() {
      try {
        const res = await fetch(
          `https://api.themoviedb.org/3/trending/movie/week?api_key=${TMDB_API_KEY}`
        );
        if (!res.ok) throw new Error(`HTTP status: ${res.status}`);
        
        const data = await res.json();
        const imgs =
          data.results
            ?.filter((m: any) => m.poster_path)
            .map((m: any) => `${POSTER_BASE}${m.poster_path}`) || [];
        
        setPosters(imgs);
      } catch (err) {
        console.error("Failed to fetch backgrounds from TMDB:", err);
      }
    }

    loadTrendingMovies();
  }, []);

  const rows = useMemo(() => {
    if (!posters.length) return [];

    const shuffle = (arr: string[]) => [...arr].sort(() => Math.random() - 0.5);

    return Array.from({ length: 5 }).map(() => {
      const randomized = shuffle(posters);
      // Double set is plenty for a static layout, ensuring full screen coverage
      return [...randomized, ...randomized];
    });
  }, [posters]);

  if (!rows.length) return null;

  return (
    <>
      <div className="background">
        <div className="rows">
          {rows.map((rowPosters, rowIndex) => (
            <div key={rowIndex} className="row">
              <div className="track-wrapper">
                {rowPosters.map((poster, i) => (
                  <PosterImage key={`poster-${i}`} src={poster} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* 
          Refined Double-Layer Dark Overlay
          Layer 1: Spotlight Vignette (Fades to 75% dark at edges)
          Layer 2: Soft linear blend fading to 92% solid black at the bottom edge
        */}
        <div className="overlay-radial" />
        <div
          className="overlay-linear"
          style={{
            background: `linear-gradient(
              to bottom,
              rgba(0, 0, 0, 0) 0%,
              rgba(0, 0, 0, ${overlayOpacity * 0.40}) 30%,
              rgba(0, 0, 0, ${overlayOpacity * 0.70}) 60%,
              rgba(0, 0, 0, ${overlayOpacity * 0.90}) 85%,
              rgba(0, 0, 0, ${overlayOpacity}) 100%
            )`,
          }}
        />
      </div>

      <style jsx>{`
        .background {
          position: fixed;
          inset: 0;
          overflow: hidden;
          background: #000;
          z-index: -1;
          perspective: 1000px;
          backface-visibility: hidden;
          transform-style: preserve-3d;
        }

        .rows {
          position: absolute;
          inset: -35%; 
          display: flex;
          flex-direction: column;
          justify-content: space-evenly;
          transform: rotate(-8deg) scale(1.25);
          
          /* Balanced poster visibility (0.28) for a moody, premium look */
          opacity: 0.28; 
          
          transform-style: preserve-3d;
          pointer-events: none;
        }

        .row {
          width: 100%;
          overflow: hidden;
          display: flex;
          transform-style: preserve-3d;
          backface-visibility: hidden;
        }

        .track-wrapper {
          display: flex;
          width: max-content;
          gap: 10px;
          padding-right: 22px;
          transform-style: flat;
          backface-visibility: hidden;
        }

        /* 
          High-end theatrical spotlight vignette
        */
        .overlay-radial {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: radial-gradient(
            circle at center,
            rgba(0, 0, 0, 0) 0%,
            rgba(0, 0, 0, 0.75) 100%
          );
        }

        /* 
          Vertical fade layer with built-in layout blur
        */
        .overlay-linear {
          position: absolute;
          inset: 0;
          pointer-events: none;
          backdrop-filter: blur(2px);
          mask-image: linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 50%);
          -webkit-backdrop-filter: blur(2px);
        }

        @media (max-width: 768px) {
          .track-wrapper {
            gap: 5px;
            padding-right: 14px;
          }
        }
      `}</style>
    </>
  );
}