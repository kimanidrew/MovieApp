"use client";

import React from "react";
import { Filter, ChevronRight } from "lucide-react";

interface FilterProps {
  categories: string[];
  selectedCategory: string;
  onSelect: (category: string) => void;
}

export default function CategoryFilter({
  categories,
  selectedCategory,
  onSelect,
}: FilterProps) {
  return (
    <aside className="sidebar">
      <div className="header">
        <div className="headerIcon">
          <Filter size={16} />
        </div>

        <div>
          <h3>Browse</h3>
          <p>Discover movies by genre</p>
        </div>
      </div>

      <nav className="categories">
        <button
          onClick={() => onSelect("All")}
          className={`category ${selectedCategory === "All" ? "active" : ""}`}
        >
          <span>All Movies</span>
          <ChevronRight size={16} className="arrow" />
        </button>

        {categories.map((category) => (
          <button
            key={category}
            onClick={() => onSelect(category)}
            className={`category ${
              selectedCategory === category ? "active" : ""
            }`}
          >
            <span>{category}</span>
            <ChevronRight size={16} className="arrow" />
          </button>
        ))}
      </nav>

      <style jsx>{`
        .sidebar {
          position: sticky;
          top: 95px;
          width: 240px;
          height: 85vh;
          display: flex;
          flex-direction: column;
          padding-top: 10px;
          overflow: hidden;
          /* Transparent top to solid black transition */
          background: linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.3) 15%, #000 100%);
          border-radius: 20px;
          isolation: isolate;
          /* Bottom shadow/elevation */
          box-shadow: 0 40px 50px rgba(0,0,0,0.5);
        }

        .categories {
          flex: 1;
          overflow-y: auto;
          padding-bottom: 60px;
          /* Fade-out effect at the bottom */
          mask-image: linear-gradient(to bottom, black 70%, transparent 100%);
          -webkit-mask-image: linear-gradient(to bottom, black 70%, transparent 100%);
        }

        .categories::-webkit-scrollbar {
          width: 4px;
        }
        .categories::-webkit-scrollbar-thumb {
          background-color: #333;
          border-radius: 4px;
        }

        .header {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 30px;
          flex-shrink: 0;
          padding: 10px;
        }

        .headerIcon {
          width: 38px;
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.05);
          color: #fff;
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        h3 { margin: 0; color: #fff; font-size: 1.05rem; font-weight: 700; }
        p { margin-top: 3px; color: #777; font-size: 0.82rem; }

        .category {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          padding: 14px 18px;
          border: none;
          background: transparent;
          cursor: pointer;
          color: #9f9f9f;
          font-size: 0.95rem;
          font-weight: 600;
          transition: all 0.25s ease;
        }

        .category::before {
          content: "";
          position: absolute;
          left: 0;
          top: 50%;
          width: 3px;
          height: 0;
          background: #e50914;
          transition: 0.25s ease;
          transform: translateY(-50%);
        }

        .category:hover { background: rgba(255, 255, 255, 0.04); color: white; padding-left: 26px; }
        .category:hover::before { height: 70%; }

        .arrow { opacity: 0; transform: translateX(-10px); transition: 0.25s ease; }
        .category:hover .arrow { opacity: 1; transform: translateX(0); }

        .category.active {
          background: linear-gradient(90deg, rgba(229, 9, 20, 0.18), transparent);
          color: white;
          padding-left: 28px;
        }
        .category.active::before { height: 78%; }
        .category.active .arrow { opacity: 1; transform: translateX(0); color: #e50914; }

        @media (max-width: 1100px) {
          .sidebar { width: 100%; position: relative; top: auto; height: auto; box-shadow: none; background: #000; }
          .categories { flex-direction: row; flex-wrap: wrap; gap: 10px; overflow: visible; padding-bottom: 0; -webkit-mask-image: none; mask-image: none; }
          .category { width: auto; padding: 12px 20px; background: #1c1c1c; border-radius: 999px; }
          .category::before, .arrow { display: none; }
          .category.active { background: #e50914; padding-left: 20px; }
        }
      `}</style>
    </aside>
  );
}