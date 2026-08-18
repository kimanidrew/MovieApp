import React, { useState } from "react";
import { UploadCloud, CheckCircle, Info, Loader2, ExternalLink } from "lucide-react";
import { uploadFileToR2 } from "@/lib/r2Upload";

interface MainVideoUploaderProps {
  mainVideoFile: File | null;
  setMainVideoFile: (file: File | null) => void;
  uploadedVideoUrl: string;
  setUploadedVideoUrl: (url: string) => void;
  commitCompleteAssetToDb: () => void;
  saving: boolean;
  isFormValid: boolean;
}

export default function MainVideoUploader({
  mainVideoFile,
  setMainVideoFile,
  uploadedVideoUrl,
  setUploadedVideoUrl,
  commitCompleteAssetToDb,
  saving,
  isFormValid,
}: MainVideoUploaderProps) {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatusText, setUploadStatusText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [manualVideoUrl, setManualVideoUrl] = useState("");

  const startR2VideoUpload = async () => {
    if (!mainVideoFile) return;
    setUploading(true);
    setUploadProgress(1);
    setUploadStatusText("Acquiring upload authorization ticket...");

    try {
      const publicUrl = await uploadFileToR2(mainVideoFile, "VIDEO", (percent) => {
        // Map 20%->95% to actual upload progress
        setUploadProgress(Math.min(95, Math.max(15, Math.round(percent * 0.8))));
        setUploadStatusText(`Uploading to Cloudflare R2... ${percent}%`);
      });

      setUploadedVideoUrl(publicUrl);
      setUploadProgress(100);
      setUploadStatusText("Upload complete! Video saved to Cloudflare R2.");
    } catch (error: any) {
      setUploadProgress(0);
      setUploadStatusText(error?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const applyManualUrl = () => {
    const url = manualVideoUrl.trim();
    if (!url) return;
    setUploadedVideoUrl(url);
    setUploadProgress(100);
    setUploadStatusText("Video URL linked manually.");
  };

  const hasVideo = Boolean(uploadedVideoUrl);

  return (
    <div className="sticky-sidebar-container">
      <div className={`panel-card-glass ${hasVideo ? "active-step" : ""}`}>
        <h2 style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: "1.25rem", marginTop: 0, display: "flex", alignItems: "center" }}>
          <span className="step-number-badge">3</span> Video Media Stream
        </h2>

        <div className="interactive-dropzone-box">
          <input
            type="file"
            accept="video/*"
            disabled={uploading || hasVideo}
            onChange={(e) => setMainVideoFile(e.target.files?.[0] || null)}
            className="hidden-native-input"
          />
          <UploadCloud style={{ width: "2rem", height: "2rem", color: "#71717a", marginBottom: "0.5rem" }} />
          <p style={{ fontSize: "0.85rem", color: "#ffffff", margin: 0, fontWeight: 500 }}>
            {mainVideoFile ? mainVideoFile.name : "Select master source video file"}
          </p>
        </div>

        {mainVideoFile && !hasVideo && (
          <button
            onClick={startR2VideoUpload}
            disabled={uploading}
            className="btn-execution-commit"
            style={{ backgroundColor: "#e11d48", color: "#ffffff" }}
          >
            {uploading ? "Uploading..." : "Start Direct R2 Upload"}
          </button>
        )}

        {uploadProgress > 0 && (
          <div className="pipeline-status-container">
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem" }}>
              <span style={{ color: "#a1a1aa" }}>{uploadStatusText}</span>
              <span style={{ color: "#ffffff", fontWeight: 600 }}>{uploadProgress}%</span>
            </div>
            <div className="progressbar-track">
              <div className="progressbar-indicator" style={{ width: `${uploadProgress}%` }} />
            </div>
          </div>
        )}

        {hasVideo && (
          <div style={{ backgroundColor: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.2)", padding: "0.75rem 1rem", borderRadius: "0.5rem", display: "flex", gap: "0.5rem", alignItems: "center", marginTop: "1rem" }}>
            <CheckCircle style={{ width: "1.25rem", height: "1.25rem", color: "#10b981", flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: "0.85rem", fontWeight: 500, color: "#10b981", margin: 0 }}>
                Video attached to this title
              </p>
              <a
                href={uploadedVideoUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: "0.7rem", color: "#7dd3fc", display: "flex", alignItems: "center", gap: "0.25rem", marginTop: "0.25rem", wordBreak: "break-all" }}
              >
                <ExternalLink size={10} /> {uploadedVideoUrl.slice(0, 80)}...
              </a>
            </div>
            <button
              onClick={() => { setUploadedVideoUrl(""); setMainVideoFile(null); setUploadProgress(0); }}
              style={{ background: "transparent", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "0.75rem", flexShrink: 0 }}
            >
              Replace
            </button>
          </div>
        )}

        {/* Manual URL option */}
        {!hasVideo && (
          <>
            <div style={{ marginTop: "1.25rem", paddingTop: "1rem", borderTop: "1px solid #27272a" }}>
              <p style={{ fontSize: "0.75rem", color: "#71717a", margin: "0 0 0.5rem 0" }}>
                Or paste an existing video URL (HLS / MP4):
              </p>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <input
                  type="text"
                  value={manualVideoUrl}
                  onChange={(e) => setManualVideoUrl(e.target.value)}
                  placeholder="https://.../stream.m3u8"
                  className="input-text-field"
                  style={{ flex: 1 }}
                />
                <button onClick={applyManualUrl} className="btn-secondary" style={{ padding: "0.5rem 1rem" }}>
                  Link
                </button>
              </div>
            </div>
          </>
        )}

        <div style={{ marginTop: "2rem", paddingTop: "1.25rem", borderTop: "1px solid #27272a" }}>
          <button
            onClick={commitCompleteAssetToDb}
            disabled={saving}
            className="btn-execution-commit"
          >
            {saving ? <Loader2 style={{ width: "1rem", height: "1rem", animation: "spin 1s linear infinite" }} /> : "Save Title to Catalog"}
          </button>

          <p style={{ display: "flex", gap: "0.35rem", fontSize: "0.75rem", color: "#71717a", marginTop: "0.75rem", lineHeight: "1.3" }}>
            <Info style={{ width: "0.85rem", height: "0.85rem", flexShrink: 0, color: "#a1a1aa" }} />
            You can save the title metadata now and attach the video stream later.
          </p>
        </div>
      </div>
    </div>
  );
}