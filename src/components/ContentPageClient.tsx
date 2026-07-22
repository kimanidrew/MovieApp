"use client";

import React, { useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";
import CategoryFilter from "@/components/CategoryFilter";
import VideoGrid from "@/components/Grids/VideoGrid";
import { Video } from "@/types/video";
import Hero from "./Hero";
import { isGenre } from "@/lib/category-utils";

interface ContentPageClientProps {
  items: Video[];
  categories: string[];
  type: "movie" | "tv" | "home";
}

export default function ContentPageClient({ items, categories, type }: ContentPageClientProps) {
  const [selectedTabs, setSelectedTabs] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const genres = categories.filter(isGenre);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.description.toLowerCase().includes(search.toLowerCase());
      const matchesCategory =
        selectedCategory === "All" || item.categories.includes(selectedCategory);
      return matchesSearch && matchesCategory;
    });
  }, [items, search, selectedCategory]);

  const toggleTab = (tab: string) => {
    setSelectedTabs(prev => 
      prev.includes(tab) ? prev.filter(t => t !== tab) : [...prev, tab]
    );
  };

  return (
    <section style={{ flex: 1, paddingTop: "100px", paddingBottom: "60px", paddingInline: "3%" }}>
      <PageHeader 
        title={type === "movie" ? "Movies" : "Shows"}
        subtitle={type === "movie" ? "Browse our premium movie library." : "Browse our premium TV series library."}
        searchPlaceholder={`Search ${type === "movie" ? "movies" : "shows"}, artists e.t.c`}
        searchValue={search}
        onSearch={setSearch}
        categories={categories}
        selectedTabs={selectedTabs}
        onToggleTab={toggleTab}
      />

      <div className="contentLayout">
        <CategoryFilter 
          categories={genres}
          selectedCategory={selectedCategory}
          onSelect={setSelectedCategory}
        />

        <div className="contentArea">
          <div className="hero-container">
            <Hero pageType={type} />
          </div>
          
          <VideoGrid 
            videos={filteredItems} 
            type={type}
          />
        </div>
      </div>

      <style jsx>{`
        .contentLayout { 
          display: grid; 
          grid-template-columns: 240px 1fr; 
          gap: 30px; 
          align-items: start; 
        }

        .hero-container {
          position: relative;
          width: 100%;
          height: 450px; 
          margin-bottom: 30px;
          border-radius: 20px;
          overflow: hidden;
          background: #000;
        }
        
        @media(max-width: 1024px) {
          .contentLayout { grid-template-columns: 1fr; }
        }
      `}</style>
    </section>
  );
}