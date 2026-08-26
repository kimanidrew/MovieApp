"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Compass, LayoutGrid } from "lucide-react";

export interface GenreOption {
  name: string;
  slug: string;
}

interface GenreSelectorProps {
  genres: GenreOption[];
  selected?: string | null;
  onSelect?: (slug: string | null) => void;
  type?: "movies" | "shows" | "home";
  label?: string;
}

export default function GenreSelector({
  genres,
  selected,
  onSelect,
  type = "home",
  label = "Browse Genres",
}: GenreSelectorProps) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  if (!genres || genres.length === 0) return null;

  const activeGenre = selected ? genres.find((g) => g.slug === selected)?.name : null;

  const handleSelect = (slug: string | null) => {
    setOpen(false);
    onSelect?.(slug);
  };

  return (
    <div className="genre-selector" ref={dropdownRef}>
      <button
        className={`genre-trigger ${open ? "open" : ""} ${selected ? "has-selection" : ""}`}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <Compass size={16} className="trigger-icon" />
        <span className="trigger-label">{activeGenre || label}</span>
        <ChevronDown size={16} className={`chevron ${open ? "rotate" : ""}`} />
      </button>

      <div className={`genre-dropdown ${open ? "visible" : ""}`} role="listbox">
        <div className="dropdown-title">
          {type === "movies" ? "Movie Genres" : type === "shows" ? "Show Genres" : "All Genres"}
        </div>

        <button
          className={`genre-item all-genres ${!selected ? "active" : ""}`}
          onClick={() => handleSelect(null)}
        >
          <LayoutGrid size={14} className="genre-item-icon" />
          <span>All {type === "movies" ? "Movies" : type === "shows" ? "Shows" : "Titles"}</span>
        </button>

        <div className="genre-grid">
          {genres.map((genre, idx) => (
            <button
              key={genre.slug}
              className={`genre-item ${selected === genre.slug ? "active" : ""}`}
              style={{ animationDelay: `${Math.min(idx * 0.025, 0.4)}s` }}
              onClick={() => handleSelect(genre.slug)}
              role="option"
              aria-selected={selected === genre.slug}
            >
              {genre.name}
            </button>
          ))}
        </div>
      </div>

      <style jsx>{`
        .genre-selector {
          position: relative;
          display: inline-block;
          flex-shrink: 0;
        }
        .genre-trigger {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(229, 9, 20, 0.15);
          border: 1px solid rgba(229, 9, 20, 0.35);
          color: #fff;
          padding: 0.55rem 1.1rem;
          border-radius: 999px;
          font-size: 0.85rem;
          font-weight: 700;
          cursor: pointer;
          backdrop-filter: blur(12px);
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          box-shadow: 0 4px 20px rgba(229, 9, 20, 0.15);
        }
        .genre-trigger:hover, .genre-trigger.open {
          background: #e50914;
          border-color: #e50914;
          transform: translateY(-1px);
          box-shadow: 0 8px 30px rgba(229, 9, 20, 0.35);
        }
        .genre-trigger.has-selection {
          background: rgba(251, 191, 36, 0.18);
          border-color: rgba(251, 191, 36, 0.5);
          box-shadow: 0 4px 20px rgba(251, 191, 36, 0.2);
        }
        .genre-trigger.has-selection:hover, .genre-trigger.has-selection.open {
          background: #fbbf24;
          border-color: #fbbf24;
          color: #000;
          box-shadow: 0 8px 30px rgba(251, 191, 36, 0.4);
        }
        .genre-trigger.has-selection:hover .trigger-icon,
        .genre-trigger.has-selection.open .trigger-icon {
          color: #000;
        }
        .trigger-icon { color: #f87171; transition: transform 0.3s ease; }
        .genre-trigger:hover .trigger-icon { color: #fff; transform: rotate(-20deg) scale(1.1); }
        .trigger-label { white-space: nowrap; max-width: 140px; overflow: hidden; text-overflow: ellipsis; }
        .chevron { transition: transform 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275); color: rgba(255,255,255,0.7); }
        .chevron.rotate { transform: rotate(180deg); }
        .genre-dropdown {
          position: absolute;
          top: calc(100% + 10px);
          right: 0;
          min-width: 340px;
          max-width: 480px;
          background: rgba(16, 16, 20, 0.97);
          backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 16px;
          padding: 12px;
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.8);
          z-index: 1002;
          opacity: 0;
          transform: translateY(-10px) scale(0.98);
          transform-origin: top left;
          pointer-events: none;
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          max-height: 420px;
          overflow-y: auto;
        }
        .genre-dropdown.visible { opacity: 1; transform: translateY(0) scale(1); pointer-events: auto; }
        .dropdown-title {
          color: #f87171;
          font-size: 0.7rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          padding: 4px 6px 10px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          margin-bottom: 8px;
        }
        .genre-item {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          width: 100%;
          padding: 8px 10px;
          border-radius: 10px;
          color: #d4d4d8;
          font-size: 0.82rem;
          font-weight: 500;
          background: none;
          border: none;
          cursor: pointer;
          text-align: left;
          transition: all 0.2s ease;
          opacity: 0;
          animation: genreItemIn 0.35s ease forwards;
        }
        .genre-item:hover { background: rgba(229, 9, 20, 0.15); color: #fff; transform: translateX(3px); }
        .genre-item.active { background: #e50914; color: #fff; font-weight: 700; box-shadow: 0 4px 15px rgba(229, 9, 20, 0.4); }
        .genre-item.all-genres { margin-bottom: 6px; border-bottom: 1px solid rgba(255, 255, 255, 0.06); border-radius: 10px; }
        .genre-item-icon { color: #fbbf24; flex-shrink: 0; transition: transform 0.25s ease; }
        .genre-item:hover .genre-item-icon { transform: scale(1.15) rotate(-8deg); }
        .genre-item.active .genre-item-icon { color: #fff; }
        .genre-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 4px; }
        @keyframes genreItemIn {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 640px) {
          .genre-dropdown { min-width: 280px; max-width: calc(100vw - 48px); }
          .genre-grid { grid-template-columns: 1fr; }
          .genre-trigger { padding: 0.5rem 0.9rem; font-size: 0.8rem; }
          .trigger-label { max-width: 100px; }
        }
      `}</style>
    </div>
  );
}