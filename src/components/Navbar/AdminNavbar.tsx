"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { LayoutDashboard, Upload, ListVideo, Users, Star, LogOut, Home, Layers } from "lucide-react";

export default function AdminNavbar() {
  const { adminUser, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement>(null);

  const fallbackAvatar = `https://api.dicebear.com/7.x/bottts/svg?seed=system-root`;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }

    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]);

  const navItems = [
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/upload", label: "Upload", icon: Upload },
    { href: "/admin/content", label: "Catalog", icon: ListVideo },
    { href: "/admin/collections", label: "Collections", icon: Layers },
    { href: "/admin/users", label: "Users", icon: Users },
  ];

  return (
    <nav className="admin-navbar">
      <div className="admin-container">
        <div className="admin-left">
          <Link href="/admin/dashboard" className="admin-brand">
            MFLIX <span className="brand-pill">HQ</span>
          </Link>
          <ul className="admin-links">
            {navItems.map((item) => {
              const isActive = pathname?.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link 
                    href={item.href} 
                    className={`admin-link ${isActive ? "active" : ""}`}
                  >
                    <item.icon size={14} />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="admin-right">
          <Link href="/" className="exit-hq-btn">
            <Home size={14} /> Back To App
          </Link>
          
          {adminUser && (
            <div className="admin-menu-container" ref={menuRef}>
              <button 
                className="admin-trigger-btn" 
                onClick={() => setDropdownOpen(!dropdownOpen)} 
              >
                <div className="admin-avatar-thumb" style={{ backgroundImage: `url(${fallbackAvatar})` }} />
                <div className="admin-meta-stack">
                  <span className="admin-name-label">{adminUser.email?.split("@")[0]}</span>
                  <span className="badge-hq">{adminUser.role}</span>
                </div>
                <span className="caret">▼</span>
              </button>

              {dropdownOpen && (
                <div className="admin-dropdown-card">
                  <div className="dropdown-header">System Operator</div>
                  <hr className="admin-divider" />
                  <button 
                    onClick={() => {
                      setDropdownOpen(false);
                      logout("admin");
                    }} 
                    className="admin-dropdown-item text-danger"
                  >
                    <LogOut size={14} /> Terminate Session
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <style jsx>{`
        .admin-navbar { position: fixed; top: 0; left: 0; width: 100%; background: #0c0c0e; border-bottom: 1px solid #27272a; z-index: 1000; height: 65px; display: flex; align-items: center; }
        .admin-container { width: 100%; padding: 0 2rem; display: flex; justify-content: space-between; align-items: center; }
        .admin-left, .admin-links { display: flex; align-items: center; gap: 1.5rem; list-style: none; }
        .admin-brand { font-size: 1.3rem; font-weight: 900; color: #fff; text-decoration: none; display: flex; align-items: center; gap: 6px; }
        .brand-pill { font-size: 0.65rem; background: #ffc107; color: #000; padding: 2px 4px; border-radius: 4px; font-weight: 800; }
        .admin-links { margin: 0; padding: 0; }
        .admin-link { font-size: 0.85rem; color: #a1a1aa; text-decoration: none; font-weight: 500; transition: color 0.2s; display: flex; align-items: center; gap: 0.35rem; padding: 0.4rem 0.6rem; border-radius: 0.375rem; }
        .admin-link:hover { color: #ffc107; }
        .admin-link.active { color: #ffc107; background: rgba(255, 193, 7, 0.1); }
        .admin-right { display: flex; align-items: center; gap: 1.5rem; }
        .exit-hq-btn { font-size: 0.85rem; color: #a1a1aa; text-decoration: none; border: 1px solid #3f3f46; padding: 0.4rem 0.8rem; border-radius: 6px; transition: all 0.2s; display: flex; align-items: center; gap: 0.35rem; }
        .exit-hq-btn:hover { color: #fff; background: #18181b; }
        .admin-menu-container { position: relative; }
        .admin-trigger-btn { background: transparent; border: none; display: flex; align-items: center; gap: 10px; cursor: pointer; color: white; }
        .admin-avatar-thumb { width: 30px; height: 30px; border-radius: 50%; background-size: cover; border: 2px solid #ffc107; }
        .admin-meta-stack { display: flex; flex-direction: column; align-items: flex-start; }
        .admin-name-label { font-size: 0.85rem; font-weight: 600; }
        .badge-hq { font-size: 0.6rem; color: #ffc107; font-weight: 700; letter-spacing: 0.5px; }
        .admin-dropdown-card { position: absolute; top: 45px; right: 0; background: #18181b; border: 1px solid #27272a; border-radius: 6px; width: 180px; padding: 6px 0; box-shadow: 0 10px 25px rgba(0,0,0,0.5); z-index: 1010; }
        .dropdown-header { font-size: 0.75rem; color: #71717a; padding: 6px 16px; font-weight: 500; }
        .admin-dropdown-item { padding: 8px 16px; color: #e4e4e7; text-decoration: none; font-size: 0.85rem; background: transparent; border: none; width: 100%; text-align: left; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; }
        .admin-dropdown-item:hover { background: #27272a; }
        .text-danger { color: #ef4444; }
        .admin-divider { border: 0; height: 1px; background: #27272a; margin: 4px 0; }
        .caret { font-size: 0.6rem; margin-left: 2px; color: #a1a1aa; }
      `}</style>
    </nav>
  );
}