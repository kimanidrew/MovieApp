"use client";

import React, { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Search, Film, Tv, ChevronLeft, ChevronRight } from "lucide-react";
import { isGenre } from "@/utils/category-utils";

interface PageHeaderProps {
  title: string;
  subtitle: string;
  searchPlaceholder: string;
  onSearch: (value: string) => void;
  searchValue: string;
  categories: string[];
  selectedTabs: string[];
  onToggleTab: (tab: string) => void;
}

export default function PageHeader({
  title,
  subtitle,
  searchPlaceholder,
  onSearch,
  searchValue,
  categories,
  selectedTabs,
  onToggleTab,
}: PageHeaderProps) {
  const pathname = usePathname();
  
  const isTvPage = pathname.includes("/tv") || pathname.includes("/shows");
  
  const collectionTabs = categories.filter(cat => !isGenre(cat));

  const [scrollState, setScrollState] = useState({ left: true, right: true });

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkScroll();
  }, []);

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setScrollState({
        left: scrollLeft > 0,
        right: scrollLeft < scrollWidth - clientWidth - 1,
      });
    }
  };


  const scrollTabs = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ 
        left: direction === 'left' ? -250 : 250, 
        behavior: 'smooth' 
      });
    }
  };

  return (
    <div className="headerContainer">
      <div className="titleSection">
        {isTvPage ? (
          <Tv size={80} strokeWidth={2} />
        ) : (
          <Film size={80} strokeWidth={2} className="movieIcon" />
        )}
        <div>
          <h1 className="pageTitle">{title}</h1>
        </div>
      </div>

      <div className="rightSection">
        <div className="searchBox">
          <div className="iconWrapper"><Search size={20} /></div>
          <input
            type="text"
            value={searchValue}
            placeholder={searchPlaceholder}
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>

        <div className="tabsWrapper">
          <button 
            className={`scrollBtn left ${!scrollState.left ? 'inactive' : ''}`} 
            onClick={() => scrollTabs('left')}
            disabled={!scrollState.left}
          >
            <ChevronLeft size={20} />
          </button>
          
          <div className="tabsContainer" ref={scrollContainerRef} onScroll={checkScroll}>
            {collectionTabs.map((tab) => (
              <button
                key={tab}
                className={`tab ${selectedTabs.includes(tab) ? "active" : ""}`}
                onClick={() => onToggleTab(tab)}
              >
                <span>{tab}</span>
              </button>
            ))}
          </div>

          <button 
            className={`scrollBtn right ${!scrollState.right ? 'inactive' : ''}`} 
            onClick={() => scrollTabs('right')}
            disabled={!scrollState.right}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <style jsx>{`
        .headerContainer { display: flex; align-items: center; gap: 60px; margin-bottom: 20px; flex-wrap: wrap; }
        .titleSection { display: flex; align-items: center; gap: 24px; min-width: 300px; }
        .pageTitle { margin: 8px 0 0; color: white; font-size: 3.8rem; font-weight: 800; line-height: 1; }
        .rightSection { display: flex; flex-direction: column; flex: 1; min-width: 300px; padding-top: 10px; }
        .searchBox { position: relative; width: 100%; margin-bottom: 10px; }
        .iconWrapper { position: absolute; left: 20px; top: 50%; transform: translateY(-50%); color: #8b8b8b; pointer-events: none; z-index: 5; }
        .searchBox input { width: 100%; height: 50px; padding-left: 55px; padding-bottom: 3px; border-radius: 999px; border: 2px solid rgba(255,255,255,.2); background: rgba(255,255,255,.05); color: white; font-size: 15px; font-weight: 600; transition: 0.3s; }
        .searchBox input:focus { border-color: #E50914; outline: none; }
        
        /* Updated Tab Styles */
        .tabsWrapper { position: relative; display: flex; align-items: center; gap: 15px; }
        .tabsContainer { position: relative; display: flex; gap: 10px; flex: 1; overflow-x: auto; padding: 5px; scrollbar-width: none; align-items: center; }
        .tabsContainer::-webkit-scrollbar { display: none; }
        
        .tab { 
          background: rgba(255, 255, 255, 0.05); 
          backdrop-filter: blur(8px); 
          border: 1px solid rgba(255, 255, 255, 0.1); 
          border-radius: 999px; 
          padding: 10px 20px; 
          cursor: pointer; 
          white-space: nowrap; 
          transition: all 0.3s ease; 
        }
        .tab span { color: #ccc; font-size: 0.9rem; font-weight: 500; transition: 0.3s; }
        
        .tab.active { 
          background: rgba(229, 9, 20, 0.4); 
          border-color: rgba(229, 9, 20, 0.6); 
        }
        .tab.active span { color: white; }
        .tab:hover { background: rgba(255, 255, 255, 0.1); }
        .tab.active:hover { background: rgba(229, 9, 20, 0.5); }
        
        .scrollBtn { background: rgba(255,255,255,0.05); color: white; border: 1px solid rgba(255,255,255,0.1); border-radius: 50%; width: 36px; height: 36px; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: 0.3s; }
        .scrollBtn.inactive { opacity: 0.6; cursor: default; }
      `}</style>
    </div>
  );
}