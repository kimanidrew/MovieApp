import React, { useRef, useState } from "react";
import { UploadCloud, CheckCircle, Info, Loader2, ExternalLink, RefreshCw } from "lucide-react";
import { uploadFileToR2 } from "@/lib/r2Upload";

interface Props {
  mainVideoFile: File | null;
  setMainVideoFile: (file: File | null) => void;
  uploadedVideoUrl: string;
  setUploadedVideoUrl: (url: string) => void;
  commitCompleteAssetToDb: () => void;
  saving: boolean;
  isFormValid: boolean;
  setVideoDetails: (details: any) => void;
}

export default function MainVideoUploader({ mainVideoFile, setMainVideoFile, uploadedVideoUrl, setUploadedVideoUrl, commitCompleteAssetToDb, saving, isFormValid, setVideoDetails }: Props) {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [manualVideoUrl, setManualVideoUrl] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const chooseFile = (file?: File) => {
    if (!file) return;
    setError("");
    setStatus("");
    setUploadProgress(0);
    if (!file.type.startsWith("video/")) {
      setError("Please choose a video file.");
      return;
    }
    if (file.size > 10 * 1024 * 1024 * 1024) {
      setError("Video files must be 10 GB or smaller.");
      return;
    }
    setMainVideoFile(file);

    const objectUrl = URL.createObjectURL(file);
    const probe = document.createElement("video");
    probe.preload = "metadata";
    probe.onloadedmetadata = () => {
      const duration = Number.isFinite(probe.duration) ? Math.round(probe.duration) : "";
      const width = probe.videoWidth || 0;
      const height = probe.videoHeight || 0;
      const gcd = (a: number, b: number): number => b ? gcd(b, a % b) : a;
      const ratio = width && height ? `${width / gcd(width, height)}:${height / gcd(width, height)}` : "";
      const resolution = height >= 4320 ? "UHD_8K" : height >= 2160 ? "UHD_4K" : height >= 1080 ? "P1080" : height >= 720 ? "P720" : height >= 480 ? "P480" : height >= 360 ? "P360" : "P240";

      setVideoDetails((current: any) => ({
        ...current,
        durationSeconds: duration,
        resolution,
        aspectRatio: ratio || current.aspectRatio || "16:9",
        sourceFileName: file.name,
        sourceMimeType: file.type || "video/*",
        sourceSizeBytes: file.size,
      }));

      URL.revokeObjectURL(objectUrl);
    };
    probe.onerror = () => URL.revokeObjectURL(objectUrl);
    probe.src = objectUrl;
  };

  const upload = async () => {
    if (!mainVideoFile) return;
    setUploading(true); setError(""); setUploadProgress(1); setStatus("Preparing secure upload...");
    try {
      const url = await uploadFileToR2(mainVideoFile, "VIDEO", (p) => {
        setUploadProgress(p);
        setStatus(p >= 100 ? "Upload complete." : `Uploading to Tidpix storage… ${p}%`);
      });
      setUploadedVideoUrl(url);
      setVideoDetails((current: any) => ({
        ...current,
        sourceUrl: url,
        sourceType: "R2",
      }));
      setStatus("Video uploaded and metadata/source detected automatically.");
    } catch (e: any) {
      setError(e?.message || "Video upload failed.");
      setStatus("");
      setUploadProgress(0);
    } finally { setUploading(false); }
  };

  const applyManualUrl = () => {
    const url = manualVideoUrl.trim();
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") throw new Error();
    } catch {
      setError("Enter a valid HTTP or HTTPS video URL.");
      return;
    }
    setError("");
    setUploadedVideoUrl(url);
    setVideoDetails((current: any) => ({ ...current, sourceUrl: url, sourceType: "EXTERNAL_URL" }));
    setUploadProgress(100);
    setStatus("Existing video URL linked.");
  };

  const replace = () => {
    setUploadedVideoUrl(""); setMainVideoFile(null); setVideoDetails((current: any) => ({ ...current, sourceUrl: "", sourceFileName: "", sourceMimeType: "", sourceSizeBytes: 0, sourceType: "" })); setUploadProgress(0); setStatus(""); setError(""); setManualVideoUrl("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const hasVideo = Boolean(uploadedVideoUrl);

  return (
    <div className="sticky-sidebar-container">
      <div className={`panel-card-glass ${hasVideo ? "active-step" : ""}`}>
        <h2 className="upload-section-title"><span className="step-number-badge">3</span> Video Media</h2>
        <p className="section-helper">Add the full movie or episode. You can upload it to Tidpix storage or link an existing HLS/MP4 stream.</p>

        {!hasVideo && (
          <div className="interactive-dropzone-box">
            <input ref={inputRef} type="file" accept="video/*" disabled={uploading} onChange={(e) => chooseFile(e.target.files?.[0])} className="hidden-native-input" />
            <UploadCloud className="upload-drop-icon" />
            <strong>{mainVideoFile ? mainVideoFile.name : "Choose a master video"}</strong>
            <span>MP4, WebM or another browser-supported video format · up to 10 GB</span>
          </div>
        )}

        {mainVideoFile && !hasVideo && (
          <button type="button" onClick={upload} disabled={uploading} className="btn-execution-commit tidpix-primary">
            {uploading ? <><Loader2 size={16} className="spin-icon" /> Uploading…</> : <><UploadCloud size={16} /> Upload video</>}
          </button>
        )}

        {(uploadProgress > 0 || status) && (
          <div className="pipeline-status-container">
            <div className="upload-status-row"><span>{status}</span><strong>{uploadProgress}%</strong></div>
            <div className="progressbar-track"><div className="progressbar-indicator" style={{ width: `${uploadProgress}%` }} /></div>
          </div>
        )}

        {error && <div className="upload-error" role="alert">{error}</div>}

        {hasVideo && (
          <div className="upload-success">
            <CheckCircle size={20} />
            <div><strong>Video ready</strong><a href={uploadedVideoUrl} target="_blank" rel="noopener noreferrer"><ExternalLink size={11} /> Open media URL</a></div>
            <button type="button" onClick={replace} className="link-button"><RefreshCw size={13} /> Replace</button>
          </div>
        )}

        {!hasVideo && (
          <div className="manual-url-box">
            <label>Or link an existing video</label>
            <div className="manual-url-row">
              <input type="url" value={manualVideoUrl} onChange={(e) => setManualVideoUrl(e.target.value)} placeholder="https://example.com/movie.m3u8" className="input-text-field" />
              <button type="button" onClick={applyManualUrl} className="btn-secondary" disabled={!manualVideoUrl.trim()}>Link URL</button>
            </div>
          </div>
        )}

        <div className="save-title-box">
          <button type="button" onClick={commitCompleteAssetToDb} disabled={saving || !isFormValid} className="btn-execution-commit">
            {saving ? <><Loader2 size={16} className="spin-icon" /> Saving…</> : "Save to Tidpix catalog"}
          </button>
          <p><Info size={14} /> A video is optional for metadata-only catalog entries; you can attach the stream later.</p>
        </div>
      </div>
    </div>
  );
}
