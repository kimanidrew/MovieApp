"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

// Mock initial data state to make the dashboard functional out of the box
const INITIAL_CONTENT = [
  { id: "1", title: "Stranger Things", type: "SHOW", genre: "Sci-Fi", releaseYear: "2022", status: "Published" },
  { id: "2", title: "The Gray Man", type: "MOVIE", genre: "Action", releaseYear: "2024", status: "Published" },
  { id: "3", title: "Wednesday", type: "SHOW", genre: "Fantasy", releaseYear: "2023", status: "Published" },
];

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"overview" | "upload" | "catalog">("overview");
  const [contentList, setContentList] = useState(INITIAL_CONTENT);

  // Upload Form State
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"MOVIE" | "SHOW">("MOVIE");
  const [genre, setGenre] = useState("Action");
  const [releaseYear, setReleaseYear] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ text: "", isError: false });

  // Handle media submission emulation
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ text: "", isError: false });
    setUploading(true);

    // Form parameter validation block
    if (!title || !releaseYear || !thumbnailUrl) {
      setMessage({ text: "Please supply a title, publication year, and artwork link.", isError: true });
      setUploading(false);
      return;
    }

    try {
      // Simulate API network handshake roundtrip
      await new Promise((resolve) => setTimeout(resolve, 1200));

      const newAsset = {
        id: crypto.randomUUID(),
        title,
        type,
        genre,
        releaseYear,
        status: "Published",
      };

      // Append data locally to state catalog
      setContentList([newAsset, ...contentList]);
      setMessage({ text: `Successfully cataloged asset: "${title}"`, isError: false });
      
      // Clean up input fields
      setTitle("");
      setReleaseYear("");
      setDescription("");
      setThumbnailUrl("");
      setVideoUrl("");
      setActiveTab("catalog"); // Route to list viewport automatically
    } catch (err) {
      setMessage({ text: "Failed to persist asset configuration parameters.", isError: true });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0f172a", color: "#f8fafc", fontFamily: "system-ui, sans-serif" }}>
      
      {/* SIDEBAR NAVIGATION PANEL */}
      <aside style={{ width: "260px", background: "#1e293b", borderRight: "1px solid #334155", display: "flex", flexDirection: "column", padding: "24px" }}>
        <div style={{ marginBottom: "32px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#3b82f6", margin: "0 0 4px 0" }}>MovieFlix Engine</h2>
          <span style={{ fontSize: "12px", color: "#94a3b8" }}>System Control Panel</span>
        </div>

        <nav style={{ display: "flex", flexDirection: "column", gap: "8px", flexGrow: 1 }}>
          <button
            onClick={() => setActiveTab("overview")}
            style={{
              display: "flex", padding: "12px 16px", borderRadius: "6px", border: "none", cursor: "pointer", fontSize: "14px", fontWeight: "500", textAlign: "left",
              background: activeTab === "overview" ? "#2563eb" : "transparent", color: activeTab === "overview" ? "#fff" : "#cbd5e1"
            }}
          >
            Dashboard Overview
          </button>
          <button
            onClick={() => setActiveTab("upload")}
            style={{
              display: "flex", padding: "12px 16px", borderRadius: "6px", border: "none", cursor: "pointer", fontSize: "14px", fontWeight: "500", textAlign: "left",
              background: activeTab === "upload" ? "#2563eb" : "transparent", color: activeTab === "upload" ? "#fff" : "#cbd5e1"
            }}
          >
            Upload Media Asset
          </button>
          <button
            onClick={() => setActiveTab("catalog")}
            style={{
              display: "flex", padding: "12px 16px", borderRadius: "6px", border: "none", cursor: "pointer", fontSize: "14px", fontWeight: "500", textAlign: "left",
              background: activeTab === "catalog" ? "#2563eb" : "transparent", color: activeTab === "catalog" ? "#fff" : "#cbd5e1"
            }}
          >
            Manage Catalog ({contentList.length})
          </button>
        </nav>

        <button
          onClick={() => router.push("/admin/login")}
          style={{ padding: "12px", background: "transparent", color: "#ef4444", border: "1px solid #ef4444", borderRadius: "6px", cursor: "pointer", fontSize: "14px", fontWeight: "600" }}
        >
          Disconnect Session
        </button>
      </aside>

      {/* PRIMARY DESKTOP WORKSPACE */}
      <main style={{ flexGrow: 1, padding: "40px", overflowY: "auto" }}>
        
        {/* VIEWPORT HEADER TAB INDICATOR */}
        <header style={{ marginBottom: "32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: "600", margin: "0 0 4px 0" }}>
              {activeTab === "overview" && "System Infrastructure Metrics"}
              {activeTab === "upload" && "Ingest New Video Asset"}
              {activeTab === "catalog" && "Platform Title Repository"}
            </h1>
            <p style={{ color: "#94a3b8", margin: 0, fontSize: "14px" }}>Manage platform metadata structures globally.</p>
          </div>
        </header>

        {message.text && (
          <div style={{ background: message.isError ? "#ef4444" : "#10b981", color: "white", padding: "12px 20px", borderRadius: "6px", marginBottom: "24px", fontSize: "14px" }}>
            {message.text}
          </div>
        )}

        {/* TAB WORKSPACE ROUTING CONDITIONAL */}
        {activeTab === "overview" && (
          <div>
            {/* AGGREGATED METRIC CARDS */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "24px", marginBottom: "40px" }}>
              <div style={{ background: "#1e293b", padding: "24px", borderRadius: "8px", border: "1px solid #334155" }}>
                <span style={{ color: "#94a3b8", fontSize: "14px" }}>Total Catalog Titles</span>
                <div style={{ fontSize: "32px", fontWeight: "700", marginTop: "8px", color: "#3b82f6" }}>{contentList.length} Items</div>
              </div>
              <div style={{ background: "#1e293b", padding: "24px", borderRadius: "8px", border: "1px solid #334155" }}>
                <span style={{ color: "#94a3b8", fontSize: "14px" }}>Active Network Connections</span>
                <div style={{ fontSize: "32px", fontWeight: "700", marginTop: "8px", color: "#10b981" }}>1,482 Streams</div>
              </div>
              <div style={{ background: "#1e293b", padding: "24px", borderRadius: "8px", border: "1px solid #334155" }}>
                <span style={{ color: "#94a3b8", fontSize: "14px" }}>Bandwidth Allocation Peak</span>
                <div style={{ fontSize: "32px", fontWeight: "700", marginTop: "8px", color: "#a855f7" }}>4.2 Gbps</div>
              </div>
            </div>

            <h3 style={{ fontSize: "18px", marginBottom: "16px" }}>Recent Ingest Actions</h3>
            <div style={{ background: "#1e293b", borderRadius: "8px", border: "1px solid #334155", padding: "16px" }}>
              <p style={{ color: "#94a3b8", margin: 0, fontSize: "14px" }}>All cluster origin transcoders are running normally.</p>
            </div>
          </div>
        )}

        {activeTab === "upload" && (
          <div style={{ background: "#1e293b", padding: "32px", borderRadius: "8px", border: "1px solid #334155", maxWidth: "800px" }}>
            <form onSubmit={handleUploadSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "14px", color: "#cbd5e1" }}>Title Name</label>
                  <input
                    type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Inception" required
                    style={{ padding: "12px", borderRadius: "6px", background: "#0f172a", border: "1px solid #334155", color: "#fff" }}
                  />
                </div>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "14px", color: "#cbd5e1" }}>Media Category Type</label>
                  <select
                    value={type} onChange={(e) => setType(e.target.value as "MOVIE" | "SHOW")}
                    style={{ padding: "12px", borderRadius: "6px", background: "#0f172a", border: "1px solid #334155", color: "#fff", cursor: "pointer" }}
                  >
                    <option value="MOVIE">Feature Film (Movie)</option>
                    <option value="SHOW">Episodic Content (TV Show)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "14px", color: "#cbd5e1" }}>Genre Classification</label>
                  <select
                    value={genre} onChange={(e) => setGenre(e.target.value)}
                    style={{ padding: "12px", borderRadius: "6px", background: "#0f172a", border: "1px solid #334155", color: "#fff", cursor: "pointer" }}
                  >
                    <option value="Action">Action</option>
                    <option value="Comedy">Comedy</option>
                    <option value="Sci-Fi">Sci-Fi / Cyberpunk</option>
                    <option value="Drama">Drama</option>
                    <option value="Horror">Horror</option>
                  </select>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "14px", color: "#cbd5e1" }}>Release Year</label>
                  <input
                    type="number" value={releaseYear} onChange={(e) => setReleaseYear(e.target.value)} placeholder="2026" required
                    style={{ padding: "12px", borderRadius: "6px", background: "#0f172a", border: "1px solid #334155", color: "#fff" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "14px", color: "#cbd5e1" }}>Asset Description / Synopsis</label>
                <textarea
                  rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Provide short content abstract logs for client UI display cards..."
                  style={{ padding: "12px", borderRadius: "6px", background: "#0f172a", border: "1px solid #334155", color: "#fff", resize: "none" }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "14px", color: "#cbd5e1" }}>Poster Image Artwork Source Link</label>
                <input
                  type="url" value={thumbnailUrl} onChange={(e) => setThumbnailUrl(e.target.value)} placeholder="https://cdn-storage.com/assets/poster.jpg" required
                  style={{ padding: "12px", borderRadius: "6px", background: "#0f172a", border: "1px solid #334155", color: "#fff" }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "14px", color: "#cbd5e1" }}>Video Resource Stream URI (HLS / DASH Master Manifest File)</label>
                <input
                  type="url" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://cdn-storage.com/stream/manifest.m3u8"
                  style={{ padding: "12px", borderRadius: "6px", background: "#0f172a", border: "1px solid #334155", color: "#fff" }}
                />
              </div>

              <button
                type="submit" disabled={uploading}
                style={{
                  padding: "14px", background: "#2563eb", color: "#fff", fontSize: "15px", fontWeight: "600", border: "none", borderRadius: "6px",
                  cursor: uploading ? "not-allowed" : "pointer", marginTop: "12px"
                }}
              >
                {uploading ? "Ingesting System Parameters..." : "Commit Asset to Global Catalog"}
              </button>
            </form>
          </div>
        )}

        {activeTab === "catalog" && (
          <div style={{ background: "#1e293b", borderRadius: "8px", border: "1px solid #334155", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
              <thead>
                <tr style={{ background: "#0f172a", borderBottom: "1px solid #334155" }}>
                  <th style={{ padding: "16px" }}>Title</th>
                  <th style={{ padding: "16px" }}>Type</th>
                  <th style={{ padding: "16px" }}>Genre</th>
                  <th style={{ padding: "16px" }}>Year</th>
                  <th style={{ padding: "16px" }}>Operational Status</th>
                </tr>
              </thead>
              <tbody>
                {contentList.map((item) => (
                  <tr key={item.id} style={{ borderBottom: "1px solid #334155" }}>
                    <td style={{ padding: "16px", fontWeight: "600" }}>{item.title}</td>
                    <td style={{ padding: "16px" }}>
                      <span style={{ padding: "4px 8px", borderRadius: "4px", fontSize: "12px", background: item.type === "MOVIE" ? "#1e3a8a" : "#311042", color: item.type === "MOVIE" ? "#93c5fd" : "#f472b6" }}>
                        {item.type}
                      </span>
                    </td>
                    <td style={{ padding: "16px", color: "#cbd5e1" }}>{item.genre}</td>
                    <td style={{ padding: "16px", color: "#cbd5e1" }}>{item.releaseYear}</td>
                    <td style={{ padding: "16px" }}>
                      <span style={{ color: "#10b981", display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10b981" }}></span>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}