"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

export default function CreatorEarningsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch("/api/creator/earnings");
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "Unable to load earnings");
        setData(payload);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) {
    return <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "linear-gradient(135deg, #020617 0%, #111827 100%)", color: "#fff" }}>Loading earnings...</div>;
  }

  return (
    <main style={{ minHeight: "100vh", padding: "6rem 1.5rem 3rem", background: "linear-gradient(135deg, #020617 0%, #111827 100%)", color: "#f8fafc" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gap: "1rem" }}>
        <section style={{ padding: "1.6rem", borderRadius: 24, background: "rgba(15,23,42,0.86)", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "0 24px 80px rgba(0,0,0,0.28)" }}>
          <Link href="/creator" style={{ color: "#38bdf8", textDecoration: "none", fontWeight: 700 }}>← Back to creator studio</Link>
          <h1 style={{ margin: "0.7rem 0 0.35rem", fontSize: "1.8rem" }}>Revenue dashboard</h1>
          <p style={{ margin: 0, color: "#cbd5e1", lineHeight: 1.6 }}>Your current balance, recent payouts, and view-based earnings activity.</p>
        </section>

        <section style={{ display: "grid", gap: "1rem", gridTemplateColumns: "0.95fr 1.05fr" }}>
          <div style={{ padding: "1.4rem", borderRadius: 24, background: "rgba(15,23,42,0.86)", border: "1px solid rgba(255,255,255,0.12)" }}>
            <p style={{ margin: 0, textTransform: "uppercase", letterSpacing: "0.25em", color: "#f43f5e", fontSize: "0.75rem" }}>Available balance</p>
            <div style={{ marginTop: "0.7rem", fontSize: "2rem", fontWeight: 800 }}>${Number(data?.creatorProfile?.currentBalance ?? 0).toFixed(2)}</div>
            <p style={{ color: "#94a3b8", marginBottom: 0 }}>Balanced from view-driven earnings and creator payouts.</p>
          </div>

          <div style={{ padding: "1.4rem", borderRadius: 24, background: "rgba(15,23,42,0.86)", border: "1px solid rgba(255,255,255,0.12)" }}>
            <h2 style={{ marginTop: 0, marginBottom: "0.5rem" }}>Recent payouts</h2>
            {data?.payouts?.length ? data.payouts.map((item: any) => (
              <div key={item.id} style={{ borderTop: "1px solid rgba(255,255,255,0.12)", padding: "0.75rem 0" }}>
                <div style={{ fontWeight: 600 }}>{item.description || item.status}</div>
                <div style={{ color: "#94a3b8", fontSize: "0.9rem" }}>${Number(item.amount).toFixed(2)} • {item.status} • {new Date(item.createdAt).toLocaleString()}</div>
              </div>
            )) : <p style={{ color: "#94a3b8" }}>No payouts yet.</p>}
          </div>
        </section>

        <section style={{ padding: "1.4rem", borderRadius: 24, background: "rgba(15,23,42,0.86)", border: "1px solid rgba(255,255,255,0.12)" }}>
          <h2 style={{ marginTop: 0 }}>Recent earnings events</h2>
          {data?.earnings?.length ? data.earnings.map((item: any) => (
            <div key={item.id} style={{ borderTop: "1px solid rgba(255,255,255,0.12)", padding: "0.8rem 0" }}>
              <div style={{ fontWeight: 600 }}>{item.sourceType}</div>
              <div style={{ color: "#94a3b8", fontSize: "0.9rem" }}>${Number(item.amount).toFixed(2)} • {new Date(item.createdAt).toLocaleString()}</div>
            </div>
          )) : <p style={{ color: "#94a3b8" }}>No earnings yet.</p>}
        </section>
      </div>
    </main>
  );
}
