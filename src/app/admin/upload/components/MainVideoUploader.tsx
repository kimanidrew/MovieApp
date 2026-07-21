import React, { useState } from "react";
import { UploadCloud, CheckCircle, Info, Loader2 } from "lucide-react";

export default function MainVideoUploader({ mainVideoFile, setMainVideoFile, uploadedVideoUrl, setUploadedVideoUrl, commitCompleteAssetToDb, saving, isFormValid }: any) {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatusText, setUploadStatusText] = useState("");

  const startR2VideoUpload = async () => {
    if (!mainVideoFile) return;
    setUploadProgress(1);
    setUploadStatusText("Acquiring upload authorization ticket...");
    
    // MOCKED: Replace this timeout block with your uploadToR2 XMLHttpRequest block
    let progress = 1;
    const interval = setInterval(() => {
      progress += 10;
      setUploadProgress(progress);
      setUploadStatusText("Pushing video segments directly to R2...");
      if (progress >= 100) {
        clearInterval(interval);
        setUploadedVideoUrl("https://cloudflare-r2-public-url.com/mock-video.mp4");
        setUploadStatusText("Upload complete!");
      }
    }, 200);
  };

  return (
    <div className="sticky-sidebar-container">
      <div className={`panel-card-glass ${mainVideoFile ? "active-step" : ""}`}>
        <h2 style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: "1.25rem", marginTop: 0, display: "flex", alignItems: "center" }}>
          <span className="step-number-badge">3</span> Video Media Stream
        </h2>

        <div className="interactive-dropzone-box">
          <input type="file" accept="video/*" onChange={(e) => setMainVideoFile(e.target.files?.[0] || null)} className="hidden-native-input" />
          <UploadCloud style={{ width: "2rem", height: "2rem", color: "#71717a", marginBottom: "0.5rem" }} />
          <p style={{ fontSize: "0.85rem", color: "#ffffff", margin: 0, fontWeight: 500 }}>{mainVideoFile ? mainVideoFile.name : "Select master source video file"}</p>
        </div>

        {mainVideoFile && !uploadedVideoUrl && (
          <button onClick={startR2VideoUpload} className="btn-execution-commit" style={{ backgroundColor: "#e11d48", color: "#ffffff" }}>Start Direct R2 Upload</button>
        )}

        {uploadProgress > 0 && (
          <div className="pipeline-status-container">
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem" }}>
              <span style={{ color: "#a1a1aa" }}>{uploadStatusText}</span>
              <span style={{ color: "#ffffff", fontWeight: 600 }}>{uploadProgress}%</span>
            </div>
            <div className="progressbar-track"><div className="progressbar-indicator" style={{ width: `${uploadProgress}%` }} /></div>
          </div>
        )}

        {uploadedVideoUrl && (
          <div style={{ backgroundColor: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.2)", padding: "0.75rem 1rem", borderRadius: "0.5rem", display: "flex", gap: "0.5rem", alignItems: "center", marginTop: "1rem" }}>
            <CheckCircle style={{ width: "1.25rem", height: "1.25rem", color: "#10b981", flexShrink: 0 }} />
            <p style={{ fontSize: "0.85rem", fontWeight: 500, color: "#10b981", margin: 0 }}>Linked to direct R2 public resource</p>
          </div>
        )}

        <div style={{ marginTop: "2rem", paddingTop: "1.25rem", borderTop: "1px solid #27272a" }}>
          <button onClick={commitCompleteAssetToDb} disabled={saving || !isFormValid} className="btn-execution-commit">
            {saving ? <Loader2 style={{ width: "1rem", height: "1rem", animation: "spin 1s linear infinite" }} /> : "Save Complete Title to Catalog"}
          </button>
          
          {!isFormValid && (
            <p style={{ display: "flex", gap: "0.35rem", fontSize: "0.75rem", color: "#71717a", marginTop: "0.75rem", lineHeight: "1.3" }}>
              <Info style={{ width: "0.85rem", height: "0.85rem", flexShrink: 0, color: "#a1a1aa" }} />
              Please ensure you have linked a title and uploaded the main video.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}