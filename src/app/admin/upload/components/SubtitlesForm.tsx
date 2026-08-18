"use client";

import React, { useState, useEffect } from "react";
import { Subtitles, Plus, X } from "lucide-react";

export default function SubtitlesForm({ subtitles, setSubtitles, videoDetails, setVideoDetails }: any) {
  const [languages, setLanguages] = useState<any[]>([]);
  const [newLangId, setNewLangId] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newIsCC, setNewIsCC] = useState(false);

  useEffect(() => {
    fetch("/api/admin/languages")
      .then((res) => res.json())
      .then((data) => { if (Array.isArray(data)) setLanguages(data); })
      .catch(console.error);
  }, []);

  const handleAddSubtitle = () => {
    if (!newLangId || !newUrl.trim()) return;
    setSubtitles([
      ...subtitles,
      {
        languageId: newLangId,
        label: newLabel.trim() || "English",
        url: newUrl.trim(),
        isCC: newIsCC,
      },
    ]);
    setNewLangId("");
    setNewLabel("");
    setNewUrl("");
    setNewIsCC(false);
  };

  const getLangName = (id: string) => {
    const lang = languages.find((l: any) => l.id === id);
    return lang ? lang.name : id;
  };

  return (
    <div className="panel-card-glass">
      <h2 style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: "1.25rem", marginTop: 0, display: "flex", alignItems: "center" }}>
        <span className="step-number-badge"><Subtitles size={12} /></span> Subtitle Tracks
      </h2>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 2fr auto auto", gap: "0.5rem" }}>
        <select value={newLangId} onChange={(e) => setNewLangId(e.target.value)} className="input-text-field">
          <option value="">Language...</option>
          {languages.map((lang: any) => (
            <option key={lang.id} value={lang.id}>{lang.name}</option>
          ))}
        </select>
        <input type="text" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="Label (e.g. English)" className="input-text-field" />
        <input type="text" value={newUrl} onChange={(e) => setNewUrl(e.target.value)} placeholder="Subtitle file URL (.vtt/.srt)" className="input-text-field" />
        <label style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.75rem", color: "#a1a1aa" }}>
          <input type="checkbox" checked={newIsCC} onChange={(e) => setNewIsCC(e.target.checked)} style={{ width: "14px", height: "14px" }} />
          CC
        </label>
        <button type="button" onClick={handleAddSubtitle} className="btn-category-append"><Plus style={{ width: "1rem", height: "1rem" }} /></button>
      </div>

      {subtitles.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", marginTop: "0.75rem" }}>
          {subtitles.map((s: any, i: number) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 0.75rem", background: "#09090b", border: "1px solid #27272a", borderRadius: "0.375rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flex: 1, overflow: "hidden" }}>
                <Subtitles size={14} style={{ color: "#a1a1aa", flexShrink: 0 }} />
                <span style={{ fontSize: "0.85rem", color: "#fafafa", fontWeight: 500 }}>{s.label}</span>
                <span style={{ fontSize: "0.75rem", color: "#71717a" }}>{getLangName(s.languageId)}{s.isCC ? " · CC" : ""}</span>
              </div>
              <button type="button" onClick={() => setSubtitles(subtitles.filter((_: any, idx: number) => idx !== i))} style={{ background: "transparent", border: "none", color: "#71717a", cursor: "pointer" }}>
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}