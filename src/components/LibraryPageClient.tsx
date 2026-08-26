"use client";

import { useMemo, useState } from "react";
import HeroBanner from "./home/HeroBanner";
import ContentRow from "./home/ContentRow";
import GenreSelector, { GenreOption } from "./GenreSelector";
import { HomepageItem, HomepageSection } from "@/types/homepage";
import { SkeletonHomepage } from "./home/HomeSkeletons";

interface LibraryPageClientProps {
  items: HomepageItem[];
  genres: GenreOption[];
  type: "movies" | "shows" | "home";
  title: string;
  currentSlug?: string;
}

export default function LibraryPageClient({ items, genres, type, title, currentSlug }: LibraryPageClientProps) {
  const [selectedSlug, setSelectedSlug] = useState<string | null>(currentSlug || null);

  const genreMap = useMemo(() => {
    const map: Record<string, string> = {};
    genres.forEach((g) => { map[g.name.toLowerCase()] = g.slug; });
    return map;
  }, [genres]);

  // Filter items by selected genre if one is active
  const visibleItems = useMemo(() => {
    if (!selectedSlug) return items;
    const selectedName = genres.find((g) => g.slug === selectedSlug)?.name;
    if (!selectedName) return items;
    return items.filter((i) => i.categories?.includes(selectedName));
  }, [items, genres, selectedSlug]);

  const sections = useMemo<HomepageSection[]>(() => {
    if (!visibleItems || visibleItems.length === 0) return [];

    // When a genre is selected, show ONLY that genre's content in themed rows
    if (selectedSlug) {
      const selectedName = genres.find((g) => g.slug === selectedSlug)?.name || "Genre";

      const topRated: HomepageSection = {
        id: "selected-top-rated",
        title: `Top ${selectedName} ${type === "movies" ? "Movies" : "Shows"}`,
        type: "TRENDING",
        renderStyle: "TOP_10_NUMERIC",
        items: [...visibleItems]
          .sort((a, b) => (b.popularityScore || b.rating || 0) - (a.popularityScore || a.rating || 0))
          .slice(0, 10),
      };

      const allSelected: HomepageSection = {
        id: "selected-all",
        title: `All ${selectedName} ${type === "movies" ? "Movies" : "Shows"}`,
        type: "CURATED_COLLECTION",
        renderStyle: "STANDARD_POSTER",
        items: visibleItems.slice(0, 20),
        hasMore: visibleItems.length > 20,
        viewAllHref: `/genre/${selectedSlug}`,
      };

      return [topRated, allSelected];
    }

    // Default: show all content organized in homepage-style rows
    const genreGroups: HomepageSection[] = [];
    const allGenres = new Set<string>();
    items.forEach((i) => i.categories?.forEach((c) => allGenres.add(c)));

    allGenres.forEach((genre) => {
      const groupItems = items.filter((i) => i.categories?.includes(genre));
      if (groupItems.length > 0) {
        const genreSlug = genreMap[genre.toLowerCase()] || genre.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        genreGroups.push({
          id: `genre-${genreSlug}`,
          title: genre,
          type: "CATEGORY_ROW",
          renderStyle: "STANDARD_POSTER",
          items: groupItems.slice(0, 15),
          hasMore: groupItems.length > 15,
          viewAllHref: `/genre/${genreSlug}`,
        });
      }
    });

    const topRated: HomepageSection = {
      id: "top-rated",
      title: `Top ${type === "movies" ? "Movies" : "Shows"}`,
      type: "TRENDING",
      renderStyle: "TOP_10_NUMERIC",
      items: [...items].sort((a, b) => (b.popularityScore || b.rating || 0) - (a.popularityScore || a.rating || 0)).slice(0, 10),
    };

    const popular: HomepageSection = {
      id: "popular",
      title: `Popular ${type === "movies" ? "Movies" : "Shows"}`,
      type: "POPULAR",
      renderStyle: "WIDE_BACKDROP",
      items: items.slice(0, 15),
    };

    const all: HomepageSection = {
      id: "all-items",
      title: `All ${type === "movies" ? "Movies" : "Shows"}`,
      type: "CURATED_COLLECTION",
      renderStyle: "STANDARD_POSTER",
      items: items.slice(0, 20),
      hasMore: items.length > 20,
    };

    // Interleave: popular, top rated, then genre rows, then all
    return [popular, topRated, ...genreGroups, all];
  }, [items, visibleItems, selectedSlug, genres, genreMap, type]);

  if (!items || items.length === 0) return <SkeletonHomepage />;

  const featured = items[Math.floor(Math.random() * Math.min(items.length, 5))];

  const displayTitle = selectedSlug
    ? genres.find((g) => g.slug === selectedSlug)?.name || title
    : title;

  return (
    <main className="library-page" aria-label={title}>
      <HeroBanner content={selectedSlug ? visibleItems[0] || featured : featured} />

      <div className="library-controls">
        <div className="library-title-wrap">
          <h1 className="library-title">{displayTitle}</h1>
          {selectedSlug && (
            <span className="library-subtitle">
              {visibleItems.length} {type === "movies" ? "movie" : type === "shows" ? "show" : "title"}
              {visibleItems.length === 1 ? "" : "s"} in this genre
            </span>
          )}
        </div>
        <GenreSelector
          genres={genres}
          selected={selectedSlug}
          onSelect={setSelectedSlug}
          type={type}
        />
      </div>

      <div className="sections">
        {sections.map((section) => (
          <ContentRow key={section.id} section={section} />
        ))}
      </div>

      <style jsx>{`
        .library-page {
          min-height: 100vh;
          background: #000;
        }

        .library-controls {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          padding: 1.5rem 4% 0.5rem;
          margin-top: -1rem;
          position: relative;
          z-index: 10;
          flex-wrap: wrap;
        }

        .library-title-wrap {
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
        }

        .library-title {
          color: #fff;
          font-size: 2rem;
          font-weight: 900;
          margin: 0;
          letter-spacing: -0.5px;
          text-shadow: 0 2px 10px rgba(0, 0, 0, 0.6);
          animation: titleIn 0.6s ease forwards;
        }

        .library-subtitle {
          color: #a1a1aa;
          font-size: 0.8rem;
          font-weight: 500;
          animation: subtitleIn 0.5s ease 0.1s forwards;
          opacity: 0;
        }

        @keyframes subtitleIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes titleIn {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .sections {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          padding-top: 0.5rem;
          position: relative;
          z-index: 5;
        }

        @media (max-width: 768px) {
          .library-controls {
            padding: 1rem 4% 0.5rem;
          }
          .library-title {
            font-size: 1.5rem;
          }
        }
      `}</style>
    </main>
  );
}