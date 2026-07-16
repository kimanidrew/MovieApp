"use client";

import React, { useState, useRef, useEffect } from "react";
import { Search, Film } from "lucide-react";

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
  const tabs = ["Trending", "Recently Added"];
  const [activeTab, setActiveTab] = useState(tabs[0]);
  const [indicatorStyle, setIndicatorStyle] = useState({ width: 0, left: 0 });
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const activeIndex = tabs.indexOf(activeTab);
    const element = tabsRef.current[activeIndex];
    if (element) {
      setIndicatorStyle({
        width: element.offsetWidth,
        left: element.offsetLeft,
      });
    }
  }, [activeTab]);

  return (
    <div className="headerContainer">
      <div className="titleSection">
        <Film size={64} strokeWidth={1.3} className="movieIcon" />
        <div>
          <span className="pageLabel">Movie Collection</span>
          <h1 className="pageTitle">{title}</h1>
          <p className="pageSubtitle">{subtitle}</p>
        </div>
      </div>

      <div className="rightSection">
        <div className="searchWrapper">
          <div className="searchBox">
            <div className="iconWrapper">
              <Search size={20} />
            </div>
            <input
              type="text"
              value={searchValue}
              placeholder={searchPlaceholder}
              onChange={(e) => onSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="tabsContainer">
          {tabs.map((tab, index) => (
            <button
              key={tab}
              /* FIX: Added block body to ensure function returns void */
              ref={(el) => {
                tabsRef.current[index] = el;
              }}
              className={`tab ${activeTab === tab ? "active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
          <div className="tabIndicator" style={indicatorStyle} />
        </div>
      </div>

      <style jsx>{`
        .headerContainer { display: flex; justify-content: space-between; align-items: flex-start; gap: 60px; margin-bottom: 60px; flex-wrap: wrap; }
        
        .titleSection { display: flex; align-items: center; gap: 24px; }
        .movieIcon { color: white; transition: .3s; }
        .titleSection:hover .movieIcon { color: #E50914; transform: rotate(-8deg) scale(1.05); }
        .pageLabel { color: #E50914; text-transform: uppercase; letter-spacing: 4px; font-size: .8rem; font-weight: 700; }
        .pageTitle { margin: 8px 0 0; color: white; font-size: 3.8rem; font-weight: 800; line-height: 1; }
        .pageSubtitle { margin-top: 14px; color: #9ca3af; font-size: 1rem; line-height: 1.7; max-width: 400px; }

        .rightSection { display: flex; flex-direction: column; width: 380px; max-width: 100%; padding-top: 10px; }
        
        .searchBox { position: relative; width: 100%; }
        .iconWrapper { position: absolute; left: 20px; top: 50%; transform: translateY(-50%); color: #8b8b8b; pointer-events: none; z-index: 5; }
        .searchBox input { 
          display: block; width: 100%; height: 50px; box-sizing: border-box; 
          padding-left: 55px; padding-right: 20px; border-radius: 999px; 
          border: 1px solid rgba(255,255,255,.12); background: rgba(255,255,255,.05);
          backdrop-filter: blur(18px); color: white; font-size: 15px; transition: .25s;
        }
        .searchBox input:focus { outline: none; border-color: #E50914; background: rgba(255,255,255,.08); box-shadow: 0 0 0 4px rgba(229,9,20,.15); }

        .tabsContainer { 
          position: relative; display: flex; gap: 25px; 
          margin-top: 25px; justify-content: flex-end; padding-right: 10px;
        }
        .tab { background: none; border: none; color: #8b8b8b; font-size: 0.95rem; font-weight: 600; padding-bottom: 12px; cursor: pointer; transition: .3s; white-space: nowrap; }
        .tab.active { color: white; }
        .tabIndicator { position: absolute; bottom: 0; height: 3px; background: #E50914; transition: .3s cubic-bezier(0.4, 0, 0.2, 1); border-radius: 2px; }

        @media(max-width:1024px){ 
          .headerContainer { flex-direction: column; } 
          .rightSection { width: 100%; padding-top: 0; }
          .tabsContainer { justify-content: flex-start; padding-right: 0; }
        }
      `}</style>
    </div>
  );
}