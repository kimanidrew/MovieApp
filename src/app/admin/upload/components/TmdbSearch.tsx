"use client";

import React, { useState, useEffect } from "react";
import { Search, Loader2, Check, X, Clock, Globe, Star, Database, Film } from "lucide-react";

interface TmdbSearchProps {
  activeTab: "MOVIE" | "SHOW";
  setFormData: (updater: (prev: any) => any) => void;
  setCategories: (categories: string[]) => void;
  setImageAssets: (images: any[]) => void;
  setTrailerTracks: (trailers: any[]) => void;
  setSelectedTmdbItem?: (item: any) => void;
  setCast?: (cast: any[]) => void;
  setCrew?: (crew: any[]) => void;
  setProductionInfo?: (info: any) => void;
  isExistingShow?: boolean;
  setIsExistingShow?: (val: boolean) => void;
  selectedExistingShowId?: string;
  setSelectedExistingShowId?: (id: string) => void;
  setSelectedShowMeta?: (meta: any) => void;
}

export default function TmdbSearch({
  activeTab,
  setFormData,
  setCategories,
  setImageAssets,
  setTrailerTracks,
  setSelectedTmdbItem,
  setCast,
  setCrew,
  setProductionInfo,
  isExistingShow,
  setIsExistingShow,
  selectedExistingShowId,
  setSelectedExistingShowId,
  setSelectedShowMeta,
}: TmdbSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setSearching(true);
      try {
        const promises: Promise<any>[] = [];

        // 1. Search DB for Existing Shows if in SHOW mode
        if (activeTab === "SHOW") {
          promises.push(
            fetch("/api/admin/media/search-shows?q=" + encodeURIComponent(searchQuery))
              .then((r) => r.json())
              .then((data) => (data.results || []).map((item: any) => ({ ...item, source: "MY_DB" })))
              .catch(() => [])
          );
        } else {
          promises.push(Promise.resolve([]));
        }

        // 2. Search TMDB
        const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;
        if (apiKey) {
          const typePath = activeTab === "MOVIE" ? "movie" : "tv";
          promises.push(
            fetch("https://api.themoviedb.org/3/search/" + typePath + "?api_key=" + apiKey + "&query=" + encodeURIComponent(searchQuery))
              .then((r) => r.json())
              .then((data) => (data.results || []).slice(0, 5).map((item: any) => ({ ...item, source: "TMDB" })))
              .catch(() => [])
          );
        } else {
          promises.push(Promise.resolve([]));
        }

        const [dbItems, tmdbItems] = await Promise.all(promises);
        setSearchResults([...(dbItems || []), ...(tmdbItems || [])]);
        setShowDropdown(true);
      } catch (err) {
        console.error(err);
      } finally {
        setSearching(false);
      }
    }, 350);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, activeTab]);

  // Handle selecting an existing TV show from My Database
  const handleSelectDbShow = (dbShow: any) => {
    setShowDropdown(false);
    setSearchQuery("");

    if (setIsExistingShow) setIsExistingShow(true);
    if (setSelectedExistingShowId) setSelectedExistingShowId(dbShow.id);
    if (setSelectedShowMeta) setSelectedShowMeta(dbShow);

    setSelectedItem({ ...dbShow, isFromDb: true });

    // Populate all form fields from DB Show metadata
    setFormData((prev: any) => ({
      ...prev,
      title: dbShow.title || "",
      slug: dbShow.slug || "",
      description: dbShow.description || "",
      storyline: dbShow.storyline || "",
      releaseYear: dbShow.releaseYear || "2026",
      maturityRatingCode: dbShow.maturityRatingCode || "TV-MA",
      tmdbId: dbShow.tmdbId || "",
      imdbId: dbShow.imdbId || "",
      popularityScore: dbShow.popularityScore || 0,
    }));

    if (dbShow.categories?.length > 0) setCategories(dbShow.categories);
    if (dbShow.images?.length > 0) setImageAssets(dbShow.images);
    if (dbShow.cast?.length > 0 && setCast) setCast(dbShow.cast);
    if (dbShow.crew?.length > 0 && setCrew) setCrew(dbShow.crew);
    if (dbShow.trailers?.length > 0) setTrailerTracks(dbShow.trailers);
  };

  // Handle selecting a title from TMDB API
  const handleSelectTmdbTitle = async (result: any) => {
    setShowDropdown(false);
    setSearchQuery("");
    setSearching(true);

    if (setIsExistingShow) setIsExistingShow(false);
    if (setSelectedExistingShowId) setSelectedExistingShowId("");
    if (setSelectedShowMeta) setSelectedShowMeta(null);

    try {
      const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;
      if (!apiKey) return alert("Missing TMDB API Key");
      const typePath = activeTab === "MOVIE" ? "movie" : "tv";
      const res = await fetch("https://api.themoviedb.org/3/" + typePath + "/" + result.id + "?api_key=" + apiKey + "&append_to_response=videos,keywords,images,genres,credits,production_companies,production_countries");
      const detail = await res.json();

      const resolvedTitle = detail.title || detail.name;
      const slug = resolvedTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const releaseYear = ((detail.release_date || detail.first_air_date || "").split("-")[0]) || "2026";
      const keywords = (detail.keywords?.keywords || detail.keywords?.results || []).map((k: any) => k.name);
      const genres = (detail.genres || []).map((g: any) => g.name);
      const spokenLangs = (detail.spoken_languages || []).map((l: any) => l.iso_639_1 || "en");
      const runtime = (detail.runtime || (activeTab === "SHOW" ? detail.episode_run_time?.[0] : undefined) || 0).toString();

      setSelectedItem({ ...detail, isFromDb: false });
      if (setSelectedTmdbItem) setSelectedTmdbItem(detail);

      setFormData((prev: any) => ({
        ...prev,
        title: resolvedTitle,
        slug: slug,
        description: detail.overview || "",
        storyline: detail.tagline || "",
        releaseYear: releaseYear,
        maturityRatingCode: detail.adult ? "NC-17" : "TV-MA",
        tmdbId: detail.id.toString(),
        keywords: keywords,
        originalLanguage: detail.original_language || "en",
        spokenLanguages: spokenLangs,
        popularityScore: detail.popularity || 0,
        voteAverage: detail.vote_average || 0,
        voteCount: detail.vote_count || 0,
        runtime: runtime,
        status: detail.status || "Released",
        homepage: detail.homepage || "",
        imdbId: detail.imdb_id || ""
      }));

      if (genres.length > 0) setCategories(genres);

      if (setCast && detail.credits?.cast) {
        setCast(detail.credits.cast.slice(0, 10).map((c: any, i: number) => ({
          name: c.name || c.original_name || "",
          character: c.character || "",
          displayOrder: i,
        })));
      }

      if (setCrew && detail.credits?.crew) {
        setCrew(detail.credits.crew.slice(0, 10).map((c: any) => ({
          name: c.name || c.original_name || "",
          job: c.job || "",
          department: c.department || "",
        })));
      }

      if (setProductionInfo) {
        const studios = (detail.production_companies || []).slice(0, 5).map((c: any) => c.name);
        const countries = (detail.production_countries || []).slice(0, 5).map((c: any) => c.iso_3166_1);
        setProductionInfo({
          countries: countries,
          studios: studios,
          productionCompanies: studios,
        });
      }

      const posters = (detail.images?.posters || []).slice(0, 2).map((img: any, i: number) => ({
        url: "https://image.tmdb.org/t/p/original" + img.file_path, type: "POSTER", displayOrder: i
      }));
      const backdrops = (detail.images?.backdrops || []).slice(0, 2).map((img: any, i: number) => ({
        url: "https://image.tmdb.org/t/p/original" + img.file_path, type: "BACKDROP", displayOrder: i
      }));
      setImageAssets([...posters, ...backdrops]);

      const trailers = (detail.videos?.results || [])
        .filter((v: any) => v.type === "Trailer" && v.site === "YouTube")
        .slice(0, 2)
        .map((v: any) => ({ title: v.name, hlsManifestUrl: "https://www.youtube.com/watch?v=" + v.key }));
      setTrailerTracks(trailers);

    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  const clearSelection = () => {
    setSelectedItem(null);
    if (setSelectedTmdbItem) setSelectedTmdbItem(null);
    if (setIsExistingShow) setIsExistingShow(false);
    if (setSelectedExistingShowId) setSelectedExistingShowId("");
    if (setSelectedShowMeta) setSelectedShowMeta(null);

    setFormData((prev: any) => ({
      ...prev,
      title: "", slug: "", description: "", storyline: "", releaseYear: "",
      tmdbId: "", keywords: [], originalLanguage: "", spokenLanguages: [],
      popularityScore: 0, voteAverage: 0, voteCount: 0, runtime: "", status: "",
      homepage: "", imdbId: ""
    }));
  };

  const getYear = (item: any) => ((item.release_date || item.first_air_date || item.releaseYear || "").toString().split("-")[0]) || "";
  const displayTitle = selectedItem?.title || selectedItem?.name || "";
  const posterPath = selectedItem?.isFromDb ? selectedItem.posterUrl : (selectedItem?.poster_path ? "https://image.tmdb.org/t/p/w185" + selectedItem.poster_path : "");

  return (
    <div className="search-automation-panel">
      <h2 style={{ fontSize: "0.9rem", fontWeight: 600, margin: 0, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ display: "flex", alignItems: "center" }}>
          <span className="step-number-badge">1</span> Search & Auto-Fill Library
        </span>
        {activeTab === "SHOW" && (
          <span style={{ fontSize: "0.75rem", color: "#a1a1aa", fontWeight: 400 }}>
            Search TMDB (Online) or My Database (Existing TV Show)
          </span>
        )}
      </h2>

      {!selectedItem ? (
        <React.Fragment>
          <div className="search-field-composite">
            <Search className="icon-search-embedded" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={activeTab === "SHOW" ? "Search TMDB or My Database for existing TV show..." : "Search TMDB for a movie..."}
              className="input-search-control"
            />
            {searching && <Loader2 style={{ position: "absolute", right: "1rem", top: "50%", transform: "translateY(-50%)", width: "1.15rem", height: "1.15rem", animation: "spin 1s linear infinite", color: "#e11d48" }} />}
          </div>

          {showDropdown && searchResults.length > 0 && (
            <div className="search-results-dropdown">
              {searchResults.map((res) => {
                const isDb = res.source === "MY_DB";
                const imgUrl = isDb ? res.posterUrl : (res.poster_path ? "https://image.tmdb.org/t/p/w92" + res.poster_path : "");
                return (
                  <div
                    key={isDb ? "db-" + res.id : "tmdb-" + res.id}
                    onMouseDown={() => (isDb ? handleSelectDbShow(res) : handleSelectTmdbTitle(res))}
                    className="search-result-row"
                    style={{ background: isDb ? "rgba(16, 185, 129, 0.05)" : undefined }}
                  >
                    <img src={imgUrl || "/placeholder.jpg"} className="search-result-thumb" alt="Thumb" />
                    <div className="search-result-meta" style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span className="search-result-title">{res.title || res.name}</span>
                        {isDb ? (
                          <span style={{ fontSize: "0.65rem", background: "rgba(16, 185, 129, 0.2)", color: "#10b981", border: "1px solid rgba(16, 185, 129, 0.3)", padding: "1px 6px", borderRadius: "10px", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "3px" }}>
                            <Database size={10} /> My Database
                          </span>
                        ) : (
                          <span style={{ fontSize: "0.65rem", background: "rgba(225, 29, 72, 0.15)", color: "#f43f5e", border: "1px solid rgba(225, 29, 72, 0.3)", padding: "1px 6px", borderRadius: "10px", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "3px" }}>
                            <Film size={10} /> TMDB
                          </span>
                        )}
                      </div>
                      <span className="search-result-year">{getYear(res)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </React.Fragment>
      ) : (
        <div style={{ marginTop: "1rem", background: "#09090b", border: "1px solid #27272a", borderRadius: "0.5rem", padding: "1rem" }}>
          <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
            {posterPath && (
              <img src={posterPath} alt={displayTitle} style={{ width: "80px", height: "120px", objectFit: "cover", borderRadius: "0.375rem" }} />
            )}
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: "1rem", fontWeight: 700, color: "#fafafa", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    {displayTitle}
                    {selectedItem.isFromDb && (
                      <span style={{ fontSize: "0.7rem", background: "#10b981", color: "#000", padding: "2px 8px", borderRadius: "12px", fontWeight: 700 }}>
                        Existing DB Show
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#71717a", marginTop: "0.15rem" }}>
                    {getYear(selectedItem)}  ·  {activeTab === "MOVIE" ? "Movie" : "TV Show"}
                    {selectedItem.vote_average > 0 && (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", marginLeft: "0.5rem", color: "#fbbf24" }}>
                        <Star size={12} /> {selectedItem.vote_average.toFixed(1)}
                      </span>
                    )}
                  </div>
                  {(selectedItem.overview || selectedItem.description) && (
                    <p style={{ fontSize: "0.8rem", color: "#a1a1aa", lineHeight: "1.4", margin: "0.5rem 0 0 0", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {selectedItem.overview || selectedItem.description}
                    </p>
                  )}
                </div>
                <button onClick={clearSelection} style={{ background: "transparent", border: "none", color: "#ef4444", cursor: "pointer", padding: "0.35rem", display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.8rem" }}>
                  <X size={14} /> Clear Selection
                </button>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.75rem", background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.2)", padding: "0.5rem 0.75rem", borderRadius: "0.375rem" }}>
                <Check size={14} style={{ color: "#10b981" }} />
                <span style={{ fontSize: "0.8rem", color: "#10b981", fontWeight: 500 }}>
                  {selectedItem.isFromDb
                    ? "Selected Existing TV Show from My Database! Only episode details are needed below."
                    : "Selected! All metadata auto-filled from TMDB."}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}