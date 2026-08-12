import React, { useState } from "react";
import { UploadCloud, Link, Trash2 } from "lucide-react";
import { uploadFileToR2 } from "@/lib/r2Upload";

export default function TrailerUploader({ trailerTracks, setTrailerTracks }: any) {
  const [manualTrailerTitle, setManualTrailerTitle] = useState("");
  const [trailerUploading, setTrailerUploading] = useState(false);

  const handleDeviceTrailerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setTrailerUploading(true);
    try {
      const publicUrl = await uploadFileToR2(file, "TRAILER");
      setTrailerTracks([...trailerTracks, { title: manualTrailerTitle || "Official Trailer", hlsManifestUrl: publicUrl }]);
      setManualTrailerTitle("");
    } catch (error: any) {
      alert(error?.message || "Trailer upload failed");
    } finally {
      setTrailerUploading(false);
    }
  };

  return (
    <div className="panel-card-glass">
      <h3 style={{ fontSize: "0.8rem", color: "#a1a1aa", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 1rem 0" }}>Trailers & Extra Promotional Tracks</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <div className="input-group-wrapper">
          <label>Promo Track Label Name</label>
          <input type="text" placeholder="e.g. Official Cinematic Trailer 1" value={manualTrailerTitle} onChange={(e) => setManualTrailerTitle(e.target.value)} className="input-text-field" />
        </div>
        <div className="interactive-dropzone-box" style={{ padding: "1.25rem" }}>
          <input type="file" accept="video/*" disabled={trailerUploading} onChange={handleDeviceTrailerUpload} className="hidden-native-input" />
          <UploadCloud style={{ width: "1.5rem", height: "1.5rem", color: "#e11d48", marginBottom: "0.25rem" }} />
          <p style={{ fontSize: "0.8rem", color: "#ffffff", margin: 0, fontWeight: 500 }}>{trailerUploading ? "Uploading..." : "Click or drop a trailer video clip file"}</p>
        </div>
      </div>

      {trailerTracks.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "1rem" }}>
          {trailerTracks.map((tr: any, i: number) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 0.75rem", backgroundColor: "#09090b", border: "1px solid #27272a", borderRadius: "0.375rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", overflow: "hidden", width: "100%" }}>
                <Link style={{ width: "0.85rem", height: "0.85rem", color: "#10b981", flexShrink: 0 }} />
                <span style={{ fontSize: "0.85rem", color: "#fafafa" }}>{tr.title}</span>
              </div>
              <button type="button" onClick={() => setTrailerTracks(trailerTracks.filter((_: any, idx: number) => idx !== i))} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#71717a" }}><Trash2 style={{ width: "0.95rem", height: "0.95rem" }} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}