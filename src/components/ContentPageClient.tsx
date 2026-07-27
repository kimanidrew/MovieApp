"use client";

import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PageHeader from "@/components/PageHeader";
import CategoryFilter from "@/components/CategoryFilter";
import VideoGrid from "@/components/Grids/VideoGrid";
import { Video } from "@/types/video";
import Hero from "./Hero";
import { isGenre } from "@/utils/category-utils";

interface ContentPageClientProps {
  items: Video[];
  categories: string[];
  type: "movies" | "shows" | "home";
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
      
      const matchesTabs = selectedTabs.every(tab => item.categories.includes(tab));

      return matchesSearch && matchesCategory && matchesTabs;
    });
  }, [items, search, selectedCategory, selectedTabs]);

  const isFiltering = search.length > 0 || selectedCategory !== "All" || selectedTabs.length > 0;

  const toggleTab = (tab: string) => {
    setSelectedTabs(prev => 
      prev.includes(tab) ? prev.filter(t => t !== tab) : [...prev, tab]
    );
  };

  return (
    <section style={{ flex: 1, paddingTop: "100px", paddingBottom: "60px", paddingInline: "3%" }}>
      <PageHeader 
        title={type === "movies" ? "Movies" : "Shows"}
        subtitle={type === "movies" ? "Browse our premium movie library." : "Browse our premium TV series library."}
        searchPlaceholder={`Search ${type === "movies" ? "movies" : "shows"}, artists e.t.c`}
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
          {/* AnimatePresence handles the exit animation */}
          <AnimatePresence mode="popLayout">
            {!isFiltering && (
              <motion.div
                initial={{ opacity: 0, y: -20, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 450 }}
                exit={{ opacity: 0, y: -20, height: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="hero-container"
                style={{ marginBottom: "30px" }}
              >
                <Hero pageType={type} />
              </motion.div>
            )}
          </AnimatePresence>
          
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