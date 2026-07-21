import React, { useState, useEffect } from "react";
import { Search, Loader2 } from "lucide-react";

export default function TmdbSearch({ activeTab, setFormData, setCategories, setImageAssets, setTrailerTracks }: any) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    const delayDebounceFn = setTimeout(async () => {
      const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;
      if (!apiKey) return;

      setSearching(true);
      try {
        const typePath = activeTab === "MOVIE" ? "movie" : "tv";
        const res = await fetch(`https://api.themoviedb.org/3/search/${typePath}?api_key=${apiKey}&query=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        setSearchResults(data.results?.slice(0, 5) || []);
        setShowDropdown(true);
      } catch (err) {
        console.error(err);
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, activeTab]);

  const handleSelectTitle = async (result: any) => {
    setShowDropdown(false);
    setSearchQuery("");
    setSearching(true);

    try {
      const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;
      if (!apiKey) return alert("Missing TMDB API Key");
      const typePath = activeTab === "MOVIE" ? "movie" : "tv";
      const res = await fetch(`https://api.themoviedb.org/3/${typePath}/${result.id}?api_key=${apiKey}&append_to_response=videos,keywords,images,genres`);
      const detail = await res.json();

      const resolvedTitle = detail.title || detail.name;
      setFormData((prev: any) => ({
        ...prev,
        title: resolvedTitle,
        slug: resolvedTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
        description: detail.overview || "",
        storyline: detail.tagline || "",
        releaseYear: (detail.release_date || detail.first_air_date || "").split("-")[0] || "2026",
        maturityRatingCode: detail.adult ? "NC-17" : "TV-MA",
        tmdbId: detail.id.toString(),
        keywords: detail.keywords?.keywords?.map((k: any) => k.name) || detail.keywords?.results?.map((k: any) => k.name) || [],
      }));

      if (detail.genres) setCategories(detail.genres.map((g: any) => g.name));

      const posters = (detail.images?.posters || []).slice(0, 2).map((img: any, i: number) => ({
        url: `https://image.tmdb.org/t/p/original${img.file_path}`, type: "POSTER", displayOrder: i
      }));
      const backdrops = (detail.images?.backdrops || []).slice(0, 2).map((img: any, i: number) => ({
        url: `https://image.tmdb.org/t/p/original${img.file_path}`, type: "BACKDROP", displayOrder: i
      }));
      setImageAssets([...posters, ...backdrops]);

      const trailers = (detail.videos?.results || [])
        .filter((v: any) => v.type === "Trailer" && v.site === "YouTube")
        .slice(0, 2)
        .map((v: any) => ({ title: v.name, hlsManifestUrl: `https://www.youtube.com/watch?v=${v.key}` }));
      setTrailerTracks(trailers);

    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="search-automation-panel">
      <h2 style={{ fontSize: "0.9rem", fontWeight: 600, margin: 0, display: "flex", alignItems: "center" }}>
        <span className="step-number-badge">1</span> Search TMDB Suggestion Library
      </h2>
      <div className="search-field-composite">
        <Search className="icon-search-embedded" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={`Search TMDB for a ${activeTab.toLowerCase()}...`}
          className="input-search-control"
        />
        {searching && <Loader2 style={{ position: "absolute", right: "1rem", top: "50%", transform: "translateY(-50%)", width: "1.15rem", height: "1.15rem", animation: "spin 1s linear infinite", color: "#e11d48" }} />}
      </div>

      {showDropdown && searchResults.length > 0 && (
        <div className="search-results-dropdown">
          {searchResults.map((res) => (
            <div key={res.id} onMouseDown={() => handleSelectTitle(res)} className="search-result-row">
              <img src={res.poster_path ? `https://image.tmdb.org/t/p/w92${res.poster_path}` : ""} className="search-result-thumb" alt="Thumb" />
              <div className="search-result-meta">
                <span className="search-result-title">{res.title || res.name}</span>
                <span className="search-result-year">{(res.release_date || res.first_air_date || "").split("-")[0]}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}