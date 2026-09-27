"use client";

import React, { useEffect, useRef, useState } from "react";
import { Subtitles, Plus, X, UploadCloud, Loader2, Link2 } from "lucide-react";
import { uploadFileToR2 } from "@/lib/r2Upload";

export default function SubtitlesForm({ subtitles, setSubtitles }: any) {
  const [languages, setLanguages] = useState<any[]>([]);
  const [newLangId, setNewLangId] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newIsCC, setNewIsCC] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [sourceMode, setSourceMode] = useState<"FILE" | "URL">("FILE");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/admin/languages")
      .then((res) => res.json())
      .then((data) => { if (Array.isArray(data)) setLanguages(data); })
      .catch(() => setError("Could not load subtitle languages."));
  }, []);

  const chooseSubtitle = async (file?: File) => {
    if (!file) return;
    setError("");
    const validMime = ["text/vtt", "text/plain", "application/x-subrip", "application/octet-stream"].includes(file.type);
    const validExtension = /\.(vtt|srt|webvtt)$/i.test(file.name);
    if (!validMime && !validExtension) {
      setError("Please choose a .VTT or .SRT subtitle file.");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setError("Subtitle files must be 20 MB or smaller.");
      return;
    }
    if (!newLangId) {
      setError("Select the subtitle language before uploading.");
      return;
    }

    setUploading(true);
    setProgress(1);
    try {
      const url = await uploadFileToR2(file, "SUBTITLE", setProgress);
      setNewUrl(url);
      setSourceMode("FILE");
    } catch (e: any) {
      setError(e?.message || "Subtitle upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const addSubtitle = () => {
    const url = newUrl.trim();
    if (!newLangId) {
      setError("Select a subtitle language.");
      return;
    }
    if (!url) {
      setError("Upload a subtitle file or enter a subtitle URL.");
      return;
    }
    if (sourceMode === "URL") {
      try {
        const parsed = new URL(url);
        if (parsed.protocol !== "http:" && parsed.protocol !== "https:") throw new Error();
      } catch {
        setError("Enter a valid HTTP or HTTPS subtitle URL.");
        return;
      }
    }

    setSubtitles([
      ...subtitles,
      {
        languageId: newLangId,
        label: newLabel.trim() || "English",
        url,
        isCC: newIsCC,
        sourceType: sourceMode === "FILE" ? "R2" : "EXTERNAL_URL",
      },
    ]);
    setNewLangId("");
    setNewLabel("");
    setNewUrl("");
    setNewIsCC(false);
    setProgress(0);
    setError("");
  };

  const removeSubtitle = (index: number) => setSubtitles(subtitles.filter((_: any, idx: number) => idx !== index));

  const getLangName = (id: string) => languages.find((l: any) => l.id === id)?.name || id;

  return (
    <div className="panel-card-glass">
      <h2 style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: "1.25rem", marginTop: 0, display: "flex", alignItems: "center" }}>
        <span className="step-number-badge"><Subtitles size={12} /></span> Subtitle Tracks
      </h2>

      <div style={{ display: "flex", gap: "0.4rem", marginBottom: "0.75rem" }}>
        <button type="button" className={sourceMode === "FILE" ? "btn-execution-commit tidpix-primary" : "btn-secondary"} onClick={() => setSourceMode("FILE")} disabled={uploading}>
          <UploadCloud size={14} /> Upload from computer
        </button>
        <button type="button" className={sourceMode === "URL" ? "btn-execution-commit tidpix-primary" : "btn-secondary"} onClick={() => setSourceMode("URL")} disabled={uploading}>
          <Link2 size={14} /> Use URL
        </button>
      </div>

      <div className="panel-grid-inner">
        <div>
          <div className="input-group-wrapper">
            <label>Language</label>
            <select value={newLangId} onChange={(e) => setNewLangId(e.target.value)} className="input-text-field">
              <option value="">Language...</option>
              {languages.map((lang: any) => <option key={lang.id} value={lang.id}>{lang.name}</option>)}
            </select>
          </div>
        </div>
        <div>
          <div className="input-group-wrapper">
            <label>Label</label>
            <input type="text" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="English" className="input-text-field" />
          </div>
        </div>

        <div className="grid-col-full">
          {sourceMode === "FILE" ? (
            <>
              <input ref={inputRef} type="file" accept=".vtt,.srt,.webvtt,text/vtt,text/plain" className="hidden-native-input" disabled={uploading} onChange={(e) => chooseSubtitle(e.target.files?.[0])} />
              <button type="button" className="btn-secondary" disabled={uploading || !newLangId} onClick={() => inputRef.current?.click()}>
                {uploading ? <><Loader2 size={14} className="spin-icon" /> Uploading {progress}%</> : <><UploadCloud size={14} /> Choose subtitle file</>}
              </button>
              {newUrl && <div className="save-reminder">Uploaded: {newUrl}</div>}
              {uploading && <div className="progressbar-track"><div className="progressbar-indicator" style={{ width: `${progress}%` }} /></div>}
            </>
          ) : (
            <div className="input-group-wrapper">
              <label>Subtitle URL</label>
              <input type="url" value={newUrl} onChange={(e) => setNewUrl(e.target.value)} placeholder="https://example.com/subtitles/en.vtt" className="input-text-field" />
            </div>
          )}
        </div>

        <div>
          <label style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.75rem", color: "#a1a1aa" }}>
            <input type="checkbox" checked={newIsCC} onChange={(e) => setNewIsCC(e.target.checked)} style={{ width: "14px", height: "14px" }} />
            Closed captions (CC)
          </label>
        </div>

        <div>
          <button type="button" onClick={addSubtitle} className="btn-category-append" disabled={uploading || !newUrl.trim()}>
            <Plus size={16} /> Add subtitle
          </button>
        </div>
      </div>

      {error && <div className="upload-error" role="alert" style={{ marginTop: "0.75rem" }}>{error}</div>}

      {subtitles.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", marginTop: "0.75rem" }}>
          {subtitles.map((s: any, i: number) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.65rem 0.75rem", background: "#09090b", border: "1px solid #27272a", borderRadius: "0.375rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flex: 1, overflow: "hidden" }}>
                <Subtitles size={14} style={{ color: "#f4b400", flexShrink: 0 }} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: "0.85rem", color: "#fafafa", fontWeight: 500 }}>{s.label}</div>
                  <div style={{ fontSize: "0.72rem", color: "#71717a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {getLangName(s.languageId)} · {s.sourceType === "R2" ? "Uploaded file" : "External URL"}{s.isCC ? " · CC" : ""}
                  </div>
                </div>
              </div>
              <button type="button" onClick={() => removeSubtitle(i)} style={{ background: "transparent", border: "none", color: "#71717a", cursor: "pointer" }}>
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}