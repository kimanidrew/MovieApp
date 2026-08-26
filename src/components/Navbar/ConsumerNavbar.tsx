"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { User, Settings, LogOut, Search, X } from "lucide-react";

export default function ConsumerNavbar() {
  const { customerUser, activeProfile, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  
  const [isScrolled, setIsScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setIsScrolled(window.scrollY > 0);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (searchQuery.trim().length > 1) {
        try {
          const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
          const data = await res.json();
          setSearchResults(data.results || []);
        } catch (err) {
          console.error("Search failed", err);
        }
      } else {
        setSearchResults([]);
      }
    }, 250);
    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearchOpen(false);
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const isActive = (path: string) => pathname === path;
  if (pathname.startsWith("/admin")) return null;

  const avatarSeed = activeProfile?.name === "Guest" ? "guest" : (activeProfile?.name || "user");
  const fallbackAvatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(avatarSeed)}`;

  return (
    <nav className={`navbar ${isScrolled ? "scrolled" : ""}`}>
      {mounted && (
        <div className="nav-container">
          {/* LEFT: Brand & Links */}
          <div className="nav-left">
            <Link href="/" className="nav-brand">MFLIX</Link>
            {!isSearchOpen && customerUser && (
              <ul className="nav-links">
                {activeProfile && (
                  <>
                    <li><Link href="/" className={isActive("/") ? "active" : ""}>Home</Link></li>
                    <li><Link href="/shows" className={isActive("/shows") ? "active" : ""}>Shows</Link></li>
                    <li><Link href="/movies" className={isActive("/movies") ? "active" : ""}>Movies</Link></li>
                    <li><Link href="/my-list" className={isActive("/my-list") ? "active" : ""}>My List</Link></li>
                  </>
                )}
              </ul>
            )}
          </div>

          {/* MIDDLE: Live Search Box */}
          {isSearchOpen && (
            <form onSubmit={handleSearchSubmit} className="search-active-box">
              <Search size={18} className="search-icon-internal" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search movies, TV shows, genres..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
              <button
                type="button"
                className="search-toggle-btn"
                onClick={() => { setIsSearchOpen(false); setSearchQuery(""); setSearchResults([]); }}
                aria-label="Close search"
              >
                <X size={20} />
              </button>
              
              {searchResults.length > 0 && (
                <div className="search-dropdown">
                  {searchResults.slice(0, 8).map((item, idx) => {
                    let href = "/movies/" + item.id;
                    const ct = item.contentType || item.type || (item.isTvShow ? "SHOW" : "MOVIE");
                    if (ct === "SHOW" || item.isTvShow) href = "/shows/" + item.id;
                    else if (ct === "GENRE") href = "/genre/" + (item.slug || (item.title || "").toLowerCase());

                    const isGenre = ct === "GENRE";
                    return (
                      <Link
                        href={href}
                        key={item.id + "-" + idx}
                        className="search-item"
                        style={{ animationDelay: `${idx * 0.04}s` }}
                        onClick={() => { setIsSearchOpen(false); setSearchQuery(""); }}
                      >
                        {item.thumbnailUrl ? (
                          <img src={item.thumbnailUrl} alt={item.title} className="search-thumb" />
                        ) : (
                          <div className={`search-thumb-fallback ${isGenre ? "genre" : ""}`}>
                            {isGenre ? "G" : item.isTvShow ? "TV" : "M"}
                          </div>
                        )}
                        <div className="search-item-info">
                          <span className="search-item-title">{item.title}</span>
                          <span className="search-item-meta">
                            <span className={`type-tag ${ct.toLowerCase()}`}>{ct}</span>
                            {item.releaseYear ? ` · ${item.releaseYear}` : ""}
                            {item.rating ? ` · ★ ${item.rating.toFixed(1)}` : ""}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                  <button
                    type="submit"
                    className="view-all-results-btn"
                  >
                    View all results for &quot;{searchQuery}&quot; →
                  </button>
                </div>
              )}
            </form>
          )}

          {/* RIGHT: Search Toggle + Profile */}
          <div className="nav-right">
            {!isSearchOpen && activeProfile && (
              <button className="search-toggle-btn" onClick={() => setIsSearchOpen(true)} aria-label="Open search">
                <Search size={20} />
              </button>
            )}

            {customerUser ? (
              <div className="profile-menu-container" ref={dropdownRef}>
                <button className="profile-trigger-btn" onClick={() => setDropdownOpen(!dropdownOpen)} aria-label="Profile menu">
                  <div className="profile-avatar-thumb" style={{ backgroundImage: `url(${activeProfile?.avatarUrl || fallbackAvatar})` }} />
                </button>
                {dropdownOpen && (
                  <div className="dropdown-card">
                    <Link href="/profiles" className="dropdown-item" onClick={() => setDropdownOpen(false)}><User size={16} /> Switch Profiles</Link>
                    <Link href="/creator" className="dropdown-item" onClick={() => setDropdownOpen(false)}><Settings size={16} /> Creator Studio</Link>
                    <button onClick={() => logout("customer")} className="dropdown-item text-danger"><LogOut size={16} /> Sign Out</button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login" className="login-btn">Sign In</Link>
            )}
          </div>
        </div>
      )}

      <style>{`
        .navbar {
          position: fixed;
          top: 1rem;
          left: 50%;
          transform: translateX(-50%);
          width: 95%;
          max-width: 1400px;
          z-index: 1000;
          transition: all 0.35s ease;
        }
        
        .nav-container {
          padding: 0.9rem 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-radius: 10px;
          background: transparent;
          border: 1px solid transparent;
          transition: all 0.35s ease;
          height: 60px;
        }

        .navbar.scrolled .nav-container {
          background: rgba(0, 0, 0, 0.88);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border-color: rgba(255, 255, 255, 0.12);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        }
        
        .nav-left { display: flex; align-items: center; gap: 2.5rem; flex-shrink: 0; }
        
        .nav-brand {
          background: linear-gradient(90deg, #e50914, #ff7575);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          font-weight: 900;
          font-size: 2rem;
          text-decoration: none;
          letter-spacing: -0.5px;
        }
        
        .nav-links { display: flex; list-style: none; gap: 2rem; margin: 0; padding: 0; }
        .nav-links a {
          color: #b3b3b3;
          text-decoration: none;
          font-size: 0.95rem;
          transition: color 0.25s ease;
          padding-bottom: 4px;
        }
        .nav-links a:hover { color: #fff; }
        .nav-links a.active { color: #fff; border-bottom: 2px solid #e50914; font-weight: 600; }
        
        .search-active-box {
          flex-grow: 1;
          margin: 0 2rem;
          display: flex;
          align-items: center;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.18);
          padding: 0 1rem;
          border-radius: 12px;
          position: relative;
          gap: 10px;
          backdrop-filter: blur(12px);
          animation: expandSearch 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        @keyframes expandSearch {
          from { opacity: 0; transform: scaleX(0.9); }
          to { opacity: 1; transform: scaleX(1); }
        }

        .search-active-box input {
          flex-grow: 1;
          background: transparent;
          border: none;
          color: white;
          padding: 10px 0;
          outline: none;
          font-size: 0.95rem;
        }
        :global(.search-icon-internal) { color: #aaa; flex-shrink: 0; }
        
        .search-toggle-btn {
          background: transparent;
          border: none;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          transition: transform 0.2s ease;
        }
        .search-toggle-btn:hover { transform: scale(1.1); color: #e50914; }
        
        .search-dropdown {
          position: absolute;
          top: 115%;
          left: 0;
          width: 100%;
          background: rgba(18, 18, 18, 0.96);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 12px;
          padding: 8px;
          max-height: 380px;
          overflow-y: auto;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.8);
          z-index: 1001;
          animation: dropdownFadeIn 0.25s ease;
        }

        @keyframes dropdownFadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .search-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 12px;
          color: white;
          text-decoration: none;
          border-radius: 8px;
          transition: background 0.2s ease;
        }
        .search-item:hover { background: rgba(255, 255, 255, 0.1); }

        .search-thumb { width: 50px; height: 35px; object-fit: cover; border-radius: 6px; flex-shrink: 0; }
        .search-thumb-fallback {
          width: 50px; height: 35px; background: rgba(255,255,255,0.1);
          border-radius: 6px; display: flex; align-items: center;
          justify-content: center; font-size: 0.75rem; color: #aaa; flex-shrink: 0;
        }

        .search-item-info { display: flex; flex-direction: column; gap: 2px; overflow: hidden; }
        .search-item-title { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 0.9rem; font-weight: 500; }
        .search-item-meta { font-size: 0.72rem; color: #888; display: flex; align-items: center; gap: 4px; }
        
        .type-tag {
          font-size: 0.6rem;
          font-weight: 700;
          padding: 1px 5px;
          border-radius: 4px;
          text-transform: uppercase;
        }
        .type-tag.movie { background: rgba(59, 130, 246, 0.2); color: #60a5fa; }
        .type-tag.show { background: rgba(229, 9, 20, 0.2); color: #f87171; }
        .type-tag.genre { background: rgba(251, 191, 36, 0.2); color: #fbbf24; }

        .view-all-results-btn {
          width: 100%;
          padding: 10px;
          margin-top: 4px;
          background: rgba(229, 9, 20, 0.15);
          border: 1px solid rgba(229, 9, 20, 0.3);
          color: #e50914;
          font-size: 0.82rem;
          font-weight: 600;
          border-radius: 8px;
          cursor: pointer;
          text-align: center;
          transition: all 0.2s ease;
        }
        .view-all-results-btn:hover { background: #e50914; color: #fff; }
        
        .nav-right { display: flex; align-items: center; gap: 1.5rem; flex-shrink: 0; }
        .profile-trigger-btn { background: transparent; border: none; display: flex; align-items: center; cursor: pointer; }
        .profile-avatar-thumb { width: 32px; height: 32px; border-radius: 6px; background-size: cover; border: 1px solid rgba(255,255,255,0.2); }
        
        .dropdown-card {
          position: absolute; top: 70px; right: 2rem;
          background: rgba(20, 20, 20, 0.95); backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 12px;
          padding: 8px; width: 220px; box-shadow: 0 10px 30px rgba(0,0,0,0.7);
        }
        .dropdown-item {
          padding: 10px 12px; color: white; text-decoration: none;
          display: flex; align-items: center; gap: 10px; cursor: pointer;
          background: none; border: none; width: 100%; font-size: 0.85rem;
          border-radius: 6px; transition: background 0.2s ease;
        }
        .dropdown-item:hover { background: rgba(255,255,255,0.1); }
        .text-danger { color: #f87171; }
        .login-btn {
          background: #e50914; color: #fff; padding: 6px 16px;
          border-radius: 6px; font-size: 0.85rem; font-weight: 600;
          text-decoration: none; transition: all 0.2s ease;
        }
        .login-btn:hover { background: #ff0f1a; transform: scale(1.05); }
      `}</style>
    </nav>
  );
}