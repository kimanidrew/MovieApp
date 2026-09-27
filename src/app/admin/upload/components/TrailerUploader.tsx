import React, { useRef, useState } from "react";
import { UploadCloud, Link, Trash2, Loader2 } from "lucide-react";
import { uploadFileToR2 } from "@/lib/r2Upload";

export default function TrailerUploader({ trailerTracks, setTrailerTracks }: any) {
  const [title, setTitle] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = async (file: File | undefined) => {
    if (!file) return;
    setError("");
    if (!file.type.startsWith("video/")) { setError("Please choose a video file."); return; }
    if (file.size > 10 * 1024 * 1024 * 1024) { setError("Trailer files must be 10 GB or smaller."); return; }
    setUploading(true);
    try {
      const url = await uploadFileToR2(file, "TRAILER");
      setTrailerTracks([...trailerTracks, { title: title.trim() || "Official Trailer", hlsManifestUrl: url }]);
      setTitle("");
      if (inputRef.current) inputRef.current.value = "";
    } catch (e: any) {
      setError(e?.message || "Trailer upload failed.");
    } finally { setUploading(false); }
  };

  return (
    <div className="panel-card-glass">
      <h3 className="upload-section-title-small">Trailers & promotional video</h3>
      <p className="section-helper">Add one or more trailers. Give each clip a clear title so the catalog is easy to manage.</p>
      <div className="input-group-wrapper">
        <label>Trailer title</label>
        <input type="text" placeholder="Official Trailer" value={title} onChange={(e) => setTitle(e.target.value)} className="input-text-field" />
      </div>
      <div className="interactive-dropzone-box compact-dropzone">
        <input ref={inputRef} type="file" accept="video/*" disabled={uploading} onChange={(e) => upload(e.target.files?.[0])} className="hidden-native-input" />
        {uploading ? <Loader2 className="spin-icon" /> : <UploadCloud size={22} />}
        <strong>{uploading ? "Uploading trailer…" : "Choose trailer video"}</strong>
        <span>Up to 10 GB</span>
      </div>
      {error && <div className="upload-error">{error}</div>}
      {trailerTracks.length > 0 && (
        <div className="trailer-list">
          {trailerTracks.map((tr: any, i: number) => (
            <div key={`${tr.hlsManifestUrl}-${i}`} className="trailer-row">
              <div><Link size={14} /><span>{tr.title}</span></div>
              <button type="button" onClick={() => setTrailerTracks(trailerTracks.filter((_: any, idx: number) => idx !== i))} aria-label={`Remove ${tr.title}`}><Trash2 size={15} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
