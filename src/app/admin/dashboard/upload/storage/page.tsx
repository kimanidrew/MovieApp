"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUploadStatus } from "@/context/UploadContext";
import * as tus from "tus-js-client";

interface TVShowOption {
  id: string;
  title: string;
}

export default function UploadForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Destructured progress variable here to bind it directly to the UI elements below
  const { progress, setProgress, setIsUploading } = useUploadStatus();

  const [error, setError] = useState("");
  const [selectedFileName, setSelectedFileName] = useState("");
  const [isDragActive, setIsDragActive] = useState(false);
  const [availableShows, setAvailableShows] = useState<TVShowOption[]>([]);
  const [isLoadingShows, setIsLoadingShows] = useState(false);

  const [uploadStage, setUploadStage] = useState<
    "idle" | "uploading" | "processing" | "completed"
  >("idle");

  // Normalized form state pointing to relational database values
  const [mediaType, setMediaType] = useState<"MOVIE" | "TV_SHOW" | "EPISODE">("MOVIE");
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    releaseYear: new Date().getFullYear(),
    category: "Action",
    introStart: 0,
    introEnd: 0,
    // Episode specific fields
    tvShowId: "",
    seasonNumber: 1,
    episodeNumber: 1,
  });

  // Fetch existing series when "EPISODE" is selected to hook into relational fields
  useEffect(() => {
    if (mediaType === "EPISODE") {
      setIsLoadingShows(true);
      fetch("/api/tv-shows")
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => {
          setAvailableShows(data);
          if (data.length > 0) {
            setFormData((prev) => ({ ...prev, tvShowId: data[0].id }));
          }
        })
        .catch((err) => console.error("Failed to load series references:", err))
        .finally(() => setIsLoadingShows(false));
    }
  }, [mediaType]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    const video = document.createElement("video");
    video.preload = "metadata";

    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      const width = video.videoWidth;
      const height = video.videoHeight;
      const duration = video.duration;

      if (isNaN(width) || isNaN(height) || isNaN(duration)) {
        setError("Unable to read video metadata. Please select a different file.");
        if (fileInputRef.current) fileInputRef.current.value = "";
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
    setIsDragActive(e.type === "dragenter" || e.type === "dragover");
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
        handleFileChange({
          target: { files: dataTransfer.files },
        } as React.ChangeEvent<HTMLInputElement>);
        setError("");
      }
    } else if (file) {
      setError("Unsupported format. Please drop a valid video file.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const file = fileInputRef.current?.files?.[0];
    
    // TV_SHOW records don't contain a baseline video file container
    if (!file && mediaType !== "TV_SHOW") {
      setError("No video asset container selected for this entry.");
      return;
    }

  try {
      setError("");
      setIsUploading(true);
      setProgress(0);

      let videoKeyUid = null;

      // Skip the TUS pipeline entirely if we are simply provisioning metadata for a parent TV show structural entry
      if (mediaType !== "TV_SHOW" && file) {
        setUploadStage("uploading");
        
        const createRes = await fetch("/api/upload/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: formData.title,
            fileSize: file.size,
          }),
        });

        if (!createRes.ok) {
          const errorText = await createRes.text();
          throw new Error(`Upload Handshake Failed: ${errorText}`);
        }

        const { uploadURL, uid } = await createRes.json();
        videoKeyUid = uid;

        await new Promise<void>((resolve, reject) => {
          const upload = new tus.Upload(file, {
            uploadUrl: uploadURL,
            chunkSize: 50 * 1024 * 1024,
            retryDelays: [0, 1000, 3000, 5000],
            onError: (error) => reject(new Error(`Stream Transmission Interrupted: ${error.message}`)),
            onProgress: (bytesUploaded, bytesTotal) => {
              setProgress(Math.round((bytesUploaded / bytesTotal) * 70));
            },
            onSuccess: () => resolve(),
          });
          upload.start();
        });

        setUploadStage("processing");
        setProgress(70);

        let ready = false;
        let attempts = 0;

        while (!ready) {
          attempts++;
          const statusRes = await fetch(`/api/videos/status/${videoKeyUid}`, { cache: "no-store" });
          if (!statusRes.ok) throw new Error("Adaptive bit-stream compilation check crashed.");

          const status = await statusRes.json();
          setProgress(70 + Math.round(((status.pctComplete ?? 0) / 100) * 30));

          if (status.readyToStream) {
            ready = true;
            break;
          }
          if (attempts > 600) throw new Error("Distribution synchronization timed out.");
          await new Promise((r) => setTimeout(r, 3000));
        }
      }

      setUploadStage("completed");
      setProgress(100);

      // Save to database, appending our explicit model types and optional stream reference IDs
      const saveRes = await fetch("/api/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          type: mediaType,
          videoKey: videoKeyUid,
        }),
      });

      if (!saveRes.ok) {
        const errorText = await saveRes.text();
        throw new Error(`Prisma Record Synchronization Failed: ${errorText}`);
      }

      router.push("/");
      router.refresh();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Execution Pipeline Interrupted");
      setUploadStage("idle");
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  };

  const isFileRequired = mediaType !== "TV_SHOW";

  return (
    <div className="upload-form-wrapper">
      <form onSubmit={handleSubmit} className="premium-upload-form">
        <header className="form-header">
          <h2>Deploy Cinematic Media Architecture</h2>
          <p>
            Deploy video files directly across optimized HLS bitrate adaptive distribution networks and update relational records.
          </p>
        </header>

        {/* CLASSIFICATION SEGMENT CONTROL */}
        <div className="form-group">
          <label className="field-label">Media Distribution Strategy</label>
          <div className="segment-control-row">
            {(["MOVIE", "TV_SHOW", "EPISODE"] as const).map((type) => (
              <button
                key={type}
                type="button"
                className={`segment-btn ${mediaType === type ? "active" : ""}`}
                onClick={() => setMediaType(type)}
              >
                {type.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        {/* DRAG AND DROP TARGET ZONE — Hidden when creating structural TV Show entities */}
        {isFileRequired && (
          <div
            className={`dropzone-box ${isDragActive ? "drag-active" : ""} ${selectedFileName ? "has-file" : ""}`}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => !uploadStage.startsWith("u") && fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              name="video"
              accept="video/*"
              required={isFileRequired}
              className="hidden-file-input"
              onChange={handleFileChange}
            />

            <div className="dropzone-content">
              <svg viewBox="0 0 24 24" className="upload-icon-svg">
                <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z" />
              </svg>
              {selectedFileName ? (
                <div className="file-info-tags">
                  <span className="file-name-text">{selectedFileName}</span>
                  <span className="file-change-hint">Click or drop another file to switch asset channels</span>
                </div>
              ) : (
                <p className="dropzone-text-prompt">
                  Drag & drop asset container files here or <span className="highlight-browse">browse system files</span>
                </p>
              )}
            </div>
          </div>
        )}

        {/* DYNAMIC SUB-ROUTINE FORM FIELD: EPISODE PARENT ATTACHMENTS */}
        {mediaType === "EPISODE" && (
          <div className="relational-injection-box">
            <div className="form-group">
              <label className="field-label">Parent Television Collection</label>
              {isLoadingShows ? (
                <div className="loading-fallback-text">Querying active serial indices...</div>
              ) : (
                <select
                  className="premium-field"
                  required
                  value={formData.tvShowId}
                  onChange={(e) => setFormData({ ...formData, tvShowId: e.target.value })}
                >
                  {availableShows.length === 0 && (
                    <option value="">-- No TV Shows found. Create one first! --</option>
                  )}
                  {availableShows.map((show) => (
                    <option key={show.id} value={show.id}>
                      {show.title}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="form-row">
              <div className="form-group flex-1">
                <label className="field-label">Season Index</label>
                <input
                  type="number"
                  min={1}
                  className="premium-field"
                  value={formData.seasonNumber}
                  onChange={(e) => setFormData({ ...formData, seasonNumber: Number(e.target.value) })}
                />
              </div>
              <div className="form-group flex-1">
                <label className="field-label">Episode Index</label>
                <input
                  type="number"
                  min={1}
                  className="premium-field"
                  value={formData.episodeNumber}
                  onChange={(e) => setFormData({ ...formData, episodeNumber: Number(e.target.value) })}
                />
              </div>
            </div>
          </div>
        )}

        {/* INPUT: TITLE */}
        <div className="form-group">
          <label className="field-label">
            {mediaType === "MOVIE" && "Feature Film Title"}
            {mediaType === "TV_SHOW" && "Series Collection Title"}
            {mediaType === "EPISODE" && "Episode Segment Title"}
          </label>
          <input
            type="text"
            required
            className="premium-field"
            placeholder={mediaType === "EPISODE" ? "e.g., The Calm Before the Storm" : "e.g., Bloodline: Ground Zero"}
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
        </div>

        {/* INPUT: DESCRIPTION */}
        <div className="form-group">
          <label className="field-label">Streaming Summary / Plot Details</label>
          <textarea
            className="premium-field text-area"
            placeholder="Provide context regarding narrative synopses, and production milestones..."
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
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            />
          </div>
        </div>

        {/* INPUTS: TIMELINE ANCHORS ROW */}
        {mediaType !== "TV_SHOW" && (
          <div className="form-row">
            <div className="form-group flex-1">
              <label className="field-label">
                Intro Sequence Start <span className="sub-unit">(Seconds)</span>
              </label>
              <input
                type="number"
                min={0}
                className="premium-field"
                value={formData.introStart}
                onChange={(e) => setFormData({ ...formData, introStart: Number(e.target.value) })}
              />
            </div>

            <div className="form-group flex-1">
              <label className="field-label">
                Intro Sequence Termination <span className="sub-unit">(Seconds)</span>
              </label>
              <input
                type="number"
                min={0}
                className="premium-field"
                value={formData.introEnd}
                onChange={(e) => setFormData({ ...formData, introEnd: Number(e.target.value) })}
              />
            </div>
          </div>
        )}

        {/* REAL-TIME MONITOR PANEL WITH PROGRESS BAR TRACKING */}
        {uploadStage !== "idle" && uploadStage !== "completed" && (
          <div className="upload-progress-wrapper">
            <div className="label-heading-row">
              <span className="stage-status-text">
                {uploadStage === "uploading" && "Uploading Video to Edge CDN Layer..."}
                {uploadStage === "processing" && "Generating HLS Adaptive Stream Slices..."}
              </span>
              <span className="percentage-display">{progress}%</span>
            </div>
            {/* Added container for explicit visibility */}
            <div className="progress-bar-container">
              <div 
                className="progress-bar-fill" 
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {error && (
          <div className="upload-error-banner animate-slide-in">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" style={{ flexShrink: 0 }}>
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <button type="submit" className="btn-submit" disabled={uploadStage === "uploading" || uploadStage === "processing"}>
          {uploadStage === "uploading" || uploadStage === "processing" ? "Processing..." : "Deploy Metadata & Streams"}
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
          font-family: system-ui, sans-serif;
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
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .form-header h2 {
          color: #ffffff;
          font-size: 1.85rem;
          margin: 0 0 6px 0;
        }
        .form-header p {
          color: #8c8c8c;
          font-size: 0.95rem;
          line-height: 1.5;
          margin: 0;
        }
        .segment-control-row {
          display: flex;
          background: #141414;
          padding: 4px;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
        .segment-btn {
          flex: 1;
          background: transparent;
          border: none;
          color: #8c8c8c;
          padding: 10px;
          font-weight: 600;
          cursor: pointer;
          border-radius: 6px;
          transition: all 0.2s;
          text-transform: uppercase;
          font-size: 0.8rem;
        }
        .segment-btn.active {
          background: rgba(255, 255, 255, 0.08);
          color: #ffffff;
        }
        .relational-injection-box {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          padding: 20px;
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .dropzone-box {
          width: 100%;
          border: 2px dashed rgba(255, 255, 255, 0.15);
          background: rgba(255, 255, 255, 0.02);
          border-radius: 8px;
          padding: 32px 20px;
          text-align: center;
          cursor: pointer;
        }
        .dropzone-box.drag-active {
          border-color: #ec4899;
          background: rgba(236, 72, 153, 0.06);
        }
        .dropzone-box.has-file {
          border-color: rgba(70, 211, 105, 0.4);
          background: rgba(70, 211, 105, 0.02);
        }
        .hidden-file-input {
          display: none;
        }
        .upload-icon-svg {
          width: 44px;
          height: 44px;
          fill: #404040;
          margin-bottom: 12px;
        }
        .dropzone-text-prompt {
          color: #a0a0a0;
          margin: 0;
        }
        .highlight-browse {
          color: #ec4899;
          text-decoration: underline;
        }
        .file-name-text {
          color: #ffffff;
          font-weight: 600;
        }
        .file-change-hint {
          color: #707070;
          font-size: 0.8rem;
          display: block;
          margin-top: 4px;
        }
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
        }
        .premium-field {
          width: 100%;
          background: #141414;
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: #ffffff;
          padding: 14px 18px;
          font-size: 1rem;
          border-radius: 6px;
          outline: none;
        }
        .premium-field:focus {
          border-color: #ec4899;
        }
        select.premium-field {
          appearance: none;
          background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3e%3cpath d='M7 10l5 5 5-5z'/%3e%3c/svg%3e");
          background-repeat: no-repeat;
          background-position: right 16px center;
          background-size: 20px;
        }
        .text-area {
          resize: none;
        }
        .loading-fallback-text {
          color: #8c8c8c;
          font-size: 0.9rem;
          font-style: italic;
        }
        .upload-progress-wrapper {
          background: rgba(0, 0, 0, 0.3);
          padding: 20px;
          border-radius: 6px;
          border: 1px solid rgba(255, 255, 255, 0.04);
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .label-heading-row {
          display: flex;
          justify-content: space-between;
          color: #b0b0b0;
          font-size: 0.9rem;
        }
        .percentage-display {
          color: #ec4899;
          font-weight: 600;
        }
        .progress-bar-container {
          width: 100%;
          height: 6px;
          background: #141414;
          border-radius: 3px;
          overflow: hidden;
        }
        .progress-bar-fill {
          height: 100%;
          background: linear-gradient(to right, #3b82f6, #ec4899);
          border-radius: 3px;
          transition: width 0.3s ease;
        }
        .upload-error-banner {
          background: rgba(236, 72, 153, 0.12);
          border: 1px solid rgba(236, 72, 153, 0.3);
          color: #ff4d56;
          padding: 14px 18px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .btn-submit {
          background: linear-gradient(to right, #3b82f6, #ec4899);
          color: #ffffff;
          border: none;
          padding: 16px;
          font-size: 1.05rem;
          font-weight: 700;
          border-radius: 6px;
          cursor: pointer;
          margin-top: 8px;
          transition: transform 0.1s, opacity 0.2s;
        }
        .btn-submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .btn-submit:not(:disabled):active {
          transform: scale(0.99);
        }
        @media (max-width: 560px) {
          .form-row {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}