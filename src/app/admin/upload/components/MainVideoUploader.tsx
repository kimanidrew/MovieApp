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
}

export default function MainVideoUploader({ mainVideoFile, setMainVideoFile, uploadedVideoUrl, setUploadedVideoUrl, commitCompleteAssetToDb, saving, isFormValid }: Props) {
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
      setStatus("Video uploaded and ready to attach.");
    } catch (e: any) {
      setError(e?.message || "Video upload failed.");
      setStatus("");
      setUploadProgress(0);
    } finally { setUploading(false); }
  };

  const applyManualUrl = () => {
    const url = manualVideoUrl.trim();
    if (!/^https?:\\/\\//i.test(url)) {
      setError("Enter a valid HTTP or HTTPS video URL.");
      return;
    }
    setError(""); setUploadedVideoUrl(url); setUploadProgress(100); setStatus("Existing video URL linked.");
  };

  const replace = () => {
    setUploadedVideoUrl(""); setMainVideoFile(null); setUploadProgress(0); setStatus(""); setError(""); setManualVideoUrl("");
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
