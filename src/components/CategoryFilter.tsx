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

        .sidebar{
          position:sticky;
          top:95px;
          width:240px;
          padding-top: 10px;
        }

        .header{
          display:flex;
          align-items:center;
          gap:14px;
          margin-bottom:30px;
        }

        .headerIcon{
          width:38px;
          height:38px;

          display:flex;
          align-items:center;
          justify-content:center;

          border-radius:12px;

          background:rgba(255,255,255,.05);

          color:#fff;

          border:1px solid rgba(255,255,255,.08);
        }

        h3{
          margin:0;
          color:#fff;
          font-size:1.05rem;
          font-weight:700;
        }

        p{
          margin-top:3px;
          color:#777;
          font-size:.82rem;
        }

        .categories{
          display:flex;
          flex-direction:column;
          gap:6px;
        }

        .category{

          position:relative;

          display:flex;
          align-items:center;
          justify-content:space-between;

          width:100%;

          padding:14px 18px;

          border:none;
          outline:none;

          background:transparent;
          
          cursor:pointer;

          color:#9f9f9f;

          font-size:.95rem;

          font-weight:600;

          transition:all .25s ease;
        }

        .category::before{

          content:"";

          position:absolute;

          left:0;
          top:50%;

          width:3px;
          height:0;


          background:#E50914;

          transition:.25s ease;

          transform:translateY(-50%);
        }

        .category:hover{

          background:rgba(255,255,255,.04);

          color:white;

          padding-left:26px;
        }

        .category:hover::before{

          height:70%;
        }

        .arrow{

          opacity:0;

          transform:translateX(-10px);

          transition:.25s ease;
        }

        .category:hover .arrow{

          opacity:1;

          transform:translateX(0);
        }

        .category.active{

          background:linear-gradient(
            90deg,
            rgba(229,9,20,.18),
            transparent
          );

          color:white;

          padding-left:28px;
        }

        .category.active::before{

          height:78%;
        }

        .category.active .arrow{

          opacity:1;

          transform:translateX(0);

          color:#E50914;
        }

        @media(max-width:1100px){

          .sidebar{

            width:100%;

            position:relative;

            top:auto;
          }

          .header{
            margin-bottom:18px;
          }

          .categories{

            flex-direction:row;

            flex-wrap:wrap;

            gap:10px;
          }

          .category{

            width:auto;

            padding:12px 20px;

            background:#1c1c1c;

            border-radius:999px;
          }

          .category::before{
            display:none;
          }

          .category.active{

            background:#E50914;

            padding-left:20px;
          }

          .category:hover{

            padding-left:20px;
          }

          .arrow{
            display:none;
          }

        }

      `}</style>
    </aside>
  );
}