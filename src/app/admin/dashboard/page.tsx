"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { Film, Tv, Users, Star, Activity, TrendingUp, Clock, PlayCircle, LayoutDashboard, Upload, ListVideo, Settings, LogOut, ChevronRight, Search, Filter } from "lucide-react";

type Stats = {
  totalContent: number;
  totalMovies: number;
  totalShows: number;
  totalUsers: number;
  totalProfiles: number;
  totalSubscriptions: number;
  totalWatchHistory: number;
  featuredCount: number;
};

type RecentItem = {
  id: string;
  title: string;
  slug: string;
  status: string;
  isFeatured: boolean;
  releaseYear: number | null;
  createdAt: string;
  posterUrl: string;
  type: string;
};

export default function AdminDashboard() {
  const router = useRouter();
  const { adminUser, logout } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentContent, setRecentContent] = useState<RecentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/admin/stats", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load stats");
      const data = await res.json();
      setStats(data.stats);
      setRecentContent(data.recentContent || []);
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const statusColors: Record<string, string> = {
    DRAFT: "#f59e0b",
    PROCESSING: "#3b82f6",
    READY: "#10b981",
    PUBLISHED: "#22c55e",
    ARCHIVED: "#6b7280",
  };

  const statCards = [
    { label: "Total Content", value: stats?.totalContent ?? 0, icon: Film, color: "#3b82f6" },
    { label: "Movies", value: stats?.totalMovies ?? 0, icon: PlayCircle, color: "#8b5cf6" },
    { label: "TV Shows", value: stats?.totalShows ?? 0, icon: Tv, color: "#ec4899" },
    { label: "Featured Titles", value: stats?.featuredCount ?? 0, icon: Star, color: "#f59e0b" },
    { label: "Total Users", value: stats?.totalUsers ?? 0, icon: Users, color: "#10b981" },
    { label: "Active Subscriptions", value: stats?.totalSubscriptions ?? 0, icon: TrendingUp, color: "#06b6d4" },
    { label: "Watch History Entries", value: stats?.totalWatchHistory ?? 0, icon: Activity, color: "#f43f5e" },
    { label: "User Profiles", value: stats?.totalProfiles ?? 0, icon: Users, color: "#a855f7" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#09090b", color: "#fafafa", fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>
      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "2rem 1.5rem" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
          <div>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 700, margin: 0 }}>Dashboard Overview</h1>
            <p style={{ color: "#71717a", fontSize: "0.875rem", margin: "0.25rem 0 0 0" }}>
              Welcome back, {adminUser?.email?.split("@")[0] || "Admin"} — here's what's happening on your platform.
            </p>
          </div>
          <Link href="/admin/upload" style={{
            display: "inline-flex", alignItems: "center", gap: "0.5rem",
            background: "#e11d48", color: "#fff", padding: "0.6rem 1.25rem",
            borderRadius: "0.5rem", fontSize: "0.875rem", fontWeight: 600,
            textDecoration: "none", transition: "background 0.2s"
          }}>
            <Upload size={16} /> Upload Content
          </Link>
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
          <>
            {/* Stats Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
              {statCards.map((card) => (
                <div key={card.label} style={{
                  background: "#18181b", border: "1px solid #27272a", borderRadius: "0.75rem",
                  padding: "1.25rem", transition: "border-color 0.2s"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
                    <div style={{ width: "36px", height: "36px", borderRadius: "0.5rem", background: `${card.color}20`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <card.icon size={18} color={card.color} />
                    </div>
                    <span style={{ color: "#a1a1aa", fontSize: "0.8rem", fontWeight: 500 }}>{card.label}</span>
                  </div>
                  <div style={{ fontSize: "1.75rem", fontWeight: 700 }}>{card.value.toLocaleString()}</div>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
              <Link href="/admin/upload" style={{ textDecoration: "none" }}>
                <div style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: "0.75rem", padding: "1.25rem", display: "flex", alignItems: "center", gap: "1rem", transition: "border-color 0.2s" }}>
                  <div style={{ width: "44px", height: "44px", borderRadius: "0.5rem", background: "rgba(225, 29, 72, 0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Upload size={20} color="#e11d48" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>Upload New Content</div>
                    <div style={{ color: "#71717a", fontSize: "0.8rem" }}>Add movies or TV episodes</div>
                  </div>
                  <ChevronRight size={18} color="#71717a" />
                </div>
              </Link>
              <Link href="/admin/content" style={{ textDecoration: "none" }}>
                <div style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: "0.75rem", padding: "1.25rem", display: "flex", alignItems: "center", gap: "1rem", transition: "border-color 0.2s" }}>
                  <div style={{ width: "44px", height: "44px", borderRadius: "0.5rem", background: "rgba(59, 130, 246, 0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <ListVideo size={20} color="#3b82f6" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>Manage Catalog</div>
                    <div style={{ color: "#71717a", fontSize: "0.8rem" }}>Edit, publish, or feature content</div>
                  </div>
                  <ChevronRight size={18} color="#71717a" />
                </div>
              </Link>
              <Link href="/admin/users" style={{ textDecoration: "none" }}>
                <div style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: "0.75rem", padding: "1.25rem", display: "flex", alignItems: "center", gap: "1rem", transition: "border-color 0.2s" }}>
                  <div style={{ width: "44px", height: "44px", borderRadius: "0.5rem", background: "rgba(16, 185, 129, 0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Users size={20} color="#10b981" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>Manage Users</div>
                    <div style={{ color: "#71717a", fontSize: "0.8rem" }}>View, edit, and manage accounts</div>
                  </div>
                  <ChevronRight size={18} color="#71717a" />
                </div>
              </Link>
            </div>

            {/* Recent Content */}
            <div style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: "0.75rem", overflow: "hidden" }}>
              <div style={{ padding: "1.25rem", borderBottom: "1px solid #27272a", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2 style={{ fontSize: "1rem", fontWeight: 600, margin: 0 }}>Recently Added Content</h2>
                <Link href="/admin/content" style={{ color: "#3b82f6", fontSize: "0.85rem", textDecoration: "none" }}>View All →</Link>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
                  <thead>
                    <tr style={{ background: "#09090b", borderBottom: "1px solid #27272a" }}>
                      <th style={{ padding: "0.75rem 1.25rem", textAlign: "left", color: "#71717a", fontWeight: 500 }}>Title</th>
                      <th style={{ padding: "0.75rem 1.25rem", textAlign: "left", color: "#71717a", fontWeight: 500 }}>Type</th>
                      <th style={{ padding: "0.75rem 1.25rem", textAlign: "left", color: "#71717a", fontWeight: 500 }}>Year</th>
                      <th style={{ padding: "0.75rem 1.25rem", textAlign: "left", color: "#71717a", fontWeight: 500 }}>Status</th>
                      <th style={{ padding: "0.75rem 1.25rem", textAlign: "left", color: "#71717a", fontWeight: 500 }}>Featured</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentContent.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ padding: "2rem", textAlign: "center", color: "#71717a" }}>
                          No content yet. Upload your first title!
                        </td>
                      </tr>
                    ) : (
                      recentContent.map((item) => (
                        <tr key={item.id} style={{ borderBottom: "1px solid #27272a" }}>
                          <td style={{ padding: "0.75rem 1.25rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                            {item.posterUrl ? (
                              <img src={item.posterUrl} alt="" style={{ width: "32px", height: "44px", borderRadius: "0.25rem", objectFit: "cover" }} />
                            ) : (
                              <div style={{ width: "32px", height: "44px", borderRadius: "0.25rem", background: "#27272a", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <Film size={14} color="#71717a" />
                              </div>
                            )}
                            <span style={{ fontWeight: 500 }}>{item.title}</span>
                          </td>
                          <td style={{ padding: "0.75rem 1.25rem" }}>
                            <span style={{ padding: "0.2rem 0.5rem", borderRadius: "0.25rem", fontSize: "0.75rem", fontWeight: 600, background: item.type === "MOVIE" ? "rgba(59, 130, 246, 0.15)" : "rgba(236, 72, 153, 0.15)", color: item.type === "MOVIE" ? "#60a5fa" : "#f472b6" }}>
                              {item.type}
                            </span>
                          </td>
                          <td style={{ padding: "0.75rem 1.25rem", color: "#a1a1aa" }}>{item.releaseYear || "—"}</td>
                          <td style={{ padding: "0.75rem 1.25rem" }}>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", color: statusColors[item.status] || "#a1a1aa", fontSize: "0.8rem" }}>
                              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: statusColors[item.status] || "#a1a1aa" }} />
                              {item.status}
                            </span>
                          </td>
                          <td style={{ padding: "0.75rem 1.25rem" }}>
                            {item.isFeatured ? (
                              <span style={{ color: "#f59e0b", display: "inline-flex", alignItems: "center", gap: "0.25rem", fontSize: "0.8rem" }}>
                                <Star size={14} /> Featured
                              </span>
                            ) : (
                              <span style={{ color: "#71717a", fontSize: "0.8rem" }}>—</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
      <style jsx>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}