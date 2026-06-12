"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className={`navbar ${isScrolled ? "scrolled" : ""}`}>
      <div className="nav-container">
        <div className="nav-left">
          <Link href="/" className="nav-brand text-gradient">MFLIX</Link>

          <ul className="nav-links">
            <li><Link href="/">Home</Link></li>
            <li><Link href="/tv">TV</Link></li>
            <li><Link href="/movies">Movies</Link></li>
            <li><Link href="/my-list">My Collection</Link></li>
          </ul>
        </div>

        <div className="nav-right">
          <Link href="/upload" className="upload-btn">
            Upload
          </Link>
        </div>
      </div>

      <style>{`
        .navbar {
          position: fixed;
          top: 1rem;
          left: 50%;
          transform: translateX(-50%);
          width: 95%;
          max-width: 1400px;
          z-index: 1000;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .nav-container {
          padding: 1rem 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-radius: 20px;
          border: 1px solid transparent;
          transition: all 0.4s ease;
          background: transparent;
        }

        /* 🔥 SCROLLED STATE: Floating Glass Pill */
        .navbar.scrolled .nav-container {
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(25px);
          -webkit-backdrop-filter: blur(20px);
          box-shadow: 0 4px 30px rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 0.8rem 2rem;
        }

        .nav-left {
          display: flex;
          align-items: center;
          gap: 2.5rem;
        }

        .nav-brand {
          font-size: 1.6rem;
          font-weight: 900;
          letter-spacing: 1px;
        }

        .nav-links {
          display: flex;
          gap: 1.5rem;
          list-style: none;
        }

        .nav-links a {
          font-size: 0.95rem;
          color: var(--text-muted);
          position: relative;
          transition: color 0.3s ease;
          font-weight: 500;
        }

        .nav-links a:hover {
          color: var(--foreground);
        }

        .nav-links a::after {
          content: "";
          position: absolute;
          left: 50%;
          bottom: -4px;
          width: 0%;
          height: 2px;
          background: var(--tertiary);
          transition: all 0.3s ease;
          transform: translateX(-50%);
          border-radius: 2px;
          box-shadow: 0 0 8px var(--tertiary);
        }

        .nav-links a:hover::after {
          width: 80%;
        }

        /* RIGHT SIDE */
        .nav-right {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        /* 🔥 GLOWING BUTTON */
        .upload-btn {
          background: rgba(255,255,255,0.05);
          color: white;
          padding: 0.5rem 1.2rem;
          border-radius: 12px;
          font-size: 0.9rem;
          font-weight: 600;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border: 1px solid rgba(255,255,255,0.1);
        }

        .upload-btn:hover {
          background: rgba(255,255,255,0.1);
          transform: translateY(-2px);
          border-color: var(--primary-brand);
          box-shadow: 0 0 15px rgba(59, 130, 246, 0.5);
        }
      `}</style>
    </nav>
  );
}