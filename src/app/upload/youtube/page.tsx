"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function YoutubeUploadPage() {
  const router = useRouter();

  const [url, setUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [preview, setPreview] = useState<any>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    releaseYear: new Date().getFullYear(),
  });

  const handlePreview = async () => {
    if (!url) return alert("Please fill in a valid link first.");
    setIsLoadingPreview(true);
    setPreview(null);

    try {
      const res = await fetch("/api/upload/youtube/info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed loading data.");

      setPreview(data);
      setFormData((p) => ({
        ...p,
        title: data.title ?? "",
        description: data.description ?? "",
      }));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    setIsUploading(true);
    setProgress(0);
    setStatusMessage("Initializing safe worker connections...");

    try {
      const res = await fetch("/api/upload/youtube/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          title: formData.title,
          description: formData.description,
          releaseYear: formData.releaseYear
        }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Queue insertion blocked.");
      pollJob(data.jobId);
    } catch (err: any) {
      alert(err.message);
      setIsUploading(false);
    }
  };

  const pollJob = (id: string) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/upload/youtube/status?id=${id}`);
        const data = await res.json();

        if (!res.ok) throw new Error(data.error);

        if (data.progress !== undefined) setProgress(data.progress);

        if (data.status === "queued") setStatusMessage("In processing queue...");
        if (data.status === "downloading") setStatusMessage("Extracting YouTube media blocks...");
        if (data.status === "uploading") setStatusMessage("Streaming files binary data directly to CDN... (Do not close)");
        if (data.status === "encoding") setStatusMessage("Bunny.net slicing HLS adaptive segments bitrate resolution profiles...");

        if (data.status === "done") {
          clearInterval(interval);
          setIsUploading(false);
          setStatusMessage("Import complete!");
          router.push("/");
          router.refresh();
        }

        if (data.status === "failed") {
          clearInterval(interval);
          setIsUploading(false);
          setStatusMessage("");
          alert(data.error || "Upload pipeline encountered background worker failure.");
        }
      } catch (err) {
        clearInterval(interval);
        setIsUploading(false);
      }
    }, 2500);
  };

  return (
    <div className="upload-view-viewport">
      <div className="glass-upload-card">
        <h1 className="form-heading">Import via YouTube URL</h1>
        <p className="form-sub">Stream raw audio/video blocks directly over our network parameters straight into high-performance HLS channels.</p>

        <div className="input-group">
          <input
            type="url"
            className="premium-field text-input"
            value={url}
            disabled={isUploading}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://youtube.com..."
          />
          <button 
            type="button" 
            className="action-pill-btn secondary-style"
            onClick={handlePreview}
            disabled={isLoadingPreview || isUploading}
          >
            {isLoadingPreview ? "Resolving..." : "Load Preview"}
          </button>
        </div>

        {preview && (
          <div className="media-preview-container">
            <img src={preview.thumbnail} alt="Stream Thumbnail" className="preview-image-asset" />
          </div>
        )}

        <form onSubmit={handleSubmit} className="metadata-form-flow">
          <label className="field-label">Custom Asset Title</label>
          <input
            type="text"
            className="premium-field"
            value={formData.title}
            disabled={isUploading}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Cinematic Asset Title Name"
            required
          />

          <label className="field-label">Streaming Description</label>
          <textarea
            className="premium-field text-area"
            value={formData.description}
            disabled={isUploading}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Provide context for metadata exploration records..."
            rows={4}
          />

          <label className="field-label">Release Year</label>
          <input
            type="number"
            className="premium-field"
            value={formData.releaseYear}
            disabled={isUploading}
            onChange={(e) => setFormData({ ...formData, releaseYear: Number(e.target.value) })}
          />

          <button type="submit" className="action-pill-btn submit-trigger-style" disabled={isUploading || !preview}>
            {isUploading ? "Pipeline Active..." : "Start Transmission"}
          </button>

          {isUploading && (
            <div className="progress-reporting-layer">
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${progress}%` }} />
              </div>
              <div className="label-row">
                <span>{statusMessage}</span>
                <span className="bold-pct">{progress}%</span>
              </div>
            </div>
          )}
        </form>
      </div>

      <style jsx>{`
        .upload-view-viewport {
          min-height: 100vh;
          background: #090909;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
        }
        .glass-upload-card {
          width: 100%;
          max-width: 640px;
          background: rgba(20, 20, 20, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 40px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.5);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }
        .form-heading {
          color: #ffffff;
          font-size: 1.8rem;
          font-weight: 700;
          margin: 0 0 8px 0;
        }
        .form-sub {
          color: #8c8c8c;
          font-size: 0.95rem;
          line-height: 1.4;
          margin: 0 0 24px 0;
        }
        .input-group {
          display: flex;
          gap: 12px;
          margin-bottom: 24px;
        }
        .text-input {
          flex: 1;
        }
        .premium-field {
          width: 100%;
          background: #1f1f1f;
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #ffffff;
          padding: 14px 16px;
          font-size: 1rem;
          border-radius: 6px;
          transition: border-color 0.2s, background 0.2s;
        }
        .premium-field:focus {
          outline: none;
          border-color: #e50914;
          background: #262626;
        }
        .premium-field:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .text-area {
          resize: none;
        }
        .field-label {
          display: block;
          color: #cccccc;
          font-size: 0.85rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin: 18px 0 6px 0;
        }
        .action-pill-btn {
          padding: 0 24px;
          font-size: 0.95rem;
          font-weight: 600;
          border-radius: 6px;
          cursor: pointer;
          border: none;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .secondary-style {
          background: rgba(255, 255, 255, 0.1);
          color: #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .secondary-style:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.2);
          border-color: #ffffff;
        }
        .submit-trigger-style {
          width: 100%;
          background: #e50914;
          color: #ffffff;
          padding: 16px;
          font-size: 1.1rem;
          font-weight: 700;
          margin-top: 24px;
          box-shadow: 0 4px 12px rgba(229, 9, 20, 0.3);
        }
        .submit-trigger-style:hover:not(:disabled) {
          background: #ff1a25;
          transform: translateY(-1px);
        }
        .action-pill-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
          transform: none !important;
          box-shadow: none !important;
        }
        .media-preview-container {
          width: 100%;
          border-radius: 6px;
          overflow: hidden;
          background: #000;
          border: 1px solid rgba(255,255,255,0.08);
          line-height: 0;
        }
        .preview-image-asset {
          width: 100%;
          height: auto;
          object-fit: cover;
          aspect-ratio: 16 / 9;
        }
        .progress-reporting-layer {
          margin-top: 24px;
          background: rgba(0, 0, 0, 0.4);
          padding: 20px;
          border-radius: 6px;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .bar-track {
          width: 100%;
          height: 6px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
          overflow: hidden;
          margin-bottom: 12px;
        }
        .bar-fill {
          height: 100%;
          background: #46d369;
          border-radius: 3px;
          transition: width 0.4s cubic-bezier(0.25, 1, 0.5, 1);
        }
        .label-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.9rem;
          color: #a0a0a0;
          line-height: 1.2;
        }
        .bold-pct {
          color: #46d369;
          font-weight: 700;
        }
      `}</style>
    </div>
  );
}
