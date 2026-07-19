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
          className={`category ${
            selectedCategory === "All" ? "active" : ""
          }`}
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

  position: sticky;
  overflow: hidden;

  background: rgba(0,0,0,.88);

  border: 0px solid rgba(255,255,255,.04);

  border-radius: 22px;

  /* Ambient shadow on ALL SIDES */
  box-shadow:
      0 0 0 1px rgba(255,255,255,.03),

      0 0 30px rgba(0,0,0,.35),

      0 15px 35px rgba(0,0,0,.45),

      0 35px 70px rgba(0,0,0,.65),

      20px 0 45px rgba(0,0,0,.28),

      -20px 0 45px rgba(0,0,0,.28),

      0 -15px 30px rgba(0,0,0,.18),

      inset 0 1px rgba(255,255,255,.04);

  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);

  isolation: isolate;
}

.sidebar::before{
    content:"";
    position:absolute;
    inset:0;
    pointer-events:none;

    background:
        linear-gradient(
            to bottom,
            rgba(255,255,255,.05),
            transparent 18%
        );

    z-index:1;
}


    .sidebar::after{
    content:"";
    position:absolute;

    left:-25px;
    right:-25px;
    bottom:-25px;

    height:170px;

    pointer-events:none;

    backdrop-filter:blur(22px);
    -webkit-backdrop-filter:blur(22px);

    background:
        linear-gradient(
            to bottom,

            rgba(0,0,0,0) 0%,

            rgba(0,0,0,.12) 20%,

            rgba(0,0,0,.35) 45%,

            rgba(0,0,0,.65) 70%,

            rgba(0,0,0,.92) 92%,

            #000 100%
        );

    box-shadow:
        0 -20px 40px rgba(0,0,0,.20),
        0 0 80px rgba(0,0,0,.45),
        0 35px 80px rgba(0,0,0,.95),
        0 60px 120px rgba(0,0,0,1);
}

.categories{
    flex:1;
    overflow-y:auto;

    padding-bottom:140px;

    mask-image: linear-gradient(
        to bottom,
        black 0%,
        black 78%,
        rgba(0,0,0,.85) 86%,
        rgba(0,0,0,.55) 92%,
        transparent 100%
    );

    -webkit-mask-image: linear-gradient(
        to bottom,
        black 0%,
        black 78%,
        rgba(0,0,0,.85) 86%,
        rgba(0,0,0,.55) 92%,
        transparent 100%
    );
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

        h3 {
          margin: 0;
          color: #fff;
          font-size: 1.05rem;
          font-weight: 700;
        }

        p {
          margin-top: 3px;
          color: #777;
          font-size: 0.82rem;
        }

        .category {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          padding: 14px 18px;
          border: none;
          outline: none;
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

        .category:hover {
          background: rgba(255, 255, 255, 0.04);
          color: white;
          padding-left: 26px;
        }

        .category:hover::before {
          height: 70%;
        }

        .arrow {
          opacity: 0;
          transform: translateX(-10px);
          transition: 0.25s ease;
        }

        .category:hover .arrow {
          opacity: 1;
          transform: translateX(0);
        }

        .category.active {
          background: linear-gradient(90deg, rgba(229, 9, 20, 0.18), transparent);
          color: white;
          padding-left: 28px;
        }

        .category.active::before {
          height: 78%;
        }

        .category.active .arrow {
          opacity: 1;
          transform: translateX(0);
          color: #e50914;
        }

        @media (max-width: 1100px) {
          .sidebar {
            width: 100%;
            position: relative;
            top: auto;
            height: auto;
            box-shadow: none;
          }
          .sidebar::after {
            display: none;
          }
          .header {
            margin-bottom: 18px;
          }
          .categories {
            flex-direction: row;
            flex-wrap: wrap;
            gap: 10px;
            overflow: visible;
            padding-bottom: 0;
          }
          .category {
            width: auto;
            padding: 12px 20px;
            background: #1c1c1c;
            border-radius: 999px;
          }
          .category::before {
            display: none;
          }
          .category.active {
            background: #e50914;
            padding-left: 20px;
          }
          .category:hover {
            padding-left: 20px;
          }
          .arrow {
            display: none;
          }
        }
      `}</style>
    </aside>
  );
}