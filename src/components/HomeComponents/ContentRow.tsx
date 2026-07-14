"use client";

import React, { useRef } from "react";

interface ContentRowProps {
  title: string;
  items: any[];
  isHistoryRow?: boolean;
}

export default function ContentRow({ title, items, isHistoryRow = false }: ContentRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);

  const handleScroll = (direction: "left" | "right") => {
    if (rowRef.current) {
      const { scrollLeft, clientWidth } = rowRef.current;
      const scrollTo = direction === "left" ? scrollLeft - clientWidth * 0.75 : scrollLeft + clientWidth * 0.75;
      rowRef.current.scrollTo({ left: scrollTo, behavior: "smooth" });
    }
  };

  if (!items || items.length === 0) return null;

  return (
    <div className="space-y-1 md:space-y-2 px-4 md:px-12 group/row relative">
      <h2 className="text-sm font-semibold text-[#e5e5e5] md:text-xl transition duration-200 hover:text-white cursor-pointer font-sans pl-1">
        {title}
      </h2>
      
      <div className="relative">
        <button 
          onClick={() => handleScroll("left")}
          className="absolute top-0 bottom-0 left-0 z-40 m-auto h-full w-10 bg-black/50 opacity-0 group-hover/row:opacity-100 transition hover:bg-black/70 flex items-center justify-center text-white text-2xl font-bold"
        >
          ‹
        </button>

        <div 
          ref={rowRef}
          className="flex items-center space-x-2.5 overflow-x-scroll scrollbar-hide py-2 overflow-y-visible"
        >
          {items.map((item) => {
            const content = isHistoryRow ? (item.video?.movie?.content || item.video?.episode?.season?.show?.content) : item;
            if (!content) return null;

            const thumbnail = content.images?.find((img: any) => img.type === "LANDSCAPE")?.url || content.images?.[0]?.url || "/placeholder.jpg";
            const progress = isHistoryRow && item.durationInSeconds > 0 ? (item.progressInSeconds / item.durationInSeconds) * 100 : 0;

            return (
              <div 
                key={item.id} 
                className="relative h-24 min-w-[160px] sm:h-28 sm:min-w-[200px] md:h-32 md:min-w-[240px] cursor-pointer transition duration-300 ease-out md:hover:scale-105 rounded-sm overflow-hidden bg-zinc-900 shadow-md hover:z-30 flex-shrink-0"
              >
                <img src={thumbnail} alt={content.title} className="object-cover h-full w-full" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent p-2 flex flex-col justify-end opacity-0 hover:opacity-100 transition duration-200">
                  <p className="text-xs font-bold truncate">{content.title}</p>
                  {content.maturityRating && (
                    <span className="text-[9px] bg-zinc-800 w-max text-zinc-300 px-1 rounded uppercase mt-0.5">
                      {content.maturityRating.name}
                    </span>
                  )}
                </div>
                {isHistoryRow && (
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-zinc-700 z-10">
                    <div className="h-full bg-red-600 transition-all" style={{ width: `${Math.min(progress, 100)}%` }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <button 
          onClick={() => handleScroll("right")}
          className="absolute top-0 bottom-0 right-0 z-40 m-auto h-full w-10 bg-black/50 opacity-0 group-hover/row:opacity-100 transition hover:bg-black/70 flex items-center justify-center text-white text-2xl font-bold"
        >
          ›
        </button>
      </div>
    </div>
  );
}