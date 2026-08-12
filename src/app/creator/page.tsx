"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Eye,
  Clock,
  DollarSign,
  Users,
  ThumbsUp,
  TrendingUp,
  Upload,
  BarChart3,
  Library,
  Play,
  Pencil,
  Trash2,
  CheckCircle2,
  Film,
  Tv,
  Clapperboard,
  Sparkles,
  Rocket,
  Star,
  Flame,
  Award,
  Crown,
  MessageCircle,
  ArrowUpRight,
  Loader2,
  AlertCircle,
} from "lucide-react";
import AnimatedCounter from "@/components/creator/AnimatedCounter";
import Sparkline from "@/components/creator/Sparkline";
import PerformanceChart from "@/components/creator/PerformanceChart";
import { useAuth } from "@/components/AuthProvider";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const STATUS_COLORS: Record<string, string> = {
  PUBLISHED: "#10b981",
  READY: "#38bdf8",
  PROCESSING: "#fbbf24",
  DRAFT: "#a1a1aa",
  ARCHIVED: "#f87171",
};

export default function CreatorDashboard() {
  const { customerUser, activeProfile } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/creator/dashboard")
      .then((res) => res.json())
      .then((json) => {
        if (json.error) {
          setError(json.error);
        } else {
          setData(json);
        }
      })
      .catch(() => setError("Failed to load dashboard data"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <Loader2 size={40} color="#8b5cf6" className="creator-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: 600, margin: "4rem auto", textAlign: "center", padding: "2rem" }}>
        <AlertCircle size={48} color="#f87171" style={{ marginBottom: "1rem" }} />
        <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>Access Restricted</h2>
        <p style={{ color: "var(--creator-text-2)", marginBottom: "1.5rem" }}>{error}</p>
        <Link href="/" className="creator-btn creator-btn-primary" style={{ textDecoration: "none" }}>
          Back to Home
        </Link>
      </div>
    );
  }

  const { creatorProfile, stats, content, drafts, earnings, payouts } = data;
  const displayName = creatorProfile?.channelName || customerUser?.email?.split("@")[0] || "Creator";
  const avatarInitials = displayName.slice(0, 2).toUpperCase();
  const profileName = activeProfile?.name || "No Profile Selected";

  const STATS = [
    { label: "Total Views", value: stats.totalViews, icon: Eye, color: "#8b5cf6", spark: [12, 18, 15, 22, 28, 25, 35, 42, 38, 50, 55, 62] },
    { label: "Watch Time", value: stats.totalWatchHours, suffix: " hrs", icon: Clock, color: "#38bdf8", spark: [8, 12, 10, 15, 18, 22, 20, 28, 32, 30, 38, 45] },
    { label: "Revenue", value: stats.totalRevenue, prefix: "$", icon: DollarSign, color: "#10b981", spark: [5, 8, 7, 12, 10, 15, 18, 16, 22, 25, 28, 35] },
    { label: "Likes", value: stats.totalLikes, icon: ThumbsUp, color: "#ec4899", spark: [10, 14, 12, 18, 16, 22, 25, 24, 30, 35, 40, 48] },
    { label: "Content", value: stats.contentCount, icon: Library, color: "#fbbf24", spark: [3, 5, 4, 7, 6, 9, 12, 11, 15, 18, 20, 24] },
    { label: "Balance", value: stats.currentBalance, prefix: "$", icon: Crown, color: "#a855f7", spark: [60, 65, 70, 68, 75, 80, 78, 85, 90, 88, 95, 98] },
  ];

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto", padding: "2rem 1.5rem 4rem" }}>
      {/* ============ HERO SECTION ============ */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        style={{
          position: "relative",
          borderRadius: 28,
          overflow: "hidden",
          minHeight: 420,
          display: "flex",
          alignItems: "center",
          marginBottom: "2.5rem",
          background: "url('https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=2070&auto=format&fit=crop') center/cover no-repeat",
        }}
      >
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(11,11,15,0.95) 0%, rgba(11,11,15,0.6) 50%, rgba(11,11,15,0.2) 100%)" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(11,11,15,1) 0%, transparent 40%)" }} />

        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          style={{ position: "relative", zIndex: 2, padding: "3rem", maxWidth: 700 }}
        >
          <motion.div variants={fadeUp} style={{ display: "flex", alignItems: "center", gap: "1.25rem", marginBottom: "1.5rem" }}>
            <div style={{ position: "relative" }}>
              <div style={{ width: 80, height: 80, borderRadius: "50%", background: "linear-gradient(135deg, #8b5cf6, #6366f1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.8rem", fontWeight: 800, border: "3px solid rgba(255,255,255,0.2)", boxShadow: "0 8px 32px rgba(139,92,246,0.4)" }}>
                {avatarInitials}
              </div>
              {creatorProfile?.isVerified && (
                <div style={{ position: "absolute", bottom: 0, right: 0, width: 24, height: 24, borderRadius: "50%", background: "#10b981", border: "3px solid #0b0b0f", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <CheckCircle2 size={12} color="#fff" />
                </div>
              )}
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <h1 style={{ fontSize: "2rem", fontWeight: 800, margin: 0 }}>{displayName}</h1>
                {creatorProfile?.isVerified && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", background: "rgba(56,189,248,0.15)", border: "1px solid rgba(56,189,248,0.3)", color: "#38bdf8", padding: "0.2rem 0.6rem", borderRadius: 9999, fontSize: "0.7rem", fontWeight: 700 }}>
                    <CheckCircle2 size={12} /> VERIFIED
                  </span>
                )}
              </div>
              <p style={{ color: "var(--creator-text-2)", margin: "0.25rem 0 0", fontSize: "0.95rem" }}>
                {creatorProfile?.bio || "Filmmaker · Storyteller · Creator"} · Active Profile: <strong style={{ color: "#fff" }}>{profileName}</strong>
              </p>
            </div>
          </motion.div>

          <motion.div variants={fadeUp} style={{ display: "flex", gap: "2.5rem", marginBottom: "2rem", flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: "1.6rem", fontWeight: 800 }}><AnimatedCounter value={stats.totalViews} /></div>
              <div style={{ color: "var(--creator-text-3)", fontSize: "0.8rem" }}>Total Views</div>
            </div>
            <div>
              <div style={{ fontSize: "1.6rem", fontWeight: 800 }}><AnimatedCounter value={stats.contentCount} /></div>
              <div style={{ color: "var(--creator-text-3)", fontSize: "0.8rem" }}>Content Items</div>
            </div>
            <div>
              <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#10b981" }}><AnimatedCounter value={stats.totalRevenue} prefix="$" /></div>
              <div style={{ color: "var(--creator-text-3)", fontSize: "0.8rem" }}>Revenue Earned</div>
            </div>
          </motion.div>

          <motion.div variants={fadeUp} style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <Link href="/creator/upload" style={{ textDecoration: "none" }}>
              <span className="creator-btn creator-btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
                <Upload size={18} /> Upload New Content
              </span>
            </Link>
            <button className="creator-btn creator-btn-secondary">
              <BarChart3 size={18} /> View Analytics
            </button>
            <button className="creator-btn creator-btn-secondary">
              <Library size={18} /> Manage Library
            </button>
          </motion.div>
        </motion.div>
      </motion.section>

      {/* ============ ANALYTICS OVERVIEW ============ */}
      <motion.section
        variants={stagger}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-80px" }}
        style={{ marginBottom: "3rem" }}
      >
        <motion.h2 variants={fadeUp} style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1.5rem" }}>
          Analytics <span className="creator-gradient-text">Overview</span>
        </motion.h2>

        <div className="creator-grid creator-grid-4">
          {STATS.map((stat) => (
            <motion.div
              key={stat.label}
              variants={fadeUp}
              className="creator-glass creator-stat-card"
              style={{ padding: "1.5rem", position: "relative", overflow: "hidden" }}
            >
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${stat.color}, transparent)` }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: `${stat.color}20`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <stat.icon size={20} color={stat.color} />
                </div>
                <Sparkline data={stat.spark} color={stat.color} width={80} height={30} />
              </div>
              <div style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "0.25rem" }}>
                <AnimatedCounter value={stat.value} prefix={stat.prefix || ""} suffix={stat.suffix || ""} />
              </div>
              <div style={{ color: "var(--creator-text-3)", fontSize: "0.85rem" }}>{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ============ PERFORMANCE CHARTS ============ */}
      <motion.section
        variants={stagger}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-80px" }}
        style={{ marginBottom: "3rem" }}
      >
        <motion.h2 variants={fadeUp} style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1.5rem" }}>
          Performance <span className="creator-gradient-text">Insights</span>
        </motion.h2>

        <div className="creator-grid creator-grid-2">
          <motion.div variants={fadeUp} className="creator-glass" style={{ padding: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 600, margin: 0 }}>Content Views</h3>
              <span style={{ fontSize: "0.8rem", color: "#10b981", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                {content.length} items <ArrowUpRight size={14} />
              </span>
            </div>
            <PerformanceChart
              data={content.slice(0, 12).map((c: any) => c.views)}
              labels={content.slice(0, 12).map((c: any) => c.title.slice(0, 8))}
              color="#8b5cf6"
              height={200}
            />
          </motion.div>

          <motion.div variants={fadeUp} className="creator-glass" style={{ padding: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 600, margin: 0 }}>Revenue by Content</h3>
              <span style={{ fontSize: "0.8rem", color: "#10b981", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                ${stats.totalRevenue.toLocaleString()} <ArrowUpRight size={14} />
              </span>
            </div>
            <PerformanceChart
              data={content.slice(0, 12).map((c: any) => c.revenue)}
              labels={content.slice(0, 12).map((c: any) => c.title.slice(0, 8))}
              color="#10b981"
              height={200}
              type="bar"
            />
          </motion.div>
        </div>
      </motion.section>

      {/* ============ CONTENT LIBRARY ============ */}
      <motion.section
        variants={stagger}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-80px" }}
        style={{ marginBottom: "3rem" }}
      >
        <motion.div variants={fadeUp} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>
            Content <span className="creator-gradient-text">Library</span>
          </h2>
          <span style={{ fontSize: "0.85rem", color: "var(--creator-text-3)" }}>{content.length} items</span>
        </motion.div>

        {content.length === 0 ? (
          <motion.div variants={fadeUp} className="creator-glass" style={{ padding: "3rem", textAlign: "center" }}>
            <Film size={48} color="#8b5cf6" style={{ marginBottom: "1rem" }} />
            <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "0.5rem" }}>No content yet</h3>
            <p style={{ color: "var(--creator-text-2)", marginBottom: "1.5rem" }}>Upload your first masterpiece to get started!</p>
            <Link href="/creator/upload" className="creator-btn creator-btn-primary" style={{ textDecoration: "none" }}>
              <Upload size={18} /> Upload Content
            </Link>
          </motion.div>
        ) : (
          <div className="creator-grid creator-grid-3">
            {content.map((item: any) => (
              <motion.div key={item.id} variants={fadeUp} className="creator-content-card">
                <div style={{ position: "relative", aspectRatio: "16/9", overflow: "hidden" }}>
                  {item.poster ? (
                    <img src={item.poster} alt={item.title} loading="lazy" className="creator-card-poster" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(139,92,246,0.1)" }}>
                      {item.type === "Movie" ? <Film size={48} color="#8b5cf6" /> : <Tv size={48} color="#38bdf8" />}
                    </div>
                  )}
                  <div style={{ position: "absolute", top: "0.75rem", left: "0.75rem", display: "flex", gap: "0.5rem" }}>
                    <span style={{ background: "rgba(11,11,15,0.8)", backdropFilter: "blur(10px)", padding: "0.25rem 0.6rem", borderRadius: 9999, fontSize: "0.7rem", fontWeight: 600, color: STATUS_COLORS[item.status] || "#10b981" }}>
                      ● {item.status}
                    </span>
                    <span style={{ background: "rgba(11,11,15,0.8)", backdropFilter: "blur(10px)", padding: "0.25rem 0.6rem", borderRadius: 9999, fontSize: "0.7rem", fontWeight: 600, color: "var(--creator-text-2)" }}>
                      {item.type}
                    </span>
                  </div>

                  <div className="creator-card-overlay">
                    <div style={{ display: "flex", gap: "0.5rem", width: "100%" }}>
                      <button className="creator-btn creator-btn-primary" style={{ padding: "0.5rem 0.9rem", fontSize: "0.75rem", flex: 1 }}>
                        <Pencil size={14} /> Edit
                      </button>
                      <button className="creator-btn creator-btn-secondary" style={{ padding: "0.5rem 0.9rem", fontSize: "0.75rem", flex: 1 }}>
                        <BarChart3 size={14} /> Analytics
                      </button>
                      <Link href={`/${item.type === "Movie" ? "movies" : "shows"}/${item.id}`} style={{ textDecoration: "none", flex: 1 }}>
                        <button className="creator-btn creator-btn-secondary" style={{ padding: "0.5rem 0.9rem", fontSize: "0.75rem", width: "100%" }}>
                          <Play size={14} /> Preview
                        </button>
                      </Link>
                      <button className="creator-btn creator-btn-danger" style={{ padding: "0.5rem 0.9rem", fontSize: "0.75rem", flex: 1 }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>

                <div style={{ padding: "1.25rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                    <h3 style={{ fontSize: "1.05rem", fontWeight: 700, margin: 0 }}>{item.title}</h3>
                    <span style={{ fontSize: "0.8rem", color: "#10b981", fontWeight: 600 }}>${item.revenue.toLocaleString()}</span>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "0.75rem", color: "var(--creator-text-3)", background: "rgba(255,255,255,0.05)", padding: "0.2rem 0.5rem", borderRadius: 6 }}>{item.genre}</span>
                    {item.type === "Series" && (
                      <span style={{ fontSize: "0.75rem", color: "var(--creator-text-3)", background: "rgba(255,255,255,0.05)", padding: "0.2rem 0.5rem", borderRadius: 6 }}>{item.episodeCount} eps</span>
                    )}
                    {item.releaseYear && (
                      <span style={{ fontSize: "0.75rem", color: "var(--creator-text-3)", background: "rgba(255,255,255,0.05)", padding: "0.2rem 0.5rem", borderRadius: 6 }}>{item.releaseYear}</span>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: "1rem", fontSize: "0.8rem", color: "var(--creator-text-2)" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}><Eye size={14} /> {item.views.toLocaleString()}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}><ThumbsUp size={14} /> {item.likes.toLocaleString()}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}><MessageCircle size={14} /> {item.comments.toLocaleString()}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.section>

      {/* ============ DRAFTS ============ */}
      {drafts.length > 0 && (
        <motion.section
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          style={{ marginBottom: "3rem" }}
        >
          <motion.div variants={fadeUp} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>
              Drafts <span className="creator-gradient-text">In Progress</span>
            </h2>
            <span style={{ fontSize: "0.85rem", color: "var(--creator-text-3)" }}>{drafts.length} drafts</span>
          </motion.div>

          <div style={{ display: "flex", gap: "1.25rem", overflowX: "auto", paddingBottom: "0.5rem" }} className="creator-scroll">
            {drafts.map((draft: any) => (
              <motion.div
                key={draft.id}
                variants={fadeUp}
                className="creator-glass"
                style={{ minWidth: 320, maxWidth: 320, overflow: "hidden", flexShrink: 0 }}
              >
                <div style={{ position: "relative", height: 140, overflow: "hidden" }}>
                  {draft.poster ? (
                    <img src={draft.poster} alt={draft.title} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(139,92,246,0.1)" }}>
                      <Clapperboard size={40} color="#8b5cf6" />
                    </div>
                  )}
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(11,11,15,0.9), transparent)" }} />
                  <div style={{ position: "absolute", bottom: "0.75rem", left: "0.75rem", right: "0.75rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                      <span style={{ fontSize: "0.8rem", fontWeight: 600 }}>{draft.title}</span>
                      <span style={{ fontSize: "0.7rem", color: "var(--creator-text-3)" }}>{draft.status}</span>
                    </div>
                    <div className="creator-progress-track">
                      <div className="creator-progress-fill" style={{ width: draft.status === "PROCESSING" ? "60%" : "30%" }} />
                    </div>
                    <div style={{ fontSize: "0.7rem", color: "var(--creator-text-3)", marginTop: "0.25rem" }}>
                      {draft.status === "PROCESSING" ? "Processing..." : "Draft"}
                    </div>
                  </div>
                </div>
                <div style={{ padding: "0.75rem", display: "flex", gap: "0.5rem" }}>
                  <Link href="/creator/upload" style={{ textDecoration: "none", flex: 1 }}>
                    <button className="creator-btn creator-btn-primary" style={{ padding: "0.5rem 0.9rem", fontSize: "0.75rem", width: "100%" }}>
                      <Pencil size={14} /> Resume
                    </button>
                  </Link>
                  <button className="creator-btn creator-btn-secondary" style={{ padding: "0.5rem 0.9rem", fontSize: "0.75rem", flex: 1 }}>
                    <Play size={14} /> Preview
                  </button>
                  <button className="creator-btn creator-btn-danger" style={{ padding: "0.5rem 0.9rem", fontSize: "0.75rem" }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>
      )}

      {/* ============ EARNINGS + PAYOUTS ============ */}
      <div className="creator-grid creator-grid-2" style={{ marginBottom: "3rem" }}>
        {/* Earnings */}
        <motion.section
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="creator-glass"
          style={{ padding: "1.5rem" }}
        >
          <motion.h2 variants={fadeUp} style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1.25rem" }}>
            Earnings <span className="creator-gold-text">Overview</span>
          </motion.h2>
          <div className="creator-grid creator-grid-2">
            <motion.div variants={fadeUp} className="creator-gradient-border" style={{ padding: "1.25rem", borderRadius: 16 }}>
              <div style={{ fontSize: "0.8rem", color: "var(--creator-text-3)", marginBottom: "0.5rem" }}>Total Revenue</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#10b981" }}>
                <AnimatedCounter value={stats.totalRevenue} prefix="$" />
              </div>
            </motion.div>
            <motion.div variants={fadeUp} className="creator-gradient-border" style={{ padding: "1.25rem", borderRadius: 16 }}>
              <div style={{ fontSize: "0.8rem", color: "var(--creator-text-3)", marginBottom: "0.5rem" }}>Current Balance</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#10b981" }}>
                <AnimatedCounter value={stats.currentBalance} prefix="$" />
              </div>
            </motion.div>
          </div>

          {earnings.recent.length > 0 && (
            <div style={{ marginTop: "1.5rem" }}>
              <div style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: "0.75rem" }}>Recent Earnings</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {earnings.recent.slice(0, 5).map((e: any) => (
                  <div key={e.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 0.75rem", borderRadius: 8, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <div>
                      <div style={{ fontSize: "0.8rem", fontWeight: 600 }}>{e.sourceType}</div>
                      <div style={{ fontSize: "0.7rem", color: "var(--creator-text-3)" }}>{new Date(e.createdAt).toLocaleDateString()}</div>
                    </div>
                    <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "#10b981" }}>+${e.amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.section>

        {/* Payouts */}
        <motion.section
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="creator-glass"
          style={{ padding: "1.5rem" }}
        >
          <motion.h2 variants={fadeUp} style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1.25rem" }}>
            Payouts <span className="creator-gradient-text">History</span>
          </motion.h2>

          {payouts.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem" }}>
              <Award size={40} color="#fbbf24" style={{ marginBottom: "0.75rem" }} />
              <p style={{ color: "var(--creator-text-2)", fontSize: "0.9rem" }}>No payouts yet. Your earnings will appear here once you reach the payout threshold.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {payouts.map((p: any) => (
                <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem", borderRadius: 8, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div>
                    <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>{p.description || "Payout"}</div>
                    <div style={{ fontSize: "0.7rem", color: "var(--creator-text-3)" }}>{new Date(p.createdAt).toLocaleDateString()}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "0.9rem", fontWeight: 700 }}>${p.amount.toFixed(2)}</div>
                    <span style={{ fontSize: "0.7rem", color: p.status === "PAID" ? "#10b981" : p.status === "PENDING" ? "#fbbf24" : "#f87171" }}>{p.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.section>
      </div>

      {/* ============ ACHIEVEMENTS ============ */}
      <motion.section
        variants={stagger}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-80px" }}
      >
        <motion.h2 variants={fadeUp} style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1.5rem" }}>
          Achievements <span className="creator-gold-text">Badges</span>
        </motion.h2>

        <div className="creator-grid creator-grid-4">
          {[
            { name: "Verified Creator", icon: CheckCircle2, color: "#38bdf8", unlocked: !!creatorProfile?.isVerified },
            { name: "Rising Creator", icon: Rocket, color: "#8b5cf6", unlocked: stats.contentCount > 0 },
            { name: "Trending", icon: Flame, color: "#f97316", unlocked: stats.totalViews > 1000 },
            { name: "1M Views", icon: Eye, color: "#fbbf24", unlocked: stats.totalViews >= 1000000 },
            { name: "Top Rated", icon: Star, color: "#10b981", unlocked: stats.totalLikes > 100 },
          ].map((badge) => (
            <motion.div
              key={badge.name}
              variants={fadeUp}
              className="creator-badge"
              style={{ opacity: badge.unlocked ? 1 : 0.4 }}
            >
              <div style={{ width: 56, height: 56, margin: "0 auto 0.75rem", borderRadius: "50%", background: badge.unlocked ? `${badge.color}25` : "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", border: badge.unlocked ? `2px solid ${badge.color}` : "2px solid rgba(255,255,255,0.1)" }}>
                <badge.icon size={26} color={badge.unlocked ? badge.color : "var(--creator-text-3)"} />
              </div>
              <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>{badge.name}</div>
              <div style={{ fontSize: "0.7rem", color: "var(--creator-text-3)", marginTop: "0.25rem" }}>
                {badge.unlocked ? "Unlocked" : "Locked"}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>
    </div>
  );
}