"use client";

import React, { useState, useEffect } from "react";
import { Search, Layers, Loader2, CheckCircle2 } from "lucide-react";

interface ShowConfig {
  seasonNumber: string;
  episodeNumber: string;
  episodeTitle: string;
  episodeDescription: string;
}

export default function TvSeasonEpisodeForm({ 
  showConfig,
  setShowConfig,
  isExistingShow,
  setIsExistingShow, 
  selectedExistingShowId,
  setSelectedExistingShowId,
  parentTmdbId,
  setSelectedShowMeta,
  selectedShowMeta,
}: any) {
  const [dbSearchQuery, setDbSearchQuery] = useState("");
  const [dbResults, setDbResults] = useState<any[]>([]);
  const [showDbDropdown, setShowDbDropdown] = useState(false);
  const [localSelectedMeta, setLocalSelectedMeta] = useState<any>(null);
  const [isFetching, setIsFetching] = useState(false);

  const activeShowMeta = selectedShowMeta || localSelectedMeta;

  useEffect(() => {
    if (!dbSearchQuery.trim()) { setDbResults([]); setShowDbDropdown(false); return; }
    const delay = setTimeout(async () => {
      try {
        const res = await fetch("/api/admin/media/search-shows?q=" + encodeURIComponent(dbSearchQuery));
        const data = await res.json();
        setDbResults(data.results || []);
        setShowDbDropdown(true);
      } catch (err) { console.error(err); }
    }, 400);
    return () => clearTimeout(delay);
  }, [dbSearchQuery]);

  const handleSelectDbShow = (show: any) => {
    setSelectedExistingShowId(show.id || show.showId);
    setLocalSelectedMeta(show); 
    if (setSelectedShowMeta) setSelectedShowMeta(show);
    
    setShowConfig((prev: any) => ({ 
      ...prev, 
      contentId: show.contentId, 
      slug: show.slug, 
      title: show.title 
    }));
    
    setShowDbDropdown(false);
    setDbSearchQuery("");
  };

  const fetchTmdbMetadata = async () => {
    const targetId = parentTmdbId || activeShowMeta?.tmdbId;
    
    if (!targetId) {
      alert("TMDB ID not found for this show. Please enter season & episode details manually or select a show with a TMDB ID.");
      return;
    }

    setIsFetching(true);
    try {
      const res = await fetch("/api/admin/media/fetch-episode?tmdbId=" + targetId + "&season=" + showConfig.seasonNumber + "&episode=" + showConfig.episodeNumber);
      
      if (!res.ok) {
        throw new Error("Episode not found on TMDB");
      }
      
      const data = await res.json();
      setShowConfig((prev: ShowConfig) => ({ 
        ...prev, 
        episodeTitle: data.title || "", 
        episodeDescription: data.description || "" 
      }));
    } catch (err: any) { 
      console.error(err);
      alert("Could not fetch episode data from TMDB. Please verify the Season and Episode number.");
    } finally { 
      setIsFetching(false); 
    }
  };

  return (
    <div className="panel-card-glass active-step">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
        <h2 style={{ fontSize: "0.9rem", fontWeight: 600, margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Layers size={16} /> TV Season & Episode Mapping
        </h2>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            type="button"
            onClick={() => { setIsExistingShow(false); setSelectedExistingShowId(""); setSelectedShowMeta(null); }}
            className={"category-badge-pill state-active"}
            style={{ background: !isExistingShow ? "#e11d48" : "transparent" }}
          >
            New Show
          </button>
          <button
            type="button"
            onClick={() => setIsExistingShow(true)}
            className={"category-badge-pill state-active"}
            style={{ background: isExistingShow ? "#e11d48" : "transparent" }}
          >
            Add to Existing
          </button>
        </div>
      </div>

      {/* Existing Show Selection */}
      {isExistingShow && (
        <div style={{ marginBottom: "1.5rem" }}>
          {selectedExistingShowId && activeShowMeta ? (
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", background: "#09090b", padding: "1rem", borderRadius: "0.5rem", border: "1px solid #10b981" }}>
              {(activeShowMeta.posterUrl || activeShowMeta.poster_path) && (
                <img
                  src={activeShowMeta.posterUrl || ("https://image.tmdb.org/t/p/w185" + activeShowMeta.poster_path)}
                  alt="Poster"
                  style={{ width: "45px", height: "64px", borderRadius: "0.25rem", objectFit: "cover" }}
                />
              )}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#fafafa", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  {activeShowMeta.title || activeShowMeta.name}
                  <span style={{ fontSize: "0.65rem", background: "#10b981", color: "#000", padding: "2px 6px", borderRadius: "10px", fontWeight: 700 }}>
                    Selected Show
                  </span>
                </div>
                <div style={{ fontSize: "0.75rem", color: "#71717a", marginTop: "0.15rem" }}>
                  Release Year: {activeShowMeta.releaseYear || activeShowMeta.first_air_date?.split("-")[0] || "—"}
                </div>
                <div style={{ fontSize: "0.7rem", color: "#10b981", marginTop: "0.25rem", display: "flex", alignItems: "center", gap: "4px" }}>
                  <CheckCircle2 size={12} /> Show metadata auto-linked! Only episode details are required below.
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setSelectedExistingShowId(""); setLocalSelectedMeta(null); setSelectedShowMeta(null); }}
                className="btn-badge-remove"
                style={{ padding: "0.5rem 0.75rem", width: "auto", height: "auto", fontSize: "0.75rem" }}
              >
                Change Show
              </button>
            </div>
          ) : (
            <div className="search-field-composite" style={{ marginTop: 0 }}>
              <Search className="icon-search-embedded" />
              <input
                type="text"
                value={dbSearchQuery}
                onChange={(e) => setDbSearchQuery(e.target.value)}
                placeholder="Search database for existing TV show..."
                className="input-search-control"
              />
              {showDbDropdown && dbResults.length > 0 && (
                <div className="search-results-dropdown">
                  {dbResults.map((show) => (
                    <div key={show.id} onMouseDown={() => handleSelectDbShow(show)} className="search-result-row">
                      <img src={show.posterUrl || "/placeholder.jpg"} className="search-result-thumb" alt="Thumb" />
                      <div className="search-result-meta">
                        <span className="search-result-title">{show.title}</span>
                        <span className="search-result-year">{show.releaseYear}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="panel-grid-inner">
        <div>
          <div className="input-group-wrapper">
            <label>Season Number</label>
            <input type="number" placeholder="1" value={showConfig.seasonNumber} onChange={(e) => setShowConfig({ ...showConfig, seasonNumber: e.target.value })} className="input-text-field" />
          </div>
        </div>
        <div>
          <div className="input-group-wrapper">
            <label>Episode Number</label>
            <input type="number" placeholder="1" value={showConfig.episodeNumber} onChange={(e) => setShowConfig({ ...showConfig, episodeNumber: e.target.value })} className="input-text-field" />
          </div>
        </div>
        <div className="grid-col-full">
          <button type="button" onClick={fetchTmdbMetadata} className="btn-secondary" disabled={isFetching} style={{ marginBottom: "0.5rem" }}>
            {isFetching ? <Loader2 style={{ width: "0.9rem", height: "0.9rem", animation: "spin 1s linear infinite" }} /> : "Auto-fill Episode from TMDB"}
          </button>
        </div>
        <div className="grid-col-full">
          <div className="input-group-wrapper">
            <label>Episode Title</label>
            <input type="text" placeholder="e.g. Episode 1 Title" value={showConfig.episodeTitle} onChange={(e) => setShowConfig({ ...showConfig, episodeTitle: e.target.value })} className="input-text-field" />
          </div>
        </div>
        <div className="grid-col-full">
          <div className="input-group-wrapper">
            <label>Episode Description</label>
            <textarea placeholder="Episode summary..." value={showConfig.episodeDescription} onChange={(e) => setShowConfig({ ...showConfig, episodeDescription: e.target.value })} className="input-text-field" rows={3} />
          </div>
        </div>

        {isExistingShow && selectedExistingShowId && (
          <div className="grid-col-full" style={{ background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.2)", padding: "0.75rem 1rem", borderRadius: "0.5rem" }}>
            <p style={{ fontSize: "0.8rem", color: "#10b981", margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
              ⚡ Adding episode to existing show — parent show title, images, categories, and trailer data will be shared automatically.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}