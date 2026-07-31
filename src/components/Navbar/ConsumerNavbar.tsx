"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { User, Settings, CreditCard, LogOut, Search, X } from "lucide-react";

export default function ConsumerNavbar() {
  const { customerUser, activeProfile, logout } = useAuth();
  const pathname = usePathname();
  
  const [isScrolled, setIsScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setIsScrolled(window.scrollY > 0);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (searchQuery.length > 2) {
        try {
          const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
          const data = await res.json();
          setSearchResults(data);
        } catch (err) {
          console.error("Search failed", err);
        }
      } else {
        setSearchResults([]);
      }
    }, 300);
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
            <Link href="/" className="nav-brand text-gradient">MFLIX</Link>
            {!isSearchOpen && customerUser && (
              <ul className="nav-links">
                <li><Link href="/" className={isActive("/") ? "active" : ""}>Home</Link></li>
                {activeProfile ? (
                  <>
                    <li><Link href="/shows" className={isActive("/shows") ? "active" : ""}>Shows</Link></li>
                    <li><Link href="/movies" className={isActive("/movies") ? "active" : ""}>Movies</Link></li>
                  </>
                ) : (
                  <li><Link href="/profiles">Select Profile</Link></li>
                )}
              </ul>
            )}
          </div>

          {/* MIDDLE: Search Box */}
          {isSearchOpen && (
            <div className="search-active-box">
              <Search size={18} className="search-icon-internal" />
              <input
                type="text"
                placeholder="Search titles, people, genres"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
              <button className="search-toggle-btn" onClick={() => { setIsSearchOpen(false); setSearchQuery(""); }}>
                <X size={20} />
              </button>
              
              {searchResults.length > 0 && (
                <div className="search-dropdown">
                  {searchResults.map((item) => (
                    <Link href={`/${item.type === 'MOVIE' ? 'movies' : 'shows'}/${item.id}`} key={item.id} className="search-item" onClick={() => setIsSearchOpen(false)}>
                      <img src={item.thumbnailUrl} alt={item.title} />
                      <span>{item.title}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* RIGHT: Search Toggle + Profile */}
          <div className="nav-right">
            {!isSearchOpen && (
              <button className="search-toggle-btn" onClick={() => setIsSearchOpen(true)}>
                <Search size={20} />
              </button>
            )}

            {customerUser ? (
              <div className="profile-menu-container" ref={dropdownRef}>
                <button className="profile-trigger-btn" onClick={() => setDropdownOpen(!dropdownOpen)}>
                  <div className="profile-avatar-thumb" style={{ backgroundImage: `url(${activeProfile?.avatarUrl || fallbackAvatar})` }} />
                </button>
                {dropdownOpen && (
                  <div className="dropdown-card">
                    <Link href="/profiles" className="dropdown-item" onClick={() => setDropdownOpen(false)}><User size={16} /> Switch Profiles</Link>
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
        .navbar { position: fixed; top: 1rem; left: 50%; transform: translateX(-50%); width: 95%; max-width: 1400px; z-index: 1000; }
        
        .nav-container { padding: 0.9rem 2rem; display: flex; justify-content: space-between; align-items: center; border-radius: 20px; background: transparent; border: 1px solid transparent; transition: all 0.35s ease; height: 60px; }
        .navbar.scrolled .nav-container { background: rgba(0, 0, 0, 0.85); backdrop-filter: blur(20px); border-color: rgba(255, 255, 255, 0.1); }
        
        .nav-left { display: flex; align-items: center; gap: 2.5rem; flex-shrink: 0; }
        
        .text-gradient { background: linear-gradient(90deg, #e50914, #ff7575); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: 900; font-size: 2rem; text-decoration: none; }
        
        .nav-links { display: flex; list-style: none; gap: 2rem; }
        .nav-links a { color: #b3b3b3; text-decoration: none; font-size: 0.95rem; transition: 0.3s; padding-bottom: 4px; }
        .nav-links a:hover { color: #fff; }
        .nav-links a.active { color: #fff; border-bottom: 2px solid #e50914; }
        
        .search-active-box { flex-grow: 1; margin: 0 2rem; display: flex; align-items: center; background: rgba(255,255,255,0.05); padding: 0 1rem; border-radius: 8px; position: relative; gap: 10px; }
        .search-active-box input { flex-grow: 1; background: transparent; border: none; color: white; padding: 10px; outline: none; font-size: 1rem; }
        .search-icon-internal { color: #888; }
        
        .search-toggle-btn { background: transparent; border: none; color: white; cursor: pointer; display: flex; align-items: center; }
        
        .search-dropdown { position: absolute; top: 110%; left: 0; width: 100%; background: #141414; border: 1px solid #333; border-radius: 8px; padding: 10px; max-height: 300px; overflow-y: auto; }
        .search-item { display: flex; align-items: center; gap: 10px; padding: 10px; color: white; text-decoration: none; }
        .search-item img { width: 50px; height: 30px; object-fit: cover; }
        
        .nav-right { display: flex; align-items: center; gap: 1.5rem; flex-shrink: 0; }
        .profile-trigger-btn { background: transparent; border: none; display: flex; align-items: center; cursor: pointer; }
        .profile-avatar-thumb { width: 32px; height: 32px; border-radius: 4px; background-size: cover; }
        
        .dropdown-card { position: absolute; top: 70px; right: 2rem; background: #141414; border: 1px solid #333; border-radius: 8px; padding: 10px; width: 200px; }
        .dropdown-item { padding: 8px; color: white; text-decoration: none; display: flex; align-items: center; gap: 10px; cursor: pointer; background: none; border: none; width: 100%; }
        .text-danger { color: #e50914; }
      `}</style>
    </nav>
  );
}