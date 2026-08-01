"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Film, Tv } from "lucide-react";
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
  pageType: "movies" | "shows" | "home";
}

export default function PageHeader({
  categories,
  selectedTabs = [],
  onToggleTab,
  title,
  pageType,
}: PageHeaderProps) {
  const [scrollState, setScrollState] = useState({ left: false, right: true });
  const [isGenreDropdownOpen, setIsGenreDropdownOpen] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const collectionTabs = categories.filter((cat) => !isGenre(cat));
  const genreList = categories.filter((cat) => isGenre(cat));
  
  const selectedGenreCount = selectedTabs.filter((tab) => isGenre(tab)).length;

  useEffect(() => {
    checkScroll();
    
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsGenreDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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
      <div className="tabsWrapper">
        {/* Title Section */}
        <div className="titleSection">
          {pageType === "movies" ? (
            <Film size={50} strokeWidth={2} />
          ) : (
            <Tv size={50} strokeWidth={2} />
          )}
          {/* textGroup aligned to bottom, items inside centered */}
          <div className="textGroup">
            <h2>{title}</h2>
          </div>
        </div>

        {scrollState.left && (
          <button className="scrollBtn left" onClick={() => scrollTabs('left')}>
            <ChevronLeft size={20} />
          </button>
        )}
        
        {/* Genre Wrapper */}
        <div className="genreWrapper" ref={dropdownRef}>
            <button 
              className={`tab genreTrigger ${isGenreDropdownOpen ? "active" : ""}`}
              onClick={() => setIsGenreDropdownOpen(!isGenreDropdownOpen)}
            >
              <span>Genres {selectedGenreCount > 0 && `(${selectedGenreCount})`}</span>
              <div className="chevronIcon">
                {isGenreDropdownOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
            </button>

            {isGenreDropdownOpen && (
              <div className="genreDropdown">
                <div className="dropdownHeader">Select Genres</div>
                <div className="genreGrid">
                    {genreList.map((genre) => (
                    <button
                        key={genre}
                        className={`genreOption ${selectedTabs.includes(genre) ? "active" : ""}`}
                        onClick={() => onToggleTab(genre)}
                    >
                        {genre}
                    </button>
                    ))}
                </div>
              </div>
            )}
        </div>

        {/* Collection Tabs */}
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
          {collectionTabs.map((tab) => (
            <button
              key={tab}
              className={`tab ${selectedTabs.includes(tab) ? "active" : ""}`}
              onClick={() => onToggleTab(tab)}
            >
              <span>{tab}</span>
            </button>
          ))}
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

        {scrollState.right && (
          <button className="scrollBtn right" onClick={() => scrollTabs('right')}>
            <ChevronRight size={20} />
          </button>
        )}
      </div>

      <style jsx>{`
        .headerContainer { margin-bottom: 20px; }
        
        .tabsWrapper { 
          position: relative; display: flex; align-items: flex-end; gap: 15px; width: 100%; min-height: 70px; 
        }
        
        .titleSection { 
          display: flex; align-items: flex-end; gap: 15px; color: white; margin-right: 15px; flex-shrink: 0; padding-bottom: 5px;
        }
        
        /* Forces the group to bottom, but items inside align-items: center */
        .textGroup { display: flex; align-items: center; align-self: flex-end; gap: 10px; }
        
        .titleSection h2 { margin: 0; font-size: 2.5rem; font-weight: 700; white-space: nowrap; line-height: 1.1; }
        .titleChevron { color: #555; }
        
        .genreWrapper { position: relative; flex-shrink: 0; padding-bottom: 5px; }
        .genreTrigger { display: flex; align-items: center; gap: 8px; }
        .chevronIcon { display: flex; align-items: center; color: #888; }
        .genreTrigger.active .chevronIcon { color: white; }
        
        .genreDropdown { 
          position: absolute; top: 110%; left: 0; background: #141414; border: 1px solid rgba(255, 255, 255, 0.15); 
          border-radius: 16px; padding: 16px; z-index: 1000; min-width: 320px; 
          backdrop-filter: blur(20px); box-shadow: 0 20px 40px rgba(0,0,0,0.6);
        }
        .dropdownHeader { color: #888; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; padding-left: 4px; }
        .genreGrid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
        
        .genreOption { 
          background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); 
          color: #ccc; padding: 8px 12px; cursor: pointer; text-align: center; 
          border-radius: 999px; font-size: 0.85rem; transition: all 0.2s;
        }
        .genreOption:hover { background: rgba(255, 255, 255, 0.1); color: white; }
        .genreOption.active { 
            background: #3b82f6; border-color: #3b82f6; color: white; font-weight: 600; 
        }
        
        .tabsContainer { position: relative; display: flex; gap: 10px; flex: 1; overflow-x: auto; padding-bottom: 5px; scrollbar-width: none; align-items: flex-end; }
        .tabsContainer::-webkit-scrollbar { display: none; }
        
        .tab { 
          background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(8px); border: 1px solid rgba(255, 255, 255, 0.1); 
          border-radius: 999px; padding: 10px 20px; cursor: pointer; white-space: nowrap; transition: all 0.3s ease; 
        }
        .tab span { color: #ccc; font-size: 0.9rem; font-weight: 500; transition: color 0.2s; }
        
        .tab.active { background: linear-gradient(to right, #3b82f6, #ec4899); border-color: #3b82f6; }
        .tab.active span { color: white; }
        .tab:hover { background: rgba(255, 255, 255, 0.1); }
        .tab.active:hover { filter: brightness(1.15); }
        
        .scrollBtn { 
          background: rgba(255,255,255,0.05); color: white; border: 1px solid rgba(255,255,255,0.1); 
          border-radius: 50%; width: 36px; height: 36px; cursor: pointer; display: flex; align-items: center; 
          justify-content: center; flex-shrink: 0; z-index: 10; margin-bottom: 7px;
        }
      `}</style>
    </div>
  );
}