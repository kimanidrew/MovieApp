import React, { useRef, useState } from "react";
import { ImageIcon, Loader2, Trash2 } from "lucide-react";
import { uploadFileToR2 } from "@/lib/r2Upload";

export default function GraphicAssetsUploader({ imageAssets, setImageAssets }: any) {
  const [uploadingType, setUploadingType] = useState<"POSTER" | "BACKDROP" | "">("");
  const [error, setError] = useState("");
  const posterRef = useRef<HTMLInputElement>(null);
  const backdropRef = useRef<HTMLInputElement>(null);

  const upload = async (file: File | undefined, type: "POSTER" | "BACKDROP") => {
    if (!file) return;
    setError("");
    if (!file.type.startsWith("image/")) { setError("Please choose an image file."); return; }
    if (file.size > 20 * 1024 * 1024) { setError("Images must be 20 MB or smaller."); return; }
    setUploadingType(type);
    try {
      const url = await uploadFileToR2(file, type, (p) => setError(p < 100 ? `${type === "POSTER" ? "Poster" : "Backdrop"} upload: ${p}%` : ""));
      const count = imageAssets.filter((img: any) => img.type === type).length;
      setImageAssets([...imageAssets, { url, type, displayOrder: count }]);
    } catch (e: any) {
      setError(e?.message || "Image upload failed.");
    } finally {
      setUploadingType("");
    }
  };

  const remove = (index: number) => {
    const next = imageAssets.filter((_: any, i: number) => i !== index).map((img: any, i: number) => ({ ...img, displayOrder: img.type === imageAssets[index]?.type ? i : img.displayOrder }));
    setImageAssets(next);
  };

  return (
    <div className="panel-card-glass">
      <h3 className="upload-section-title-small"><span className="step-number-badge">2</span> Artwork</h3>
      <p className="section-helper">Upload posters and backdrops. TMDB artwork can also be added automatically from the search above.</p>
      <div className="image-uploader-grid">
        <div className="mini-device-uploader">
          <input ref={posterRef} type="file" accept="image/*" disabled={Boolean(uploadingType)} onChange={(e) => upload(e.target.files?.[0], "POSTER")} className="hidden-native-input" />
          {uploadingType === "POSTER" ? <Loader2 className="spin-icon" /> : <ImageIcon size={20} />}
          <strong>{uploadingType === "POSTER" ? "Uploading poster…" : "Add poster"}</strong>
          <span>Recommended portrait artwork</span>
        </div>
        <div className="mini-device-uploader">
          <input ref={backdropRef} type="file" accept="image/*" disabled={Boolean(uploadingType)} onChange={(e) => upload(e.target.files?.[0], "BACKDROP")} className="hidden-native-input" />
          {uploadingType === "BACKDROP" ? <Loader2 className="spin-icon" /> : <ImageIcon size={20} />}
          <strong>{uploadingType === "BACKDROP" ? "Uploading backdrop…" : "Add backdrop"}</strong>
          <span>Recommended landscape artwork</span>
        </div>
      </div>
      {error && <div className={`upload-error ${error.includes("upload:") ? "upload-progress-note" : ""}`}>{error}</div>}
      {imageAssets.length > 0 && (
        <div className="gallery-display-matrix">
          {imageAssets.map((img: any, i: number) => (
            <div key={`${img.url}-${i}`} className="gallery-card-item">
              <img src={img.url} className="asset-preview-render" alt={img.type === "POSTER" ? "Poster preview" : "Backdrop preview"} />
              <span className="asset-type-badge">{img.type}</span>
              <button type="button" onClick={() => remove(i)} className="delete-overlay" aria-label="Remove artwork"><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
