"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  createBunnyVideoPlaceholder,
  getBunnyVideoStatus,
} from "@/app/actions/stream";
import { useUploadStatus } from "@/context/UploadContext";

export default function UploadForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    progress,
    setProgress,
    isUploading,
    setIsUploading,
  } = useUploadStatus();

  const [error, setError] = useState("");
  const [selectedFileName, setSelectedFileName] = useState("");
  const [isDragActive, setIsDragActive] = useState(false);

  const [uploadStage, setUploadStage] = useState<
    "idle" | "uploading" | "processing" | "completed"
  >("idle");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    releaseYear: new Date().getFullYear(),
    category: "Action",
    introStart: 0,
    introEnd: 0,
    isMovie: true,
  });

const handleFileChange = async (
  e: React.ChangeEvent<HTMLInputElement>
) => {
  const file = e.target.files?.[0];

  if (!file) return;

  setError("");

  // Validate video metadata
  const video = document.createElement("video");

  video.preload = "metadata";

  video.onloadedmetadata = () => {
    URL.revokeObjectURL(video.src);

    const width = video.videoWidth;
    const height = video.videoHeight;

    // Require minimum HD
    if (width < 1920 || height < 1080) {
      setError(
        "Only Full HD (1080p) or higher videos are allowed."
      );

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      setSelectedFileName("");
      return;
    }

    setSelectedFileName(file.name);
  };

  video.onerror = () => {
    setError("Invalid video file.");
  };

  video.src = URL.createObjectURL(file);
};


  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsDragActive(false);

    const file = e.dataTransfer.files?.[0];

    if (file && file.type.startsWith("video/")) {
      if (fileInputRef.current) {
        const dataTransfer = new DataTransfer();

        dataTransfer.items.add(file);

        fileInputRef.current.files = dataTransfer.files;

        setSelectedFileName(file.name);
        setError("");
      }
    } else if (file) {
      setError("Unsupported format. Please drop a valid video file.");
    }
  };

  const pollProcessingProgress = async (bunnyVideoId: string) => {
    let finished = false;

    while (!finished) {
      const result = await getBunnyVideoStatus(bunnyVideoId);

      const encodeProgress = result.encodeProgress || 0;

      const combinedProgress =
        70 + Math.round((encodeProgress / 100) * 30);

      setProgress(combinedProgress);

      if (result.isFinished) {
        setProgress(100);
        setUploadStage("completed");
        finished = true;
        break;
      }

      if (result.status === 5) {
        throw new Error(
          "Bunny.net cloud transcoding clusters reported an encoder error."
        );
      }

      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const file = fileInputRef.current?.files?.[0];
    if (!file) return setError("No video selected");

    try {
      setIsUploading(true);
      setProgress(0);
      setUploadStage("uploading");

      // 1. Create video on backend (SAFE)
      const createRes = await fetch("/api/upload/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: formData.title }),
      });

      const { videoId, libraryId } = await createRes.json();

      // 2. Upload directly to Bunny (NO API KEY IN CLIENT)
      const uploadUrl = `https://video.bunnycdn.com/library/${libraryId}/videos/${videoId}`;

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", uploadUrl, true);

        // IMPORTANT: Bunny requires ONLY AccessKey OR empty depending on config
        xhr.setRequestHeader(
          "AccessKey",
          process.env.NEXT_PUBLIC_BUNNY_API_KEY!
        );

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setProgress(Math.round((e.loaded / e.total) * 70));
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error("Upload failed"));
        };

        xhr.onerror = () =>
          reject(new Error("Network upload failed (check endpoint)"));

        xhr.send(file);
      });

      // 3. Processing stage
      setUploadStage("processing");
      setProgress(70);

      let done = false;
      while (!done) {
        const status = await getBunnyVideoStatus(videoId);

        setProgress(70 + Math.round((status.encodeProgress / 100) * 30));

        if (status.isFinished) {
          setProgress(100);
          done = true;
        }

        await new Promise((r) => setTimeout(r, 3000));
      }

      // 4. Save DB
      await fetch("/api/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          videoKey: videoId,
        }),
      });

      setUploadStage("completed");

      router.push("/");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setUploadStage("idle");
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  };


  return (
    <div className="upload-form-wrapper">
      <form onSubmit={handleSubmit} className="premium-upload-form">
        <header className="form-header">
          <h2>Upload Cinematic Media</h2>
          <p>Deploy video files directly across optimized HLS bitrate adaptive distribution networks.</p>
        </header>

        {/* DRAG AND DROP APERTURE TARGET ZONE */}
        <div 
          className={`dropzone-box ${isDragActive ? "drag-active" : ""} ${selectedFileName ? "has-file" : ""} ${isUploading ? "disabled" : ""}`}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => !isUploading && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            name="video"
            accept="video/*"
            required
            className="hidden-file-input"
            onChange={handleFileChange}
            disabled={isUploading}
          />
          
          <div className="dropzone-content">
            <svg viewBox="0 0 24 24" className="upload-icon-svg">
              <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"/>
            </svg>
            {selectedFileName ? (
              <div className="file-info-tags">
                <span className="file-name-text">{selectedFileName}</span>
                <span className="file-change-hint">Click or drop another file to exchange</span>
              </div>
            ) : (
              <p className="dropzone-text-prompt">Drag & drop asset container files here or <span className="highlight-browse">browse system files</span></p>
            )}
          </div>
        </div>

        {/* INPUT: TITLE */}
        <div className="form-group">
          <label className="field-label">Media Asset Title</label>
          <input
            type="text"
            required
            className="premium-field"
            placeholder="e.g., Bloodline: Ground Zero (2026)"
            disabled={isUploading}
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
        </div>

        {/* INPUT: DESCRIPTION */}
        <div className="form-group">
          <label className="field-label">Streaming Summary / Plot Details</label>
          <textarea
            className="premium-field text-area"
            placeholder="Provide context regarding casting indices, narrative synopses, and production milestones..."
            disabled={isUploading}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
          />
        </div>

        {/* INPUTS: METADATA ROW */}
        <div className="form-row">
          <div className="form-group flex-1">
            <label className="field-label">Release Year</label>
            <input
              type="number"
              className="premium-field"
              disabled={isUploading}
              value={formData.releaseYear}
              onChange={(e) => setFormData({ ...formData, releaseYear: Number(e.target.value) })}
            />
          </div>

          <div className="form-group flex-1">
            <label className="field-label">Primary Category</label>
            <input
              type="text"
              className="premium-field"
              placeholder="Action, Sci-Fi, Drama"
              disabled={isUploading}
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            />
          </div>
        </div>

        {/* INPUTS: TIMELINE ANCHORS ROW */}
        <div className="form-row">
          <div className="form-group flex-1">
            <label className="field-label">Intro Sequence Start <span className="sub-unit">(Seconds)</span></label>
            <input
              type="number"
              min={0}
              className="premium-field"
              disabled={isUploading}
              value={formData.introStart}
              onChange={(e) => setFormData({ ...formData, introStart: Number(e.target.value) })}
            />
          </div>

          <div className="form-group flex-1">
            <label className="field-label">Intro Sequence Termination <span className="sub-unit">(Seconds)</span></label>
            <input
              type="number"
              min={0}
              className="premium-field"
              disabled={isUploading}
              value={formData.introEnd}
              onChange={(e) => setFormData({ ...formData, introEnd: Number(e.target.value) })}
            />
          </div>
        </div>

        {/* INPUT: SWITCH BOX TOGGLE LAYER */}
        <div className="form-group toggle-box-container">
          <label className="checkbox-label-card">
            <div className="checkbox-switch-wrapper">
              <input
                type="checkbox"
                className="hidden-checkbox-core"
                checked={formData.isMovie}
                disabled={isUploading}
                onChange={(e) => setFormData({ ...formData, isMovie: e.target.checked })}
              />
              <div className="custom-switch-slider" />
            </div>
            <div className="checkbox-meta-text">
              <span className="card-primary-title">Standalone Feature Film</span>
              <span className="card-sub-description">Uncheck this if you are deploying a serialized episodic TV show component template.</span>
            </div>
          </label>
        </div>

        {/* REAL-TIME GLOWING MONITOR PANEL */}
        {isUploading && (
          <div className="upload-progress-wrapper">
            <div className="label-heading-row">
              <span className="stage-status-text">
                {uploadStage === "uploading" && "Uploading Video to CDN..."}
                {uploadStage === "processing" && "Generating HLS Adaptive Stream Slices..."}
                {uploadStage === "completed" && "Video Storage Synthesized Successfully"}
              </span>
              <span className="percentage-counter-bold">{progress}%</span>
            </div>
            <div className="upload-progress-bar">
              <div className="upload-progress-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {/* SYSTEM PACKET RUNTIME EXCEPTION MESSAGE WINDOW */}
        {error && (
          <div className="upload-error-banner animate-slide-in">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" style={{ flexShrink: 0 }}>
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* PIPELINE DISPATCH TRIGER CONTROLLER ACTION */}
        <button type="submit" className="btn-submit" disabled={isUploading}>
          {isUploading ? (
            <div className="spinner-loader-row">
              <div className="button-inline-spinner" />
              <span>Transmitting Packets...</span>
            </div>
          ) : (
            "Deploy Streaming Asset"
          )}
        </button>
      </form>

      <style jsx>{`
        .upload-form-wrapper {
          width: 100%;
          min-height: 100vh;
          background: #090909;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
        }

        .premium-upload-form {
          width: 100%;
          max-width: 680px;
          background: rgba(18, 18, 18, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 48px;
          box-shadow: 0 30px 60px rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(30px);
          -webkit-backdrop-filter: blur(30px);
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .form-header h2 {
          color: #ffffff;
          font-size: 1.85rem;
          font-weight: 700;
          margin: 0 0 6px 0;
          letter-spacing: -0.3px;
        }

        .form-header p {
          color: #8c8c8c;
          font-size: 0.95rem;
          line-height: 1.5;
          margin: 0;
        }

        /* DRAG AND DROP REGION */
        .dropzone-box {
          width: 100%;
          border: 2px dashed rgba(255, 255, 255, 0.15);
          background: rgba(255, 255, 255, 0.02);
          border-radius: 8px;
          padding: 32px 20px;
          text-align: center;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.25, 1, 0.5, 1);
        }

        .dropzone-box:hover:not(.disabled) {
          border-color: #e50914;
          background: rgba(229, 9, 20, 0.02);
        }

        .dropzone-box.drag-active {
          border-color: #e50914;
          background: rgba(229, 9, 20, 0.06);
          transform: scale(1.01);
        }

        .dropzone-box.has-file {
          border-style: solid;
          border-color: rgba(70, 211, 105, 0.4);
          background: rgba(70, 211, 105, 0.02);
        }

        .dropzone-box.disabled {
          opacity: 0.4;
          cursor: not-allowed;
          border-color: rgba(255, 255, 255, 0.05);
        }

        .hidden-file-input {
          display: none;
        }

        .upload-icon-svg {
          width: 44px;
          height: 44px;
          fill: #404040;
          margin-bottom: 12px;
          transition: fill 0.2s ease;
        }

        .dropzone-box:hover .upload-icon-svg {
          fill: #e50914;
        }

        .dropzone-box.has-file .upload-icon-svg {
          fill: #46d369;
        }

        .dropzone-text-prompt {
          color: #a0a0a0;
          font-size: 0.95rem;
          margin: 0;
        }

        .highlight-browse {
          color: #e50914;
          font-weight: 600;
          text-decoration: underline;
        }

        .file-info-tags {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .file-name-text {
          color: #ffffff;
          font-size: 1rem;
          font-weight: 600;
          word-break: break-all;
        }

        .file-change-hint {
          color: #707070;
          font-size: 0.8rem;
        }

        /* FORMS LAYOUT SCHEME */
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-row {
          display: flex;
          gap: 20px;
        }

        .flex-1 {
          flex: 1;
        }

        .field-label {
          color: #cccccc;
          font-size: 0.82rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.8px;
        }

        .sub-unit {
          color: #666666;
          text-transform: lowercase;
          font-weight: 400;
        }

        .premium-field {
          width: 100%;
          background: #161616;
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: #ffffff;
          padding: 14px 18px;
          font-size: 1rem;
          border-radius: 6px;
          outline: none;
          font-family: inherit;
          transition: border-color 0.2s cubic-bezier(0.25, 1, 0.5, 1), background 0.2s ease;
        }

        .premium-field:focus {
          border-color: #e50914;
          background: #1c1c1c;
        }

        .premium-field:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .text-area {
          resize: none;
          line-height: 1.5;
        }

        /* TOGGLE BOX SWITCH HARDWARE */
        .toggle-box-container {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          padding: 18px 24px;
          border-radius: 8px;
          margin-top: 4px;
        }

        .checkbox-label-card {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          cursor: pointer;
        }

        .checkbox-switch-wrapper {
          position: relative;
          width: 44px;
          height: 24px;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .hidden-checkbox-core {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .custom-switch-slider {
          position: absolute;
          inset: 0;
          background: #333333;
          border-radius: 20px;
          transition: background 0.2s ease;
        }

        .custom-switch-slider::before {
          position: absolute;
          content: "";
          height: 18px;
          width: 18px;
          left: 3px;
          bottom: 3px;
          background: #ffffff;
          border-radius: 50%;
          transition: transform 0.2s cubic-bezier(0.25, 1, 0.5, 1);
        }

        .hidden-checkbox-core:checked + .custom-switch-slider {
          background: #e50914;
        }

        .hidden-checkbox-core:checked + .custom-switch-slider::before {
          transform: translateX(20px);
        }

        .hidden-checkbox-core:disabled + .custom-switch-slider {
          opacity: 0.4;
        }

        .checkbox-meta-text {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .card-primary-title {
          color: #ffffff;
          font-size: 1rem;
          font-weight: 600;
        }

        .card-sub-description {
          color: #707070;
          font-size: 0.85rem;
          line-height: 1.4;
        }

        /* PROGRESS MONITOR INDICATOR SYSTEM */
        .upload-progress-wrapper {
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.04);
          padding: 20px;
          border-radius: 6px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .label-heading-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.9rem;
          color: #b0b0b0;
          font-weight: 500;
        }

        .percentage-counter-bold {
          color: #e50914;
          font-weight: 700;
          text-shadow: 0 0 10px rgba(229, 9, 20, 0.2);
        }

        .upload-progress-bar {
          width: 100%;
          height: 6px;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 4px;
          overflow: hidden;
        }

        .upload-progress-fill {
          height: 100%;
          background: #e50914;
          border-radius: 4px;
          box-shadow: 0 0 12px #e50914;
          transition: width 0.3s cubic-bezier(0.25, 1, 0.5, 1);
        }

        /* RUNTIME EXCEPTION WARNING LAYER */
        .upload-error-banner {
          background: rgba(229, 9, 20, 0.12);
          border: 1px solid rgba(229, 9, 20, 0.3);
          color: #ff4d56;
          padding: 14px 18px;
          border-radius: 6px;
          font-size: 0.95rem;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 12px;
          line-height: 1.4;
        }

        .animate-slide-in {
          animation: slideIn 0.25s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        }

        @keyframes slideIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* SUBMIT BLOCK ACTION BUTTON */
        .btn-submit {
          background: #e50914;
          color: #ffffff;
          border: none;
          padding: 16px;
          font-size: 1.05rem;
          font-weight: 700;
          letter-spacing: 0.3px;
          border-radius: 6px;
          cursor: pointer;
          margin-top: 8px;
          box-shadow: 0 6px 20px rgba(229, 9, 20, 0.25);
          transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
        }

        .btn-submit:hover:not(:disabled) {
          background: #ff1a25;
          box-shadow: 0 8px 24px rgba(229, 9, 20, 0.4);
        }

        .btn-submit:active:not(:disabled) {
          transform: scale(0.99);
        }

        .btn-submit:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          box-shadow: none;
        }

        .spinner-loader-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
        }

        .button-inline-spinner {
          width: 18px;
          height: 18px;
          border: 2.5px solid rgba(255, 255, 255, 0.25);
          border-top-color: #ffffff;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 560px) {
          .form-row {
            flex-direction: column;
            gap: 24px;
          }
          .premium-upload-form {
            padding: 32px 24px;
          }
        }
      `}</style>
    </div>
  );
}
