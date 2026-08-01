"use client";

import React, { useMemo, useState, useEffect } from "react";
import Image from "next/image";
import PageHeader from "@/components/PageHeader";
import VideoGrid from "@/components/Grids/VideoGrid";
import Hero from "./Hero";
import { Video } from "@/types/video";

interface ContentPageClientProps {
  items: Video[];
  categories: string[];
  type: "movies" | "shows" | "home";
}

/**
 * Infinite Carousel Spotlight Component
 * Uses CSS Keyframes for slow, smooth 3s entry/exit animation
 */
function Spotlight({ items, excludedId }: { items: Video[]; excludedId: string | undefined }) {
  const [index, setIndex] = useState(0);

  const availableItems = useMemo(() => 
    items.filter((i) => i.id !== excludedId), 
  [items, excludedId]);

  useEffect(() => {
    if (availableItems.length <= 1) return;

    // Interval must be longer than the 3s animation to allow completion
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % availableItems.length);
    }, 8000); 

    return () => clearInterval(interval);
  }, [availableItems.length]);

  const featured = availableItems[index];

  if (!featured) return null;

  return (
    <div className="spotlightCard">
      {/* 
        Key is updated on index change to trigger the CSS animation 
        for the new item entering 
      */}
      <div key={featured.id} className="carouselContent">
        {featured.thumbnailUrl ? (
          <Image 
            src={featured.thumbnailUrl} 
            alt={featured.title} 
            fill
            sizes="(max-width: 1024px) 100vw, 25vw"
            className="bgImage object-cover opacity-80"
            style={{borderRadius: "10px"}}
            priority
          />
        ) : (
          <div className="bgImage fallback" />
        )}
        
        <div className="overlay">
          <div className="label">Featured Spotlight</div>
          <h3>{featured.title}</h3>
          <p>{featured.description?.slice(0, 60)}...</p>
          <button className="watchButton">Watch Now</button>
        </div>
      </div>
    </div>
  );
}

export default function ContentPageClient({ items, categories, type }: ContentPageClientProps) {
  const [selectedTabs, setSelectedTabs] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [heroItem, setHeroItem] = useState<Video | null>(null);

  useEffect(() => {
    if (items.length > 0 && !heroItem) {
      setHeroItem(items[Math.floor(Math.random() * items.length)]);
    }
  }, [items, heroItem]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(search.toLowerCase()));
      
      const matchesCategory = selectedCategory === "All" || item.categories.includes(selectedCategory);
      const matchesTabs = selectedTabs.every(tab => item.categories.includes(tab));

      return matchesSearch && matchesCategory && matchesTabs;
    });
  }, [items, search, selectedCategory, selectedTabs]);

  const toggleTab = (tab: string) => {
    setSelectedTabs(prev => 
      prev.includes(tab) ? prev.filter(t => t !== tab) : [...prev, tab]
    );
  };

  return (
    <section className="pageContainer">
      <PageHeader 
        title={type === "movies" ? "Movies" : "Shows"}
        subtitle={type === "movies" ? "Browse our premium movie library." : "Browse our premium TV series library."}
        searchPlaceholder={`Search ${type === "movies" ? "movies" : "shows"}, artists e.t.c`}
        searchValue={search}
        onSearch={setSearch}
        categories={categories}
        selectedTabs={selectedTabs}
        onToggleTab={toggleTab}
        pageType={type}
      />

      <div className="contentArea">
        <div className="heroSection">
          <div className="mainHero">
            <Hero 
              pageType={type} 
              selectedCategories={selectedTabs} 
              featuredItem={heroItem} 
            />
          </div>
          <div className="sideSpotlight">
            <Spotlight items={items} excludedId={heroItem?.id} />
          </div>
        </div>
        
        <VideoGrid videos={filteredItems} type={type} />
      </div>

      <style jsx global>{`
        .pageContainer { flex: 1; padding-top: 70px; padding-bottom: 60px; padding-inline: 3%; }
        
        .heroSection {
          display: flex;
          gap: 20px;
          margin-bottom: 40px;
          width: 100%;
          height: 450px; 
        }
        
        .mainHero { width: 75%; height: 100%; border-radius: 20px; overflow: hidden; }
        .sideSpotlight { width: 25%; height: 100%; }

        .spotlightCard {
          position: relative;
          background: #111;
          height: 100%;
          border-radius: 10px;
          overflow: hidden;
        }

        .carouselContent {
          position: relative;
          width: 100%;
          height: 100%;
          /* 3s duration, ease-in-out for smooth movement */
          animation: transitionEffect 3s ease-in-out;
        }

        @keyframes transitionEffect {
          0% { opacity: 0; transform: scale(1.05); }
          50% { opacity: 1; }
          100% { opacity: 1; transform: scale(1); }
        }
        
        .bgImage {
          object-fit: cover;
          opacity: 0.8;
        }

        .overlay {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 24px;
          background: linear-gradient(to top, rgba(0,0,0,0.95), transparent);
          display: flex;
          flex-direction: column;
          gap: 8px;
          z-index: 1;
        }

        .label { color: #e50914; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; }
        .spotlightCard h3 { margin: 0; font-size: 1.4rem; color: white; font-weight: 700; }
        .spotlightCard p { margin: 0; font-size: 0.9rem; color: #ccc; line-height: 1.4; }
        
        .watchButton {
          margin-top: 10px;
          background: white;
          color: black;
          border: none;
          padding: 10px 0;
          border-radius: 6px;
          font-weight: bold;
          cursor: pointer;
          transition: background 0.3s;
        }
        .watchButton:hover { background: #e50914; color: white; }

        @media(max-width: 1024px) {
          .heroSection { flex-direction: column; height: auto; }
          .mainHero { width: 100%; height: 450px; }
          .sideSpotlight { width: 100%; height: 350px; }
        }
      `}</style>
    </section>
  );
}