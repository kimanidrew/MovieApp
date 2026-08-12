"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Film, Tv, Star, Search, Filter, ChevronLeft, ChevronRight, Pencil, Trash2, Check, X, Loader2 } from "lucide-react";

type ContentItem = {
  id: string;
  title: string;
  slug: string;
  status: string;
  isFeatured: boolean;
  featuredOrder: number;
  releaseYear: number | null;
  popularityScore: number;
  viewCount: string;
  createdAt: string;
  updatedAt: string;
  posterUrl: string;
  type: string;
  categories: string[];
};

const STATUS_OPTIONS = ["DRAFT", "PROCESSING", "READY", "PUBLISHED", "ARCHIVED"];
const STATUS_COLORS: Record<string, string> = {
  DRAFT: "#f59e0b",
  PROCESSING: "#3b82f6",
  READY: "#10b981",
  PUBLISHED: "#22c55e",
  ARCHIVED: "#6b7280",
};

export default function AdminContentPage() {
  const router = useRouter();
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [featuredFilter, setFeaturedFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState("");
  const [editFeatured, setEditFeatured] = useState(false);
  const [editOrder, setEditOrder] = useState(0);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchContent = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: "20",
        ...(query ? { q: query } : {}),
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(typeFilter ? { type: typeFilter } : {}),
        ...(featuredFilter ? { featured: featuredFilter } : {}),
      });
      const res = await fetch(`/api/admin/content?${params}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load content");
      const data = await res.json();
      setItems(data.items || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err: any) {
      setError(err.message || "Failed to load content");
    } finally {
      setLoading(false);
    }
  }, [page, query, statusFilter, typeFilter, featuredFilter]);

  useEffect(() => {
    const delay = setTimeout(() => fetchContent(), 300);
    return () => clearTimeout(delay);
  }, [fetchContent]);

  const startEdit = (item: ContentItem) => {
    setEditingId(item.id);
    setEditStatus(item.status);
    setEditFeatured(item.isFeatured);
    setEditOrder(item.featuredOrder);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async (id: string) => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/content", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: editStatus, isFeatured: editFeatured, featuredOrder: editOrder }),
      });
      if (!res.ok) throw new Error("Failed to update");
      setEditingId(null);
      fetchContent();
    } catch (err: any) {
      alert(err.message || "Failed to update content");
    } finally {
      setSaving(false);
    }
  };

  const deleteContent = async (id: string) => {
    if (!confirm("Are you sure you want to delete this content? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/content?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      fetchContent();
    } catch (err: any) {
      alert(err.message || "Failed to delete content");
    } finally {
      setDeletingId(null);
    }
  };

  const toggleFeatured = async (item: ContentItem) => {
    try {
      const res = await fetch("/api/admin/content", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, isFeatured: !item.isFeatured, featuredOrder: item.featuredOrder }),
      });
      if (!res.ok) throw new Error("Failed to update featured status");
      fetchContent();
    } catch (err: any) {
      alert(err.message || "Failed to update featured status");
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#09090b", color: "#fafafa", fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>
      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "2rem 1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
          <div>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 700, margin: 0 }}>Content Catalog</h1>
            <p style={{ color: "#71717a", fontSize: "0.875rem", margin: "0.25rem 0 0 0" }}>
              {total} titles in your library
            </p>
          </div>
          <button onClick={() => router.push("/admin/upload")} style={{
            display: "inline-flex", alignItems: "center", gap: "0.5rem",
            background: "#e11d48", color: "#fff", padding: "0.6rem 1.25rem",
            borderRadius: "0.5rem", fontSize: "0.875rem", fontWeight: 600,
            border: "none", cursor: "pointer"
          }}>
            <Film size={16} /> Upload Content
          </button>
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem", flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
            <Search size={16} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "#71717a" }} />
            <input
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1); }}
              placeholder="Search by title..."
              style={{
                width: "100%", background: "#18181b", border: "1px solid #27272a",
                borderRadius: "0.5rem", padding: "0.6rem 0.75rem 0.6rem 2.5rem",
                color: "#fafafa", fontSize: "0.875rem", outline: "none"
              }}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: "0.5rem", padding: "0.6rem 0.75rem", color: "#fafafa", fontSize: "0.875rem", cursor: "pointer" }}
          >
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: "0.5rem", padding: "0.6rem 0.75rem", color: "#fafafa", fontSize: "0.875rem", cursor: "pointer" }}
          >
            <option value="">All Types</option>
            <option value="MOVIE">Movies</option>
            <option value="SHOW">TV Shows</option>
          </select>
          <select
            value={featuredFilter}
            onChange={(e) => { setFeaturedFilter(e.target.value); setPage(1); }}
            style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: "0.5rem", padding: "0.6rem 0.75rem", color: "#fafafa", fontSize: "0.875rem", cursor: "pointer" }}
          >
            <option value="">All Featured</option>
            <option value="true">Featured Only</option>
            <option value="false">Not Featured</option>
          </select>
        </div>

        {error && (
          <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", color: "#fca5a5", padding: "1rem", borderRadius: "0.5rem", marginBottom: "1.5rem", fontSize: "0.875rem" }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "300px" }}>
            <div style={{ width: "40px", height: "40px", border: "3px solid #27272a", borderTopColor: "#e11d48", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
          </div>
        ) : (
          <div style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: "0.75rem", overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
                <thead>
                  <tr style={{ background: "#09090b", borderBottom: "1px solid #27272a" }}>
                    <th style={{ padding: "0.75rem 1.25rem", textAlign: "left", color: "#71717a", fontWeight: 500 }}>Title</th>
                    <th style={{ padding: "0.75rem 1.25rem", textAlign: "left", color: "#71717a", fontWeight: 500 }}>Type</th>
                    <th style={{ padding: "0.75rem 1.25rem", textAlign: "left", color: "#71717a", fontWeight: 500 }}>Year</th>
                    <th style={{ padding: "0.75rem 1.25rem", textAlign: "left", color: "#71717a", fontWeight: 500 }}>Status</th>
                    <th style={{ padding: "0.75rem 1.25rem", textAlign: "left", color: "#71717a", fontWeight: 500 }}>Featured</th>
                    <th style={{ padding: "0.75rem 1.25rem", textAlign: "left", color: "#71717a", fontWeight: 500 }}>Views</th>
                    <th style={{ padding: "0.75rem 1.25rem", textAlign: "right", color: "#71717a", fontWeight: 500 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: "2rem", textAlign: "center", color: "#71717a" }}>
                        No content found. Try adjusting your filters or upload new content.
                      </td>
                    </tr>
                  ) : (
                    items.map((item) => (
                      <tr key={item.id} style={{ borderBottom: "1px solid #27272a" }}>
                        <td style={{ padding: "0.75rem 1.25rem" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                            {item.posterUrl ? (
                              <img src={item.posterUrl} alt="" style={{ width: "32px", height: "44px", borderRadius: "0.25rem", objectFit: "cover" }} />
                            ) : (
                              <div style={{ width: "32px", height: "44px", borderRadius: "0.25rem", background: "#27272a", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <Film size={14} color="#71717a" />
                              </div>
                            )}
                            <div>
                              <div style={{ fontWeight: 500 }}>{item.title}</div>
                              <div style={{ color: "#71717a", fontSize: "0.75rem" }}>{item.categories.join(", ") || "No categories"}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "0.75rem 1.25rem" }}>
                          <span style={{ padding: "0.2rem 0.5rem", borderRadius: "0.25rem", fontSize: "0.75rem", fontWeight: 600, background: item.type === "MOVIE" ? "rgba(59, 130, 246, 0.15)" : "rgba(236, 72, 153, 0.15)", color: item.type === "MOVIE" ? "#60a5fa" : "#f472b6" }}>
                            {item.type}
                          </span>
                        </td>
                        <td style={{ padding: "0.75rem 1.25rem", color: "#a1a1aa" }}>{item.releaseYear || "—"}</td>
                        <td style={{ padding: "0.75rem 1.25rem" }}>
                          {editingId === item.id ? (
                            <select
                              value={editStatus}
                              onChange={(e) => setEditStatus(e.target.value)}
                              style={{ background: "#09090b", border: "1px solid #3f3f46", borderRadius: "0.25rem", padding: "0.3rem 0.5rem", color: "#fafafa", fontSize: "0.8rem" }}
                            >
                              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                            </select>
                          ) : (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", color: STATUS_COLORS[item.status] || "#a1a1aa", fontSize: "0.8rem" }}>
                              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: STATUS_COLORS[item.status] || "#a1a1aa" }} />
                              {item.status}
                            </span>
                          )}
                        </td>
                        <td style={{ padding: "0.75rem 1.25rem" }}>
                          {editingId === item.id ? (
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                              <input
                                type="checkbox"
                                checked={editFeatured}
                                onChange={(e) => setEditFeatured(e.target.checked)}
                                style={{ width: "16px", height: "16px" }}
                              />
                              <input
                                type="number"
                                value={editOrder}
                                onChange={(e) => setEditOrder(Number(e.target.value))}
                                style={{ width: "50px", background: "#09090b", border: "1px solid #3f3f46", borderRadius: "0.25rem", padding: "0.3rem", color: "#fafafa", fontSize: "0.8rem" }}
                                placeholder="Order"
                              />
                            </div>
                          ) : (
                            <button
                              onClick={() => toggleFeatured(item)}
                              style={{ background: "transparent", border: "none", cursor: "pointer", color: item.isFeatured ? "#f59e0b" : "#71717a", display: "inline-flex", alignItems: "center", gap: "0.25rem", fontSize: "0.8rem" }}
                            >
                              <Star size={14} fill={item.isFeatured ? "#f59e0b" : "none"} />
                              {item.isFeatured ? `Featured #${item.featuredOrder}` : "Not Featured"}
                            </button>
                          )}
                        </td>
                        <td style={{ padding: "0.75rem 1.25rem", color: "#a1a1aa" }}>{Number(item.viewCount).toLocaleString()}</td>
                        <td style={{ padding: "0.75rem 1.25rem", textAlign: "right" }}>
                          {editingId === item.id ? (
                            <div style={{ display: "inline-flex", gap: "0.5rem" }}>
                              <button onClick={() => saveEdit(item.id)} disabled={saving} style={{ background: "#10b981", color: "#fff", border: "none", borderRadius: "0.25rem", padding: "0.4rem 0.75rem", cursor: "pointer", fontSize: "0.8rem", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                                {saving ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Check size={14} />} Save
                              </button>
                              <button onClick={cancelEdit} style={{ background: "#27272a", color: "#a1a1aa", border: "none", borderRadius: "0.25rem", padding: "0.4rem 0.75rem", cursor: "pointer", fontSize: "0.8rem", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                                <X size={14} /> Cancel
                              </button>
                            </div>
                          ) : (
                            <div style={{ display: "inline-flex", gap: "0.5rem" }}>
                              <button onClick={() => startEdit(item)} style={{ background: "#27272a", color: "#a1a1aa", border: "none", borderRadius: "0.25rem", padding: "0.4rem 0.75rem", cursor: "pointer", fontSize: "0.8rem", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                                <Pencil size={14} /> Edit
                              </button>
                              <button onClick={() => deleteContent(item.id)} disabled={deletingId === item.id} style={{ background: "rgba(239, 68, 68, 0.1)", color: "#fca5a5", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "0.25rem", padding: "0.4rem 0.75rem", cursor: "pointer", fontSize: "0.8rem", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                                {deletingId === item.id ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Trash2 size={14} />} Delete
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ padding: "1rem 1.25rem", borderTop: "1px solid #27272a", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "#71717a", fontSize: "0.85rem" }}>
                  Page {page} of {totalPages} · {total} items
                </span>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page <= 1}
                    style={{ background: "#27272a", color: "#fafafa", border: "none", borderRadius: "0.375rem", padding: "0.4rem 0.75rem", cursor: page <= 1 ? "not-allowed" : "pointer", opacity: page <= 1 ? 0.5 : 1, display: "inline-flex", alignItems: "center", gap: "0.25rem" }}
                  >
                    <ChevronLeft size={14} /> Prev
                  </button>
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page >= totalPages}
                    style={{ background: "#27272a", color: "#fafafa", border: "none", borderRadius: "0.375rem", padding: "0.4rem 0.75rem", cursor: page >= totalPages ? "not-allowed" : "pointer", opacity: page >= totalPages ? 0.5 : 1, display: "inline-flex", alignItems: "center", gap: "0.25rem" }}
                  >
                    Next <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <style jsx>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}