"use client";

import React, { useState } from "react";
import { Trophy, Plus, X } from "lucide-react";

export default function AwardsForm({ awards, setAwards }: any) {
  const [newAcademy, setNewAcademy] = useState("");
  const [newYear, setNewYear] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newIsWinner, setNewIsWinner] = useState(false);

  const handleAddAward = () => {
    if (!newAcademy.trim() || !newYear) return;
    setAwards([
      ...awards,
      {
        academy: newAcademy.trim(),
        year: Number(newYear),
        category: newCategory.trim() || "General",
        isWinner: newIsWinner,
      },
    ]);
    setNewAcademy("");
    setNewYear("");
    setNewCategory("");
    setNewIsWinner(false);
  };

  return (
    <div className="panel-card-glass">
      <h2 style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: "1.25rem", marginTop: 0, display: "flex", alignItems: "center" }}>
        <span className="step-number-badge"><Trophy size={12} /></span> Awards & Nominations
      </h2>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto auto", gap: "0.5rem" }}>
        <input type="text" value={newAcademy} onChange={(e) => setNewAcademy(e.target.value)} placeholder="Academy (e.g. Oscars)" className="input-text-field" />
        <input type="number" value={newYear} onChange={(e) => setNewYear(e.target.value)} placeholder="Year" className="input-text-field" />
        <input type="text" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="Category (e.g. Best Picture)" className="input-text-field" />
        <label style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.75rem", color: "#a1a1aa" }}>
          <input type="checkbox" checked={newIsWinner} onChange={(e) => setNewIsWinner(e.target.checked)} style={{ width: "14px", height: "14px" }} />
          Winner
        </label>
        <button type="button" onClick={handleAddAward} className="btn-category-append"><Plus style={{ width: "1rem", height: "1rem" }} /></button>
      </div>

      {awards.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", marginTop: "0.75rem" }}>
          {awards.map((a: any, i: number) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 0.75rem", background: "#09090b", border: "1px solid #27272a", borderRadius: "0.375rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flex: 1 }}>
                <Trophy size={14} style={{ color: a.isWinner ? "#fbbf24" : "#a1a1aa", flexShrink: 0 }} />
                <span style={{ fontSize: "0.85rem", color: "#fafafa", fontWeight: 500 }}>{a.academy}</span>
                <span style={{ fontSize: "0.75rem", color: "#71717a" }}>{a.year} · {a.category}{a.isWinner ? " · Winner" : ""}</span>
              </div>
              <button type="button" onClick={() => setAwards(awards.filter((_: any, idx: number) => idx !== i))} style={{ background: "transparent", border: "none", color: "#71717a", cursor: "pointer" }}>
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}