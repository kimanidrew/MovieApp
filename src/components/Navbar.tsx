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
      <div className="nav-left">
        <Link href="/" className="nav-brand">MOVIEFLIX</Link>

        <ul className="nav-links">
          <li><Link href="/">Home</Link></li>
          <li><Link href="/tv">TV Shows</Link></li>
          <li><Link href="/movies">Movies</Link></li>
          <li><Link href="/my-list">My List</Link></li>
        </ul>
      </div>

      <div className="nav-right">
        <Link href="/upload" className="upload-btn">
          Upload
        </Link>
      </div>

      <style>{`
        .navbar {
          position: fixed;
          top: 0;
          width: 100%;
          padding: 1rem 4%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          z-index: 1000;

          background: linear-gradient(to bottom, rgba(0,0,0,0.7), transparent);
          backdrop-filter: blur(0px);
          -webkit-backdrop-filter: blur(0px);

          transition: all 0.4s ease;
        }

        /* 🔥 SCROLLED STATE */
        .navbar.scrolled {
          background: rgba(20, 20, 20, 0.85);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          box-shadow: 0 10px 20px rgba(0,0,0,0.3);
        }

        .nav-left {
          display: flex;
          align-items: center;
          gap: 2rem;
        }

        .nav-brand {
          color: var(--primary-brand);
          font-size: 1.8rem;
          font-weight: 900;
          letter-spacing: 2px;
        }

        .nav-links {
          display: flex;
          gap: 1.5rem;
          list-style: none;
        }

        .nav-links a {
          font-size: 0.95rem;
          color: #e5e5e5;
          position: relative;
          transition: color 0.3s ease;
        }

        /* 🔥 NETFLIX HOVER UNDERLINE */
        .nav-links a::after {
          content: "";
          position: absolute;
          left: 0;
          bottom: -4px;
          width: 0%;
          height: 2px;
          background: var(--primary-brand);
          transition: width 0.3s ease;
        }

        .nav-links a:hover {
          color: #fff;
        }

        .nav-links a:hover::after {
          width: 100%;
        }

        /* RIGHT SIDE */
        .nav-right {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        /* 🔥 NETFLIX STYLE BUTTON */
        .upload-btn {
          background: var(--primary-brand);
          color: white;
          padding: 0.5rem 1.2rem;
          border-radius: 4px;
          font-size: 0.9rem;
          font-weight: 600;
          transition: all 0.25s ease;
          box-shadow: 0 4px 12px rgba(229, 9, 20, 0.4);
        }

        .upload-btn:hover {
          background: #f40612;
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(229, 9, 20, 0.6);
        }
      `}</style>
    </nav>
  );
}