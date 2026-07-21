"use client";

import React, { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation"; // Import usePathname
import { Search, Film, Tv, ChevronLeft, ChevronRight } from "lucide-react";

interface PageHeaderProps {
  title: string;
  subtitle: string;
  searchPlaceholder: string;
  onSearch: (value: string) => void;
  searchValue: string;
}

export default function PageHeader({
  title,
  subtitle,
  searchPlaceholder,
  onSearch,
  searchValue,
}: PageHeaderProps) {
  const pathname = usePathname(); // Get current path
  
  // Automatically determine type based on the URL path
  const isTvPage = pathname.includes("/tv") || pathname.includes("/shows");
  
  const tabs = [
    "Trending Now", "Must-Binge Series", "Weekend Marathons", 
    "Short & Sweet", "Hidden Gems", "Critics' Choice", 
    "Coming Soon", "My Favorites"
  ];
  
  const [activeTab, setActiveTab] = useState(tabs[0]);
  const [indicatorStyle, setIndicatorStyle] = useState({ width: 0, left: 0 });
  const [scrollState, setScrollState] = useState({ left: true, right: true });
  
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const activeIndex = tabs.indexOf(activeTab);
    const element = tabsRef.current[activeIndex];
    if (element) {
      setIndicatorStyle({ width: element.offsetWidth, left: element.offsetLeft });
    }
    checkScroll();
  }, [activeTab]);

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
        {/* Dynamic Icon based on path */}
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
          <div className="iconWrapper"><Search size={25} /></div>
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
            {tabs.map((tab, index) => (
              <button
                key={tab}
                ref={(el) => { tabsRef.current[index] = el; }}
                className={`tab ${activeTab === tab ? "active" : ""}`}
                onClick={() => setActiveTab(tab)}
              >
                <span>{tab}</span>
              </button>
            ))}
            <div className="tabIndicator" style={{ width: indicatorStyle.width, left: indicatorStyle.left }} />
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
        .headerContainer { display: flex; align-items: flex-center; gap: 60px; margin-bottom: 20px; flex-wrap: wrap; }
        .titleSection { display: flex; align-items: center; gap: 24px; min-width: 300px; }
        .pageTitle { margin: 8px 0 0; color: white; font-size: 3.8rem; font-weight: 800; line-height: 1; }
        .pageSubtitle { margin-top: 14px; color: #9ca3af; font-size: 1rem; line-height: 1.7; max-width: 400px; }
        .rightSection { display: flex; flex-direction: column; flex: 1; min-width: 300px; padding-top: 10px; }
        .searchBox { position: relative; width: 100%; margin-bottom: 20px; }
        .iconWrapper { position: absolute; left: 20px; top: 50%; transform: translateY(-50%); color: #8b8b8b; pointer-events: none; z-index: 5; }
        .searchBox input { width: 100%; height: 50px; padding-left: 55px; padding-bottom: 3px; border-radius: 999px; border: 2px solid rgba(255,255,255,.2); background: rgba(255,255,255,.05); color: white; font-size: 15px; font-weight: 600; transition: 0.3s; }
        .searchBox input:focus { border-color: #E50914; outline: none; }
        .tabsWrapper { position: relative; display: flex; align-items: center; gap: 15px; }
        .tabsContainer { position: relative; display: flex; gap: 30px; flex: 1; overflow-x: auto; padding-bottom: 10px; scrollbar-width: none; }
        .tabsContainer::-webkit-scrollbar { display: none; }
        .tab { background: none; border: none; cursor: pointer; padding: 0; }
        .tab span { color: #8b8b8b; font-size: 1rem; font-weight: 500; padding-bottom: 8px; transition: .3s; white-space: nowrap; display: block; }
        .tab.active span { color: white; }
        .scrollBtn { background: rgba(255,255,255,0.05); color: white; border: 1px solid rgba(255,255,255,0.1); border-radius: 50%; width: 36px; height: 36px; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-bottom: 20px; transition: 0.3s; }
        .scrollBtn.inactive { opacity: 0.6; cursor: default; }
        .tabIndicator { position: absolute; bottom: 0; height: 3px; background: #E50914; transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1); border-radius: 2px; }
      `}</style>
    </div>
  );
}