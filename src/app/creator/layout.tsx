"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import "./creator.css";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/creator" },
  { label: "Upload", href: "/creator/upload" },
  { label: "Analytics", href: "/creator" },
  { label: "Community", href: "/creator" },
  { label: "Earnings", href: "/creator" },
];

export default function CreatorLayout({ children }: { children: React.ReactNode }) {
  const { customerUser, activeProfile } = useAuth();
  const [creatorData, setCreatorData] = useState<any>(null);

  useEffect(() => {
    fetch("/api/creator/me")
      .then((res) => res.json())
      .then((data) => {
        if (data?.creatorProfile) setCreatorData(data);
      })
      .catch(console.error);
  }, []);

  const displayName = creatorData?.creatorProfile?.channelName || customerUser?.email?.split("@")[0] || "Creator";
  const avatarInitials = displayName.slice(0, 2).toUpperCase();
  const profileName = activeProfile?.name || "No Profile";

  return (
    <div className="creator-page">
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "rgba(11, 11, 15, 0.8)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div
          style={{
            maxWidth: 1400,
            margin: "0 auto",
            padding: "0.9rem 1.5rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1rem",
          }}
        >
          <Link href="/creator" style={{ display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none" }}>
            <span
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: "linear-gradient(135deg, #8b5cf6, #38bdf8)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                fontSize: "1.05rem",
                color: "#fff",
                boxShadow: "0 4px 16px rgba(139,92,246,0.4)",
              }}
            >
              C
            </span>
            <span style={{ fontWeight: 700, fontSize: "1.1rem", background: "linear-gradient(135deg,#fff,#a1a1aa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              Creator Studio
            </span>
          </Link>

          <nav style={{ display: "flex", gap: "0.25rem", overflowX: "auto" }} className="creator-scroll">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: 9999,
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  color: "var(--creator-text-2)",
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                  transition: "all 0.2s",
                  border: "1px solid transparent",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                  e.currentTarget.style.color = "#fff";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "var(--creator-text-2)";
                }}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <Link href="/creator/upload" className="creator-btn creator-btn-primary" style={{ textDecoration: "none" }}>
              + New Upload
            </Link>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#fff" }}>{displayName}</div>
                <div style={{ fontSize: "0.65rem", color: "var(--creator-text-3)" }}>{profileName}</div>
              </div>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #8b5cf6, #6366f1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.9rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  border: "2px solid rgba(255,255,255,0.2)",
                }}
              >
                {avatarInitials}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main style={{ position: "relative", zIndex: 1 }}>{children}</main>
    </div>
  );
}