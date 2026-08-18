"use client";

import React, { useState, useEffect } from "react";
import { Plus, Search, Check, X, Layers, Film, Loader2 } from "lucide-react";

export default function AdminCollectionsPage() {
  const [collections, setCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [collectionName, setCollectionName] = useState("");
  const [collectionDescription, setCollectionDescription] = useState("");
  
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [selectedContent, setSelectedContent] = useState<any[]>([]);

  const fetchCollections = async () => {
    try {
      const res = await fetch("/api/admin/collections");
      const data = await res.json();
      if (Array.isArray(data)) setCollections(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowSearch(false);
      return;
    }
    const delay = setTimeout(async () => {
      try {
        const res = await fetch("/api/admin/content/search?q=" + encodeURIComponent(searchQuery));
        const data = await res.json();
        setSearchResults(data.results || []);
        setShowSearch(true);
      } catch (err) {
        console.error(err);
      }
    }, 400);
    return () => clearTimeout(delay);
  }, [searchQuery]);

  const handleAddContent = (item: any) => {
    if (!selectedContent.find((c) => c.id === item.id)) {
      setSelectedContent([...selectedContent, item]);
    }
    setSearchQuery("");
    setShowSearch(false);
  };

  const handleRemoveContent = (id: string) => {
    setSelectedContent(selectedContent.filter((c) => c.id !== id));
  };

  const handleCreateCollection = async () => {
    if (!collectionName.trim()) {
      alert("Please enter a collection name");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/admin/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: collectionName,
          description: collectionDescription,
          contentIds: selectedContent.map((c) => c.id),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create collection");
      
      setCollectionName("");
      setCollectionDescription("");
      setSelectedContent([]);
      setShowCreateForm(false);
      await fetchCollections();
      alert("Collection created successfully!");
    } catch (err: any) {
      alert("Could not create collection: " + err.message);
    } finally {
      setCreating(false);
    }
  };

  const containerStyle: React.CSSProperties = {
    background: "#09090b",
    color: "#fafafa",
    minHeight: "100vh",
    padding: "2.5rem 1.5rem",
    fontFamily: "ui-sans-serif, system-ui, sans-serif",
  };

  const maxWidth: React.CSSProperties = { maxWidth: "1200px", margin: "0 auto" };
  const cardStyle: React.CSSProperties = { background: "#18181b", border: "1px solid #27272a", borderRadius: "0.75rem", padding: "1.5rem", marginBottom: "1.5rem" };
  const inputStyle: React.CSSProperties = { width: "100%", background: "#09090b", border: "1px solid #27272a", borderRadius: "0.375rem", padding: "0.5rem 0.75rem", color: "#fafafa", fontSize: "0.875rem", boxSizing: "border-box" };
  const btnPrimary: React.CSSProperties = { background: "#e11d48", color: "#fff", padding: "0.75rem 1.5rem", borderRadius: "0.5rem", fontSize: "0.875rem", fontWeight: 600, border: "none", cursor: "pointer" };
  const btnSecondary: React.CSSProperties = { background: "#27272a", color: "#fafafa", padding: "0.75rem 1.5rem", borderRadius: "0.5rem", fontSize: "0.875rem", fontWeight: 600, border: "1px solid #3f3f46", cursor: "pointer" };
  const searchInputWrap: React.CSSProperties = { display: "flex", gap: "0.75rem", position: "relative", marginTop: "0.75rem" };

  return (
    <div style={containerStyle}>
      <div style={maxWidth}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
          <div>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 700, margin: 0 }}>Collections</h1>
            <p style={{ color: "#71717a", fontSize: "0.875rem", margin: "0.25rem 0 0 0" }}>Group movies and shows into curated collections for homepage rows.</p>
          </div>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            style={showCreateForm ? btnSecondary : btnPrimary}
          >
            <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              {showCreateForm ? <X size={16} /> : <Plus size={16} />}
              {showCreateForm ? "Cancel" : "New Collection"}
            </span>
          </button>
        </div>

        {showCreateForm && (
          <div style={cardStyle}>
            <h3 style={{ fontSize: "1rem", fontWeight: 600, margin: "0 0 1rem 0", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Layers size={16} /> Create New Collection
            </h3>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <label style={{ fontSize: "0.8rem", color: "#a1a1aa", marginBottom: "0.375rem", display: "block" }}>Collection Name *</label>
                <input
                  type="text"
                  value={collectionName}
                  onChange={(e) => setCollectionName(e.target.value)}
                  placeholder="e.g. Marvel Cinematic Universe"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ fontSize: "0.8rem", color: "#a1a1aa", marginBottom: "0.375rem", display: "block" }}>Description</label>
                <input
                  type="text"
                  value={collectionDescription}
                  onChange={(e) => setCollectionDescription(e.target.value)}
                  placeholder="Short description of this collection"
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ marginTop: "1.5rem" }}>
              <label style={{ fontSize: "0.8rem", color: "#a1a1aa", marginBottom: "0.375rem", display: "block" }}>Add Content to Collection</label>
              <div style={searchInputWrap}>
                <Search style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "#71717a", width: "1rem", height: "1rem" }} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search your catalog for movies/shows..."
                  style={{ ...inputStyle, paddingLeft: "2.5rem" }}
                />
              </div>

              {showSearch && searchResults.length > 0 && (
                <div style={{ marginTop: "0.5rem", background: "#09090b", border: "1px solid #27272a", borderRadius: "0.5rem", maxHeight: "250px", overflowY: "auto" }}>
                  {searchResults.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleAddContent(item)}
                      style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.5rem 0.75rem", cursor: "pointer", borderBottom: "1px solid #27272a" }}
                    >
                      <img src={item.posterUrl} alt="" style={{ width: "32px", height: "44px", objectFit: "cover", borderRadius: "0.25rem", background: "#27272a" }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "0.85rem", fontWeight: 500 }}>{item.title}</div>
                        <div style={{ fontSize: "0.7rem", color: "#71717a" }}>{item.releaseYear} · {item.type}</div>
                      </div>
                      <Plus size={14} style={{ color: "#a1a1aa" }} />
                    </div>
                  ))}
                </div>
              )}

              {selectedContent.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "1rem" }}>
                  {selectedContent.map((item) => (
                    <span key={item.id} style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", background: "#27272a", border: "1px solid #3f3f46", color: "#fafafa", fontSize: "0.75rem", padding: "0.35rem 0.6rem", borderRadius: "9999px" }}>
                      <Film size={12} />
                      {item.title}
                      <button onClick={() => handleRemoveContent(item.id)} style={{ background: "transparent", border: "none", color: "#71717a", cursor: "pointer", display: "flex" }}>
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div style={{ marginTop: "1.5rem", display: "flex", justifyContent: "flex-end" }}>
              <button onClick={handleCreateCollection} disabled={creating} style={{ ...btnPrimary, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                {creating ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Check size={14} />}
                {creating ? "Creating..." : "Create Collection"}
              </button>
            </div>
          </div>
        )}

        <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "1rem" }}>Existing Collections</h2>

        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "#71717a" }}>
            <Loader2 size={24} style={{ animation: "spin 1s linear infinite", marginBottom: "0.5rem" }} />
            Loading collections...
          </div>
        ) : collections.length === 0 ? (
          <div style={{ ...cardStyle, textAlign: "center", padding: "3rem" }}>
            <Layers size={32} style={{ color: "#71717a", marginBottom: "0.5rem" }} />
            <p style={{ color: "#a1a1aa", fontSize: "0.9rem" }}>No collections yet. Click "New Collection" to create your first one.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
            {collections.map((col) => (
              <div key={col.id} style={cardStyle}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                  <h3 style={{ fontSize: "1rem", fontWeight: 600, margin: 0 }}>{col.name}</h3>
                  <span style={{ fontSize: "0.7rem", color: "#71717a" }}>{col.items?.length || 0} items</span>
                </div>
                {col.description && <p style={{ fontSize: "0.8rem", color: "#a1a1aa", margin: "0 0 0.75rem 0" }}>{col.description}</p>}
                {col.items?.length > 0 && (
                  <div style={{ display: "flex", gap: "0.25rem", overflow: "hidden" }}>
                    {col.items.slice(0, 5).map((item: any) => (
                      <img
                        key={item.contentId}
                        src={item.content?.images?.[0]?.url || ""}
                        alt={item.content?.title}
                        style={{ width: "50px", height: "70px", objectFit: "cover", borderRadius: "0.25rem", background: "#09090b", flexShrink: 0 }}
                      />
                    ))}
                  </div>
                )}
                {col.items?.length > 0 && (
                  <div style={{ marginTop: "0.75rem", display: "flex", flexWrap: "wrap", gap: "0.25rem" }}>
                    {col.items.slice(0, 3).map((item: any) => (
                      <span key={item.contentId} style={{ fontSize: "0.65rem", color: "#a1a1aa", background: "#09090b", padding: "0.2rem 0.4rem", borderRadius: "0.25rem" }}>
                        {item.content?.title}
                      </span>
                    ))}
                    {col.items.length > 3 && (
                      <span style={{ fontSize: "0.65rem", color: "#71717a" }}>+{col.items.length - 3} more</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}