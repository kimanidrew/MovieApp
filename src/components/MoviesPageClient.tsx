"use client";

import React, { useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";
import CategoryFilter from "@/components/CategoryFilter";
import VideoGrid from "@/components/Grids/VideoGrid";

export default function MoviesPageClient({ movies, categories }: any) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const processedMovies = useMemo(() => {
    return movies.map((v: any) => ({
      ...v,
      categories: v.categories || [],
      description: v.description || v.content?.description || "",
    }));
  }, [movies]);

  const filteredMovies = useMemo(() => {
    return processedMovies.filter((movie: any) => {
      const matchesSearch =
        movie.title.toLowerCase().includes(search.toLowerCase()) ||
        movie.description.toLowerCase().includes(search.toLowerCase());
      const matchesCategory =
        selectedCategory === "All" || movie.categories.includes(selectedCategory);
      return matchesSearch && matchesCategory;
    });
  }, [processedMovies, search, selectedCategory]);

  return (
    <section style={{ flex: 1, paddingTop: "100px", paddingBottom: "60px", paddingInline: "3%" }}>
      
      <PageHeader 
        title="Movies"
        subtitle="Browse our premium movie library."
        searchPlaceholder="Search movies, artists e.t.c"
        searchValue={search}
        onSearch={setSearch}
      />

      <div className="contentLayout">
        {/* Reusable Filter Component */}
        <CategoryFilter 
            categories={categories}
            selectedCategory={selectedCategory}
            onSelect={setSelectedCategory}
        />

        <div className="movieArea">
          <VideoGrid videos={filteredMovies} isTvPage={false} />
        </div>
      </div>

      <style jsx>{`
        .contentLayout { display: grid; grid-template-columns: 240px 1fr; gap: 40px; align-items: start; }
        
        /* Force 3 Columns in Grid */
        .movieArea :global(.video-grid) { 
          display: grid; 
          grid-template-columns: repeat(3, 1fr) !important; 
          gap: 20px; 
        }

        @media(max-width: 1024px) {
          .contentLayout { grid-template-columns: 1fr; }
          .movieArea :global(.video-grid) { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </section>
  );
}