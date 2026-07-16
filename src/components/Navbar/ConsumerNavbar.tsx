"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import ThemePicker from "@/components/Theme/ThemePicker";
import { User, Settings, CreditCard, LogOut } from "lucide-react";

export default function ConsumerNavbar() {
  const { customerUser, activeProfile, logout } = useAuth();
  const pathname = usePathname();
  
  const [isScrolled, setIsScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setIsScrolled(window.scrollY > 30);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
  if (!mounted) return <nav className="navbar"><div className="nav-container"><span className="nav-brand">MFLIX</span></div></nav>;

  const avatarSeed = activeProfile?.name === "Guest" ? "guest" : (activeProfile?.name || "user");
  const fallbackAvatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(avatarSeed)}`;

  return (
    <nav className={`navbar ${isScrolled ? "scrolled" : ""}`}>
      <div className="nav-container">
        <div className="nav-left">
          <Link href="/" className="nav-brand text-gradient">MFLIX</Link>
          {customerUser && (
            <ul className="nav-links">
              <li><Link href="/" className={isActive("/") ? "active" : ""}>Home</Link></li>
              {activeProfile ? (
                <>
                  <li><Link href="/tv" className={isActive("/tv") ? "active" : ""}>TV Shows</Link></li>
                  <li><Link href="/movies" className={isActive("/movies") ? "active" : ""}>Movies</Link></li>
                  <li><Link href="/my-list" className={isActive("/my-list") ? "active" : ""}>My Collection</Link></li>
                </>
              ) : (
                <li><Link href="/profiles" className="profile-reminder">Select Profile</Link></li>
              )}
            </ul>
          )}
        </div>

        <div className="nav-right">
          <ThemePicker />
          {customerUser ? (
            <div className="profile-menu-container" ref={dropdownRef}>
              <button className="profile-trigger-btn" onClick={() => setDropdownOpen(!dropdownOpen)}>
                <span className="profile-name-label">{activeProfile?.name || customerUser.email?.split("@")[0]}</span>
                <div className="profile-avatar-thumb" style={{ backgroundImage: `url(${activeProfile?.avatarUrl || fallbackAvatar})` }} />
              </button>

              {dropdownOpen && (
                <div className="dropdown-card">
                  <Link href="/profiles" className="dropdown-item" onClick={() => setDropdownOpen(false)}><User size={16} /> Switch Profiles</Link>
                  <Link href="/profiles/manage" className="dropdown-item" onClick={() => setDropdownOpen(false)}><Settings size={16} /> Manage Profiles</Link>
                  <Link href="/account" className="dropdown-item" onClick={() => setDropdownOpen(false)}><CreditCard size={16} /> Account Settings</Link>
                  <hr className="divider" />
                  <button onClick={() => { setDropdownOpen(false); logout("customer"); }} className="dropdown-item text-danger"><LogOut size={16} /> Sign Out</button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/login" className="login-btn">Sign In</Link>
          )}
        </div>
      </div>
      <style>{`
        .navbar { position: fixed; top: 1rem; left: 50%; transform: translate3d(-50%, -120%, 0); width: 95%; max-width: 1400px; z-index: 1000; transition: transform 0s; animation: slide-down 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .nav-container { padding: 0.9rem 2rem; display: flex; justify-content: space-between; align-items: center; border-radius: 20px; background: rgba(0, 0, 0, 0); border: 1px solid rgba(255, 255, 255, 0); transition: all 0.35s ease; }
        .navbar.scrolled .nav-container { background: rgba(0, 0, 0, 0.85); backdrop-filter: blur(20px); border-color: rgba(255, 255, 255, 0.1); }
        .nav-left, .nav-links { display: flex; align-items: center; gap: 2.5rem; list-style: none; }
        .nav-brand { font-size: 1.6rem; font-weight: 900; color: #fff; text-decoration: none; }
        .nav-links a { font-size: 0.95rem; color: #b3b3b3; text-decoration: none; font-weight: 500; transition: color 0.3s ease; }
        .nav-links a:hover, .nav-links a.active { color: #fff; }
        
        .nav-right { display: flex; align-items: center; gap: 1.5rem; }
        .profile-trigger-btn { background: transparent; border: none; display: flex; align-items: center; gap: 12px; cursor: pointer; color: white; }
        .profile-avatar-thumb { width: 44px; height: 44px; border-radius: 4px; background-size: cover; }
        .profile-name-label { font-size: 0.95rem; font-weight: 600; }
        .dropdown-card { position: absolute; top: 55px; right: 0; background: #141414; border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 8px; width: 200px; padding: 6px 0; z-index: 1010; }
        .dropdown-item { padding: 10px 16px; color: #e5e5e5; text-decoration: none; font-size: 0.85rem; background: transparent; border: none; width: 100%; display: flex; align-items: center; gap: 10px; text-align: left; cursor: pointer; }
        .dropdown-item:hover { background: rgba(255, 255, 255, 0.1); }
        .text-danger { color: #e50914; }
        .divider { border: 0; height: 1px; background: rgba(255, 255, 255, 0.1); margin: 4px 0; }
        .login-btn { background: #e50914; color: white; padding: 0.4rem 1rem; border-radius: 4px; text-decoration: none; font-size: 0.85rem; font-weight: 600; }
        @keyframes slide-down { from { transform: translate3d(-50%, -120%, 0); opacity: 0; } to { transform: translate3d(-50%, 0, 0); opacity: 1; } }
      `}</style>
    </nav>
  );
}