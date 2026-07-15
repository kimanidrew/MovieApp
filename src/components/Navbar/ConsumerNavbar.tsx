"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import ThemePicker from "@/components/Theme/ThemePicker";

export default function ConsumerNavbar() {
  const { customerUser, activeProfile, logout } = useAuth();
  const pathname = usePathname();
  
  const [isScrolled, setIsScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Create a ref for the entire profile menu container
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setIsScrolled(window.scrollY > 30);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Listen for clicks outside the container to close the menu cleanly
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]);

  if (pathname.startsWith("/admin")) {
    return null;
  }

  if (!mounted) {
    return (
      <nav className="navbar">
        <div className="nav-container">
          <span className="nav-brand text-gradient">MFLIX</span>
        </div>
      </nav>
    );
  }

  const avatarSeed = activeProfile?.name === "Guest" ? "guest" : (activeProfile?.name || "user");
  const fallbackAvatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(avatarSeed)}`;

  return (
    <nav className={`navbar ${isScrolled ? "scrolled" : ""}`}>
      <div className="nav-container">
        <div className="nav-left">
          <Link href="/" className="nav-brand text-gradient">MFLIX</Link>
          {customerUser && (
            <ul className="nav-links">
              <li><Link href="/">Home</Link></li>
              {activeProfile ? (
                <>
                  <li><Link href="/tv">TV Shows</Link></li>
                  <li><Link href="/movies">Movies</Link></li>
                  <li><Link href="/my-list">My Collection</Link></li>
                </>
              ) : (
                <li><Link href="/profiles" className="profile-reminder">Select Profile to Stream</Link></li>
              )}
            </ul>
          )}
        </div>

        <div className="nav-right">
          <ThemePicker />
          {customerUser ? (
            <div className="profile-menu-container" ref={dropdownRef}>
              <button 
                className="profile-trigger-btn" 
                onClick={() => setDropdownOpen(!dropdownOpen)} 
              >
                <div 
                  className="profile-avatar-thumb" 
                  style={{ 
                    backgroundImage: `url(${activeProfile?.avatarUrl || fallbackAvatar})`, 
                    border: "2px solid #e50914" 
                  }} 
                />
                <div className="profile-meta-stack">
                  <span className="profile-name-label">
                    {activeProfile?.name || customerUser.email?.split("@")[0]}
                  </span>
                  <span className={activeProfile ? "badge-active" : "badge-pending"}>
                    {activeProfile ? "PROFILE ACTIVE" : "NO PROFILE"}
                  </span>
                </div>
                <span className="caret">▼</span>
              </button>

              {dropdownOpen && (
                <div className="dropdown-card">
                  <Link 
                    href="/profiles" 
                    className="dropdown-item link-accent"
                    onClick={() => setDropdownOpen(false)}
                  >
                    Switch Profiles
                  </Link>
                  <hr className="divider" />
                  <button 
                    onClick={() => {
                      setDropdownOpen(false);
                      logout("customer");
                    }} 
                    className="dropdown-item text-danger"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/login" className="login-btn">Sign In</Link>
          )}
        </div>
      </div>
      <style>{`
        .navbar { 
          position: fixed; 
          top: 1rem; 
          left: 50%; 
          transform: translate3d(-50%, -120%, 0); 
          width: 95%; 
          max-width: 1400px; 
          z-index: 1000; 
          
          /* Only transition colors and filters — NEVER layout sizes or positions */
          transition: transform 0s;
          
          animation: slide-down 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          will-change: transform, opacity;
        }
        
        /* Fixed-size base container with invisible border placeholder */
        .nav-container { 
          padding: 0.9rem 2rem; 
          display: flex; 
          justify-content: space-between; 
          align-items: center; 
          border-radius: 20px; 
          background: rgba(0, 0, 0, 0); 
          border: 1px solid rgba(255, 255, 255, 0);
          transition: background-color 0.35s ease, border-color 0.35s ease, backdrop-filter 0.35s ease;
        }
        
        /* Scrolled state merely changes visual properties, not sizing */
        .navbar.scrolled .nav-container { 
          background: rgba(0, 0, 0, 0.85); 
          backdrop-filter: blur(20px); 
          border-color: rgba(255, 255, 255, 0.1); 
        }
        
        .nav-left, .nav-links { display: flex; align-items: center; gap: 2.5rem; list-style: none; }
        .nav-brand { font-size: 1.6rem; font-weight: 900; color: #fff; text-decoration: none; }
        .nav-right { display: flex; align-items: center; gap: 1rem; }
        .nav-links a { font-size: 0.95rem; color: #b3b3b3; text-decoration: none; font-weight: 500; }
        .nav-links a:hover { color: #fff; }
        .profile-reminder { color: #e50914 !important; font-weight: 600; animation: pulse 2s infinite; }
        .profile-menu-container { position: relative; }
        .profile-trigger-btn { background: transparent; border: none; display: flex; align-items: center; gap: 12px; cursor: pointer; color: white; }
        .profile-avatar-thumb { width: 32px; height: 32px; border-radius: 4px; background-size: cover; }
        .profile-meta-stack { display: flex; flex-direction: column; align-items: flex-start; }
        .profile-name-label { font-size: 0.9rem; font-weight: 600; }
        .badge-active { font-size: 0.65rem; color: #2ed573; background: rgba(46, 213, 115, 0.15); padding: 1px 4px; border-radius: 3px; }
        .badge-pending { font-size: 0.65rem; color: #ff4757; background: rgba(255, 71, 87, 0.15); padding: 1px 4px; border-radius: 3px; }
        .dropdown-card { position: absolute; top: 45px; right: 0; background: #141414; border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 8px; width: 180px; padding: 6px 0; z-index: 1010; }
        .dropdown-item { padding: 10px 16px; color: #e5e5e5; text-decoration: none; font-size: 0.85rem; background: transparent; border: none; width: 100%; text-align: left; cursor: pointer; display: block;}
        .dropdown-item:hover { background: rgba(255, 255, 255, 0.1); }
        .link-accent { color: #2ed573; }
        .text-danger { color: #e50914; }
        .divider { border: 0; height: 1px; background: rgba(255, 255, 255, 0.1); margin: 4px 0; }
        .login-btn { background: #e50914; color: white; padding: 0.4rem 1rem; border-radius: 4px; text-decoration: none; font-size: 0.85rem; font-weight: 600; }
        
        @keyframes slide-down {
          from {
            transform: translate3d(-50%, -120%, 0);
            opacity: 0;
          }
          to {
            transform: translate3d(-50%, 0, 0);
            opacity: 1;
          }
        }
        
        @keyframes pulse { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }
      `}</style>
    </nav>
  );
}