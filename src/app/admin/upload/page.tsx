// src/app/admin/upload/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import * as tus from "tus-js-client";
import { Film, Tv, Search, UploadCloud, Loader2, CheckCircle, Info, FileText, Trash2, Link, ImageIcon, Plus, X, Tag } from "lucide-react";

interface TmdbSearchResult {
  id: number;
  title?: string;
  name?: string;
  release_date?: string;
  first_air_date?: string;
  poster_path?: string;
}

export default function AdminUploadPanel() {
  // Navigation & UI States
  const [activeTab, setActiveTab] = useState<"MOVIE" | "SHOW">("MOVIE");
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<TmdbSearchResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  // TMDB Metadata Form Hooks
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    description: "",
    storyline: "",
    releaseYear: "2026",
    maturityRatingCode: "TV-MA",
    tmdbId: "",
    keywords: [] as string[],
  });

  // Multiple Categories State (Supports adding more than one)
  const [categories, setCategories] = useState<string[]>([]);
  const [newCategoryInput, setNewCategoryInput] = useState("");

  // Multiple Media Asset Arrays (can contain both TMDB urls and Cloudflare urls)
  const [imageAssets, setImageAssets] = useState<Array<{ url: string; type: "POSTER" | "BACKDROP"; displayOrder: number }>>([]);
  const [trailerTracks, setTrailerTracks] = useState<Array<{ title: string; hlsManifestUrl: string }>>([]);

  // Local Processing States for Graphic/Trailer Uploading Tasks
  const [imageUploading, setImageUploading] = useState(false);
  const [trailerUploading, setTrailerUploading] = useState(false);
  const [manualTrailerTitle, setManualTrailerTitle] = useState("");

  // Ephemeral Show-Specific State
  const [showConfig, setShowConfig] = useState({
    seasonNumber: "1",
    episodeNumber: "1",
    episodeTitle: "",
    episodeDescription: "",
  });

  // Active Upload Tracking States (Main Feature Video)
  const [mainVideoFile, setMainVideoFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedVideoId, setUploadedVideoId] = useState("");
  const [uploadStatusText, setUploadStatusText] = useState("");

  // Debounced TMDB Live Search Hook
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setSearching(true);
      try {
        const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;
        const typePath = activeTab === "MOVIE" ? "movie" : "tv";
        const res = await fetch(
          `https://api.themoviedb.org/3/search/${typePath}?api_key=${apiKey}&query=${encodeURIComponent(searchQuery)}`
        );
        const data = await res.json();
        setSearchResults(data.results?.slice(0, 5) || []);
        setShowDropdown(true);
      } catch (err) {
        console.error("Live search failure:", err);
      } finally {
        setSearching(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, activeTab]);

  // Add Category Handler
  const handleAddCategory = () => {
    const trimmed = newCategoryInput.trim();
    if (trimmed && !categories.includes(trimmed)) {
      setCategories([...categories, trimmed]);
      setNewCategoryInput("");
    }
  };

  // Remove Category Handler
  const handleRemoveCategory = (catToRemove: string) => {
    setCategories(categories.filter((cat) => cat !== catToRemove));
  };

  // Handle selecting a specific title from the live suggestions matrix
  const handleSelectTitle = async (result: TmdbSearchResult) => {
    setShowDropdown(false);
    setSearchQuery("");
    setSearching(true);

    try {
      const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;
      const typePath = activeTab === "MOVIE" ? "movie" : "tv";

      const detailsRes = await fetch(
        `https://api.themoviedb.org/3/${typePath}/${result.id}?api_key=${apiKey}&append_to_response=videos,keywords,images,genres`
      );
      const detail = await detailsRes.json();

      const resolvedTitle = detail.title || detail.name;
      setFormData({
        title: resolvedTitle,
        slug: resolvedTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
        description: detail.overview || "",
        storyline: detail.tagline || "",
        releaseYear: (detail.release_date || detail.first_air_date || "").split("-")[0] || "2026",
        maturityRatingCode: detail.adult ? "NC-17" : "TV-MA",
        tmdbId: detail.id.toString(),
        keywords: detail.keywords?.keywords?.map((k: any) => k.name) || detail.keywords?.results?.map((k: any) => k.name) || [],
      });

      // Extract TMDB Genres and set them as default selection categories
      if (detail.genres && Array.isArray(detail.genres)) {
        const genres = detail.genres.map((g: any) => g.name);
        setCategories(genres);
      }

      // DIRECTLY capture TMDB original image URLs without routing/uploading to Cloudflare
      const posters = (detail.images?.posters || [])
        .slice(0, 2)
        .map((img: any, i: number) => ({
          url: `https://image.tmdb.org/t/p/original${img.file_path}`,
          type: "POSTER" as const,
          displayOrder: i
        }));
      
      const backdrops = (detail.images?.backdrops || [])
        .slice(0, 2)
        .map((img: any, i: number) => ({
          url: `https://image.tmdb.org/t/p/original${img.file_path}`,
          type: "BACKDROP" as const,
          displayOrder: i
        }));

      setImageAssets([...posters, ...backdrops]);

      // DIRECTLY capture YouTube URLs from TMDB without compiling to HLS/Cloudflare Stream
      const trailers = (detail.videos?.results || [])
        .filter((v: any) => v.type === "Trailer" && v.site === "YouTube")
        .slice(0, 2)
        .map((v: any) => ({
          title: v.name,
          hlsManifestUrl: `https://www.youtube.com/watch?v=${v.key}`
        }));

      setTrailerTracks(trailers);
    } catch (err) {
      console.error("TMDB Detail Hydration Error:", err);
    } finally {
      setSearching(false);
    }
  };

  // Direct Device Upload worker for Cloudflare Images
  const handleDeviceImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, targetType: "POSTER" | "BACKDROP") => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageUploading(true);
    try {
      // 1. Get a direct one-time authenticated upload URL from your server router
      const tokenRes = await fetch("/api/admin/media/image-upload-token", { method: "POST" });
      const { uploadUrl, fallbackDirectUrl } = await tokenRes.json();

      // 2. Direct upload to Cloudflare Images via standard FormData
      const uploadData = new FormData();
      uploadData.append("file", file);

      const cfRes = await fetch(uploadUrl || fallbackDirectUrl, {
        method: "POST",
        body: uploadData,
      });
      const cfData = await cfRes.json();

      if (!cfRes.ok || !cfData.result?.variants?.[0]) throw new Error("Cloudflare Images upload rejected.");

      // 3. Extract your delivered variant image production URL
      const deliveryUrl = cfData.result.variants[0];

      // Add to list, calculating the correct slot order
      const currentCount = imageAssets.filter(img => img.type === targetType).length;
      setImageAssets([...imageAssets, { url: deliveryUrl, type: targetType, displayOrder: currentCount }]);
    } catch (err) {
      console.error("Image file upload failed:", err);
      alert("Could not complete direct image upload to Cloudflare Cloud Storage.");
    } finally {
      setImageUploading(false);
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setImageAssets(imageAssets.filter((_, idx) => idx !== indexToRemove));
  };

  // Direct Device Upload worker for Trailer Videos via Cloudflare Stream (Tus protocol)
  const handleDeviceTrailerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const trackName = manualTrailerTitle.trim() || "Official Promo Track";
    setTrailerUploading(true);

    try {
      const ticketRes = await fetch("/api/admin/media/upload-ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, sizeInBytes: file.size }),
      });
      const ticket = await ticketRes.json();

      if (ticket.error) throw new Error(ticket.error);

      // 2. Run background Tus assembler worker
      const uploadWorker = new tus.Upload(file, {
        endpoint: ticket.uploadUrl,
        uploadUrl: ticket.uploadUrl,
        chunkSize: 30 * 1024 * 1024,
        metadata: { filename: file.name },
        onError: (err) => {
          alert(`Trailer upload error: ${err.message}`);
          setTrailerUploading(false);
        },
        onSuccess: () => {
          const dynamicHlsUrl = `https://customer-f3w.cloudflarestream.com/${ticket.videoId}/manifest/video.m3u8`;
          setTrailerTracks([...trailerTracks, { title: trackName, hlsManifestUrl: dynamicHlsUrl }]);
          setManualTrailerTitle("");
          setTrailerUploading(false);
        },
      });

      uploadWorker.start();
    } catch (err: any) {
      alert(`Trailer init engine failure: ${err.message}`);
      setTrailerUploading(false);
    }
  };

  const handleRemoveTrailer = (indexToRemove: number) => {
    setTrailerTracks(trailerTracks.filter((_, idx) => idx !== indexToRemove));
  };

  // Direct-to-Cloudflare Stream Tus Worker Implementation (Feature Presentation Video)
  const startChunkedVideoUpload = async () => {
    if (!mainVideoFile) return;
    setUploadProgress(1);
    setUploadStatusText("Connecting to upload server...");

    try {
      const ticketRes = await fetch("/api/admin/media/upload-ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: mainVideoFile.name, sizeInBytes: mainVideoFile.size }),
      });
      const ticket = await ticketRes.json();

      if (ticket.error) throw new Error(ticket.error);

      setUploadStatusText("Uploading video segments...");

      const uploadWorker = new tus.Upload(mainVideoFile, {
        endpoint: ticket.uploadUrl,
        uploadUrl: ticket.uploadUrl,
        chunkSize: 50 * 1024 * 1024,
        retryDelays: [0, 3000, 5000, 10000],
        metadata: { filename: mainVideoFile.name, filetype: mainVideoFile.type },
        onError: (err) => { setUploadStatusText(`Upload paused: ${err.message}`); },
        onProgress: (bytesUploaded, bytesTotal) => {
          const pct = Math.round((bytesUploaded / bytesTotal) * 100);
          setUploadProgress(pct);
        },
        onSuccess: () => {
          setUploadedVideoId(ticket.videoId);
          setUploadStatusText("Upload complete!");
        },
      });

      uploadWorker.start();
    } catch (err: any) {
      setUploadStatusText(`Upload initialization failed: ${err.message}`);
    }
  };

  // Commit structural models to Database via API Router
  const commitCompleteAssetToDb = async () => {
    setSaving(true);
    try {
      const payload = {
        ...formData,
        type: activeTab,
        categories, // Passes array of selected Category strings
        images: imageAssets, 
        trailers: trailerTracks, 
        movieVideoId: activeTab === "MOVIE" ? uploadedVideoId : undefined,
        movieDuration: activeTab === "MOVIE" ? "7200" : undefined,
        ...showConfig,
        episodeVideoId: activeTab === "SHOW" ? uploadedVideoId : undefined,
        episodeDuration: activeTab === "SHOW" ? "2700" : undefined,
      };

      const saveRes = await fetch("/api/admin/media/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const resData = await saveRes.json();

      if (!saveRes.ok) throw new Error(resData.error);

      alert("Content added to library successfully!");
    } catch (err: any) {
      alert(`Could not save title: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="workspace-container">
      <style dangerouslySetInnerHTML={{ __html: `
        .workspace-container {
          margin-top: 40px;
          background-color: #09090b;
          color: #fafafa;
          min-height: 100vh;
          padding: 2.5rem 1.5rem;
          font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        .layout-max-wrapper { max-width: 1200px; margin: 0 auto; }
        .header-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
        .heading-hero-title { font-size: 1.75rem; font-weight: 700; letter-spacing: -0.02em; margin: 0; }
        .heading-hero-caption { color: #71717a; font-size: 0.875rem; margin: 0.25rem 0 0 0; }
        .toggle-tab-group { display: flex; background-color: #18181b; padding: 0.25rem; border-radius: 0.5rem; border: 1px solid #27272a; }
        .toggle-tab-item { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; font-size: 0.875rem; font-weight: 500; border-radius: 0.375rem; border: none; cursor: pointer; background: transparent; color: #a1a1aa; transition: all 0.2s ease; }
        .toggle-tab-item:hover { color: #ffffff; }
        .toggle-tab-item.state-active { background-color: #27272a; color: #ffffff; }

        .step-number-badge { display: inline-flex; align-items: center; justify-content: center; width: 1.5rem; height: 1.5rem; border-radius: 9999px; background-color: #27272a; color: #a1a1aa; font-size: 0.75rem; font-weight: 600; margin-right: 0.5rem; }
        .panel-card-glass.active-step .step-number-badge { background-color: #e11d48; color: #ffffff; }

        .search-automation-panel { background-color: #18181b; border: 1px solid #27272a; border-radius: 0.75rem; padding: 1.25rem; margin-bottom: 2rem; position: relative; }
        .search-field-composite { display: flex; gap: 0.75rem; position: relative; margin-top: 0.75rem; }
        .input-search-control { flex: 1; background-color: #09090b; border: 1px solid #27272a; border-radius: 0.5rem; padding: 0.625rem 1rem 0.625rem 2.5rem; color: #ffffff; font-size: 0.9rem; }
        .input-search-control:focus { outline: none; border-color: #e11d48; }
        .icon-search-embedded { position: absolute; left: 0.875rem; top: 50%; transform: translateY(-50%); color: #71717a; width: 1rem; height: 1rem; }

        .search-results-dropdown { position: absolute; top: 102%; left: 1.25rem; right: 1.25rem; background-color: #18181b; border: 1px solid #27272a; border-radius: 0.5rem; z-index: 50; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5); max-height: 320px; overflow-y: auto; padding: 0.35rem; }
        .search-result-row { display: flex; align-items: center; gap: 0.75rem; padding: 0.5rem; border-radius: 0.375rem; cursor: pointer; transition: background-color 0.15s ease; }
        .search-result-row:hover { background-color: #27272a; }
        .search-result-thumb { width: 40px; height: 56px; object-fit: cover; border-radius: 0.25rem; background-color: #09090b; flex-shrink: 0; }
        .search-result-meta { display: flex; flex-direction: column; }
        .search-result-title { font-size: 0.875rem; font-weight: 500; color: #ffffff; }
        .search-result-year { font-size: 0.75rem; color: #71717a; margin-top: 0.15rem; }
        
        .split-grid-layout { display: grid; grid-template-columns: 1.6fr 1fr; gap: 2rem; }
        @media (max-width: 1024px) { .split-grid-layout { grid-template-columns: 1fr; } }
        .panel-card-glass { background-color: #18181b; border: 1px solid #27272a; border-radius: 0.75rem; padding: 1.5rem; margin-bottom: 1.5rem; }
        .panel-grid-inner { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }
        .grid-col-full { grid-column: span 2; }
        
        .input-group-wrapper label { display: flex; align-items: center; gap: 0.35rem; font-size: 0.8rem; color: #a1a1aa; font-weight: 500; margin-bottom: 0.375rem; }
        .input-help-tip { font-size: 0.75rem; color: #71717a; margin-top: 0.35rem; }
        .input-text-field, .input-textbox-field { width: 100%; background-color: #09090b; border: 1px solid #27272a; border-radius: 0.375rem; padding: 0.5rem 0.75rem; color: #fafafa; font-size: 0.875rem; box-sizing: border-box; }
        .input-text-field:focus, .input-textbox-field:focus { outline: none; border-color: #e11d48; }
        
        /* Categories and Badges UI Styles */
        .category-input-container { display: flex; gap: 0.5rem; margin-top: 0.25rem; }
        .badge-pills-wrap { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.75rem; }
        .category-badge-pill { display: inline-flex; align-items: center; gap: 0.25rem; background-color: #27272a; border: 1px solid #3f3f46; color: #fafafa; font-size: 0.75rem; font-weight: 500; padding: 0.25rem 0.6rem; border-radius: 9999px; }
        .btn-badge-remove { display: inline-flex; align-items: center; justify-content: center; width: 0.85rem; height: 0.85rem; border-radius: 9999px; background: transparent; border: none; color: #71717a; cursor: pointer; padding: 0; }
        .btn-badge-remove:hover { color: #ef4444; background: rgba(239, 68, 68, 0.1); }
        .btn-category-append { background: #27272a; color: #ffffff; border: 1px solid #3f3f46; border-radius: 0.375rem; padding: 0.5rem; cursor: pointer; display: flex; align-items: center; justify-content: center; }
        .btn-category-append:hover { background: #3f3f46; }

        .gallery-display-matrix { display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 0.75rem; margin-top: 1rem; }
        .gallery-card-item { background-color: #09090b; border: 1px solid #27272a; border-radius: 0.5rem; padding: 0.5rem; position: relative; }
        .gallery-card-item:hover .delete-overlay { opacity: 1; }
        .delete-overlay { position: absolute; top: 0.5rem; right: 0.5rem; background: rgba(9, 9, 11, 0.85); border: 1px solid #27272a; border-radius: 0.25rem; padding: 0.25rem; cursor: pointer; opacity: 0; transition: opacity 0.15s ease; color: #ef4444; }
        .delete-overlay:hover { background: #ef4444; color: #ffffff; }
        .asset-preview-render { width: 100%; height: 110px; object-fit: cover; border-radius: 0.25rem; margin-bottom: 0.5rem; }
        
        .sticky-sidebar-container { position: sticky; top: 2rem; }
        .interactive-dropzone-box { border: 2px dashed #27272a; border-radius: 0.75rem; padding: 2rem 1rem; text-align: center; position: relative; background: #09090b; cursor: pointer; }
        .interactive-dropzone-box:hover { border-color: #71717a; }
        .hidden-native-input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
        
        .pipeline-status-container { background-color: #09090b; border: 1px solid #27272a; padding: 1rem; border-radius: 0.5rem; margin-top: 1rem; }
        .progressbar-track { width: 100%; height: 6px; background-color: #27272a; border-radius: 9999px; overflow: hidden; margin-top: 0.5rem; }
        .progressbar-indicator { height: 100%; background: #e11d48; transition: width 0.2s ease; }
        
        .btn-execution-commit { width: 100%; background: #fafafa; color: #09090b; padding: 0.75rem; border-radius: 0.5rem; font-weight: 600; font-size: 0.875rem; border: none; cursor: pointer; margin-top: 1.25rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem; transition: background-color 0.2s ease; }
        .btn-execution-commit:hover:not(:disabled) { background-color: #e4e4e7; }
        .btn-execution-commit:disabled { background-color: #27272a; color: #71717a; cursor: not-allowed; }

        .image-uploader-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 0.5rem; }
        .mini-device-uploader { background-color: #09090b; border: 1px dashed #27272a; border-radius: 0.5rem; padding: 1rem; text-align: center; position: relative; cursor: pointer; transition: border-color 0.15s ease; }
        .mini-device-uploader:hover { border-color: #52525b; }
      ` }} />

      <div className="layout-max-wrapper">
        
        {/* Header Controller */}
        <div className="header-bar">
          <div>
            <h1 className="heading-hero-title">Add New Catalog Title</h1>
            <p className="heading-hero-caption">Input assets fully manually, or use smart autocomplete tracking variables.</p>
          </div>
          <div className="toggle-tab-group">
            <button 
              onClick={() => { setActiveTab("MOVIE"); setImageAssets([]); setTrailerTracks([]); setCategories([]); }}
              className={`toggle-tab-item ${activeTab === "MOVIE" ? "state-active" : ""}`}
            >
              <Film style={{ width: "0.875rem", height: "0.875rem" }} /> Movie
            </button>
            <button 
              onClick={() => { setActiveTab("SHOW"); setImageAssets([]); setTrailerTracks([]); setCategories([]); }}
              className={`toggle-tab-item ${activeTab === "SHOW" ? "state-active" : ""}`}
            >
              <Tv style={{ width: "0.875rem", height: "0.875rem" }} /> TV Episode
            </button>
          </div>
        </div>

        {/* Step 1: Dynamic Suggestion Search Dropdown Wrapper */}
        <div className="search-automation-panel">
          <h2 style={{ fontSize: "0.9rem", fontWeight: 600, margin: 0, display: "flex", alignItems: "center" }}>
            <span className="step-number-badge">1</span> Search TMDB Suggestion Library (Optional)
          </h2>
          <div className="search-field-composite">
            <Search className="icon-search-embedded" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery.trim() && setShowDropdown(true)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
              placeholder={activeTab === "MOVIE" ? "Type movie title to see suggestions..." : "Type TV show title to see suggestions..."}
              className="input-search-control"
            />
            {searching && (
              <div style={{ position: "absolute", right: "1rem", top: "50%", transform: "translateY(-50%)" }}>
                <Loader2 style={{ width: "1.15rem", height: "1.15rem", animation: "spin 1s linear infinite", color: "#e11d48" }} />
              </div>
            )}
          </div>

          {/* Dynamic Popup Suggestion Dropdown */}
          {showDropdown && searchResults.length > 0 && (
            <div className="search-results-dropdown">
              {searchResults.map((result) => {
                const titleText = result.title || result.name;
                const rawDate = result.release_date || result.first_air_date || "";
                const yearText = rawDate ? `(${rawDate.split("-")[0]})` : "";
                const thumbnailSrc = result.poster_path 
                  ? `https://image.tmdb.org/t/p/w92${result.poster_path}`
                  : "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='56' viewBox='0 0 40 56'><rect width='40' height='56' fill='%2327272a'/></svg>";

                return (
                  <div key={result.id} onMouseDown={() => handleSelectTitle(result)} className="search-result-row">
                    <img src={thumbnailSrc} className="search-result-thumb" alt="Thumbnail" />
                    <div className="search-result-meta">
                      <span className="search-result-title">{titleText}</span>
                      <span className="search-result-year">{activeTab === "MOVIE" ? "Movie" : "TV"} {yearText}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="split-grid-layout">
          {/* Step 2: Form Details Layout */}
          <div>
            <div className={`panel-card-glass ${formData.title ? "active-step" : ""}`}>
              <h2 style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: "1.25rem", marginTop: 0, display: "flex", alignItems: "center" }}>
                <span className="step-number-badge">2</span> Title Information
              </h2>
              <div className="panel-grid-inner">
                <div className="grid-col-full">
                  <div className="input-group-wrapper">
                    <label><FileText style={{ width: "0.85rem", height: "0.85rem" }} /> Display Title</label>
                    <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="e.g. My Beautiful Film" className="input-text-field" />
                  </div>
                </div>
                <div>
                  <div className="input-group-wrapper">
                    <label>URL Slug</label>
                    <input type="text" value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} placeholder="my-beautiful-film" className="input-text-field" />
                  </div>
                </div>
                <div>
                  <div className="input-group-wrapper">
                    <label>TMDB ID</label>
                    <input type="text" value={formData.tmdbId} onChange={(e) => setFormData({ ...formData, tmdbId: e.target.value })} placeholder="Internal tracking ID (Optional)" className="input-text-field" />
                  </div>
                </div>
                <div>
                  <div className="input-group-wrapper">
                    <label>Release Year</label>
                    <input type="text" value={formData.releaseYear} onChange={(e) => setFormData({ ...formData, releaseYear: e.target.value })} className="input-text-field" />
                  </div>
                </div>
                <div>
                  <div className="input-group-wrapper">
                    <label>Maturity Rating</label>
                    <input type="text" value={formData.maturityRatingCode} onChange={(e) => setFormData({ ...formData, maturityRatingCode: e.target.value })} className="input-text-field" />
                  </div>
                </div>

                {/* Multiple Categories Segment (Added/Autofilled from TMDB) */}
                <div className="grid-col-full">
                  <div className="input-group-wrapper">
                    <label><Tag style={{ width: "0.85rem", height: "0.85rem" }} /> Catalog Categories / Genres (Add Multiple)</label>
                    <div className="category-input-container">
                      <input 
                        type="text" 
                        value={newCategoryInput} 
                        onChange={(e) => setNewCategoryInput(e.target.value)} 
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddCategory(); } }}
                        placeholder="Type category (e.g. Action) and press Enter or plus button..." 
                        className="input-text-field" 
                      />
                      <button type="button" onClick={handleAddCategory} className="btn-category-append" title="Add Category">
                        <Plus style={{ width: "1rem", height: "1rem" }} />
                      </button>
                    </div>
                    {categories.length > 0 && (
                      <div className="badge-pills-wrap">
                        {categories.map((cat, i) => (
                          <span key={i} className="category-badge-pill">
                            {cat}
                            <button type="button" onClick={() => handleRemoveCategory(cat)} className="btn-badge-remove" title={`Remove ${cat}`}>
                              <X style={{ width: "0.65rem", height: "0.65rem" }} />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid-col-full">
                  <div className="input-group-wrapper">
                    <label>Short Description</label>
                    <textarea value={formData.description} rows={2} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="A short 1-2 sentence preview clip info summary..." className="input-text-field" style={{ fontFamily: "inherit" }} />
                  </div>
                </div>
                <div className="grid-col-full">
                  <div className="input-group-wrapper">
                    <label>Tagline / Extended Storyline</label>
                    <textarea value={formData.storyline} rows={3} onChange={(e) => setFormData({ ...formData, storyline: e.target.value })} placeholder="The official theater tagline or contextual backstory text hooks..." className="input-textbox-field" style={{ fontFamily: "inherit" }} />
                  </div>
                </div>
              </div>
            </div>

            {activeTab === "SHOW" && (
              <div className="panel-card-glass active-step">
                <h2 style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: "1.25rem", marginTop: 0 }}>TV Season & Episode Mapping</h2>
                <div className="panel-grid-inner">
                  <div>
                    <div className="input-group-wrapper">
                      <label>Season Number</label>
                      <input type="number" value={showConfig.seasonNumber} onChange={(e) => setShowConfig({ ...showConfig, seasonNumber: e.target.value })} className="input-text-field" />
                    </div>
                  </div>
                  <div>
                    <div className="input-group-wrapper">
                      <label>Episode Number</label>
                      <input type="number" value={showConfig.episodeNumber} onChange={(e) => setShowConfig({ ...showConfig, episodeNumber: e.target.value })} className="input-text-field" />
                    </div>
                  </div>
                  <div className="grid-col-full">
                    <div className="input-group-wrapper">
                      <label>Episode Title</label>
                      <input type="text" value={showConfig.episodeTitle} onChange={(e) => setShowConfig({ ...showConfig, episodeTitle: e.target.value })} placeholder="Leave blank to use series master title context..." className="input-text-field" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Cloudflare Storage Direct Image Uploader */}
            <div className="panel-card-glass">
              <h3 style={{ fontSize: "0.8rem", color: "#a1a1aa", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 0.5rem 0" }}>Graphic Assets & Mockups</h3>
              <p style={{ fontSize: "0.75rem", color: "#71717a", margin: "0 0 1rem 0" }}>TMDB image URLs populate instantly. Upload files here to replace them with custom Cloudflare CDN targets instead.</p>
              
              <div className="image-uploader-grid">
                <div className="mini-device-uploader">
                  <input type="file" accept="image/*" disabled={imageUploading} onChange={(e) => handleDeviceImageUpload(e, "POSTER")} className="hidden-native-input" />
                  <ImageIcon style={{ width: "1.25rem", height: "1.25rem", color: "#38bdf8", marginBottom: "0.25rem" }} />
                  <div style={{ fontSize: "0.8rem", fontWeight: 500 }}>Upload Poster File</div>
                </div>
                
                <div className="mini-device-uploader">
                  <input type="file" accept="image/*" disabled={imageUploading} onChange={(e) => handleDeviceImageUpload(e, "BACKDROP")} className="hidden-native-input" />
                  <ImageIcon style={{ width: "1.25rem", height: "1.25rem", color: "#c084fc", marginBottom: "0.25rem" }} />
                  <div style={{ fontSize: "0.8rem", fontWeight: 500 }}>Upload Backdrop File</div>
                </div>
              </div>

              {imageUploading && (
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", fontSize: "0.75rem", color: "#a1a1aa", marginTop: "1rem" }}>
                  <Loader2 style={{ width: "0.9rem", height: "0.9rem", animation: "spin 1s linear infinite" }} />
                  Uploading and configuring Cloudflare Image variant...
                </div>
              )}

              {imageAssets.length > 0 && (
                <div className="gallery-display-matrix">
                  {imageAssets.map((img, i) => (
                    <div key={i} className="gallery-card-item">
                      <img src={img.url} className="asset-preview-render" alt="Preview item" />
                      <button type="button" onClick={() => handleRemoveImage(i)} className="delete-overlay" title="Delete Image">
                        <Trash2 style={{ width: "0.85rem", height: "0.85rem" }} />
                      </button>
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px", fontSize: "0.65rem", color: "#a1a1aa", marginTop: "4px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ color: img.type === "POSTER" ? "#38bdf8" : "#c084fc", fontWeight: 600 }}>{img.type}</span>
                          <span>Slot {img.displayOrder}</span>
                        </div>
                        <span style={{ 
                          color: img.url.includes("cloudflare") ? "#10b981" : "#f59e0b",
                          fontSize: "0.65rem",
                          textTransform: "uppercase",
                          fontWeight: 700 
                        }}>
                          {img.url.includes("cloudflare") ? "Cloudflare Storage" : "TMDB Direct"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cloudflare Stream Trailer Uploader */}
            <div className="panel-card-glass">
              <h3 style={{ fontSize: "0.8rem", color: "#a1a1aa", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 1rem 0" }}>Trailers & Extra Promotional Tracks</h3>
              <p style={{ fontSize: "0.75rem", color: "#71717a", margin: "-0.5rem 0 1rem 0" }}>Shows YouTube trailers by default. Upload video files to output high-performance HLS streams from Cloudflare.</p>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <div className="input-group-wrapper">
                  <label>Promo Track Label Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Official Cinematic Trailer 1" 
                    value={manualTrailerTitle} 
                    onChange={(e) => setManualTrailerTitle(e.target.value)} 
                    className="input-text-field" 
                  />
                </div>

                <div className="interactive-dropzone-box" style={{ padding: "1.25rem" }}>
                  <input type="file" accept="video/*" disabled={trailerUploading} onChange={handleDeviceTrailerUpload} className="hidden-native-input" />
                  <UploadCloud style={{ width: "1.5rem", height: "1.5rem", color: "#e11d48", marginBottom: "0.25rem" }} />
                  <p style={{ fontSize: "0.8rem", color: "#ffffff", margin: 0, fontWeight: 500 }}>
                    {trailerUploading ? "Uploading video clip file..." : "Click or drop a trailer video clip file to upload directly"}
                  </p>
                </div>
              </div>

              {trailerTracks.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "1rem" }}>
                  {trailerTracks.map((tr, i) => {
                    const isCloudflare = tr.hlsManifestUrl.includes("cloudflare");
                    return (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 0.75rem", backgroundColor: "#09090b", border: "1px solid #27272a", borderRadius: "0.375rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", overflow: "hidden", width: "100%" }}>
                          <Link style={{ width: "0.85rem", height: "0.85rem", color: isCloudflare ? "#10b981" : "#f59e0b", flexShrink: 0 }} />
                          <div style={{ display: "flex", flexDirection: "column", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            <span style={{ fontSize: "0.85rem", color: "#fafafa", fontWeight: 500 }}>{tr.title}</span>
                            <span style={{ fontSize: "0.75rem", color: "#71717a", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>{tr.hlsManifestUrl}</span>
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <span style={{ 
                            fontSize: "0.6rem", 
                            padding: "0.15rem 0.35rem", 
                            borderRadius: "0.25rem",
                            fontWeight: 700,
                            backgroundColor: isCloudflare ? "rgba(16, 185, 129, 0.15)" : "rgba(245, 158, 11, 0.15)",
                            color: isCloudflare ? "#10b981" : "#f59e0b"
                          }}>
                            {isCloudflare ? "HLS" : "YouTube"}
                          </span>
                          <button type="button" onClick={() => handleRemoveTrailer(i)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#71717a" }} title="Remove Trailer">
                            <Trash2 style={{ width: "0.95rem", height: "0.95rem" }} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Step 3: Media File Dropzone Side Rail */}
          <div className="sticky-sidebar-container">
            <div className={`panel-card-glass ${mainVideoFile ? "active-step" : ""}`}>
              <h2 style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: "1.25rem", marginTop: 0, display: "flex", alignItems: "center" }}>
                <span className="step-number-badge">3</span> Video Media Stream
              </h2>

              <div className="interactive-dropzone-box">
                <input type="file" accept="video/*" onChange={(e) => setMainVideoFile(e.target.files?.[0] || null)} className="hidden-native-input" />
                <UploadCloud style={{ width: "2rem", height: "2rem", color: "#71717a", marginBottom: "0.5rem" }} />
                <p style={{ fontSize: "0.85rem", color: "#ffffff", margin: 0, fontWeight: 500 }}>
                  {mainVideoFile ? mainVideoFile.name : "Select master source video file"}
                </p>
                <p className="input-help-tip">Supports .mp4, .mkv, .mov up to 4K resolution</p>
              </div>

              {mainVideoFile && !uploadedVideoId && (
                <button onClick={startChunkedVideoUpload} className="btn-execution-commit" style={{ backgroundColor: "#e11d48", color: "#ffffff" }}>
                  Start Uploading Video File
                </button>
              )}

              {uploadProgress > 0 && (
                <div className="pipeline-status-container">
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem" }}>
                    <span style={{ color: "#a1a1aa" }}>{uploadStatusText}</span>
                    <span style={{ color: "#ffffff", fontWeight: 600 }}>{uploadProgress}%</span>
                  </div>
                  <div className="progressbar-track">
                    <div className="progressbar-indicator" style={{ width: `${uploadProgress}%` }} />
                  </div>
                </div>
              )}

              {uploadedVideoId && (
                <div style={{ backgroundColor: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.2)", padding: "0.75rem 1rem", borderRadius: "0.5rem", display: "flex", gap: "0.5rem", alignItems: "center", marginTop: "1rem" }}>
                  <CheckCircle style={{ width: "1.25rem", height: "1.25rem", color: "#10b981", flexShrink: 0 }} />
                  <p style={{ fontSize: "0.85rem", fontWeight: 500, color: "#10b981", margin: 0 }}>Ready to link to network stream</p>
                </div>
              )}

              {/* Step 4: System Commit Wrapper */}
              <div style={{ marginTop: "2rem", paddingTop: "1.25rem", borderTop: "1px solid #27272a" }}>
                <button
                  onClick={commitCompleteAssetToDb}
                  disabled={saving || !formData.title || !uploadedVideoId}
                  className="btn-execution-commit"
                >
                  {saving ? <Loader2 style={{ width: "1rem", height: "1rem", animation: "spin 1s linear infinite" }} /> : "Save Complete Title to Catalog"}
                </button>
                
                {(!formData.title || !uploadedVideoId) && (
                  <p style={{ display: "flex", gap: "0.35rem", fontSize: "0.75rem", color: "#71717a", marginTop: "0.75rem", lineHeight: "1.3" }}>
                    <Info style={{ width: "0.85rem", height: "0.85rem", flexShrink: 0, color: "#a1a1aa" }} />
                    Please ensure you have filled out the Title Name and completed your Video Upload before submitting.
                  </p>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}