"use client";

import React from "react";

interface HeroBannerProps {
  hero: any;
}

export default function HeroBanner({ hero }: HeroBannerProps) {
  if (!hero) return null;

  const backdrop = hero.images?.find((img: any) => img.type === "BACKDROP")?.url || hero.images?.[0]?.url || "/placeholder-hero.jpg";

  return (
    <div className="relative h-[56.25vw] w-screen min-h-[420px] max-h-[80vh] bg-zinc-950 select-none">
      <img src={backdrop} alt={hero.title} className="w-full h-full object-cover brightness-[60%]" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/10 to-black/20" />
      
      <div className="absolute top-[35%] md:top-[40%] left-4 md:left-12 max-w-xl space-y-2 md:space-y-4 pr-4">
        <h1 className="text-2xl md:text-5xl lg:text-6xl font-extrabold tracking-tight drop-shadow-md text-white font-sans">
          {hero.title}
        </h1>
        <p className="text-xs sm:text-sm md:text-base text-gray-200 drop-shadow line-clamp-3 max-w-lg leading-normal font-sans">
          {hero.description}
        </p>

        <div className="flex items-center gap-2 text-xs text-gray-300">
          {hero.maturityRating && (
            <span className="font-bold border border-white/40 bg-black/40 px-1.5 py-0.5 rounded text-[10px] uppercase">
              {hero.maturityRating.name}
            </span>
          )}
          {hero.categories?.slice(0, 3).map((c: any) => (
            <span key={c.category.id} className="after:content-['•'] last:after:content-none after:ml-1.5">
              {c.category.name}
            </span>
          ))}
        </div>

        <div className="flex items-center space-x-3 pt-1">
          <button className="flex items-center justify-center gap-2 bg-white text-black font-bold px-6 py-1.5 md:py-2 rounded hover:bg-white/80 transition shadow-md active:scale-95 text-xs md:text-sm">
            ▶ Play
          </button>
          <button className="flex items-center justify-center gap-2 bg-zinc-500/50 text-white font-bold px-5 py-1.5 md:py-2 rounded hover:bg-zinc-600/50 backdrop-blur-md transition active:scale-95 text-xs md:text-sm">
            ⓘ More Info
          </button>
        </div>
      </div>
    </div>
  );
}