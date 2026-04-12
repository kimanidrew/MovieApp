"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { uploadLargeFile } from "@/utils/multipartUpload";
import { uploadManager } from "@/utils/uploadManager";
import "./upload.css";

export default function UploadPage() {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    releaseYear: new Date().getFullYear(),
  });

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsUploading(true);
    setProgress(0);

    try {
      const form = e.currentTarget;

      const videoFiles = (form.elements.namedItem("video") as HTMLInputElement).files;
      const thumbFile = (form.elements.namedItem("thumbnail") as HTMLInputElement).files?.[0];

      if (!videoFiles || videoFiles.length === 0 || !thumbFile) {
        throw new Error("Please select both video and thumbnail");
      }

      console.log("📤 Uploading thumbnail...");
      const thumbRes = await uploadManager(thumbFile);

      console.log("🎬 Uploading video (multipart)...");
      const videoRes = await uploadLargeFile(Array.from(videoFiles), setProgress);

      console.log("💾 Saving to DB...");
      const dbRes = await fetch("/api/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          videoUrl: videoRes.url,
          thumbnailUrl: thumbRes.url,
          videoKey: videoRes.key,
        }),
      });

      if (!dbRes.ok) throw new Error("Database save failed");

      router.push("/dashboard");
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="upload-container">
      <div className="upload-card">
        <h1 className="upload-title">Add New Movie</h1>

        <form onSubmit={handleFormSubmit} className="upload-form">
          <div className="form-group">
            <label>Title</label>
            <input
              type="text"
              required
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              rows={3}
              required
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>

          <div className="form-group">
            <label>Release Year</label>
            <input
              type="number"
              defaultValue={new Date().getFullYear()}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  releaseYear: Number(e.target.value),
                })
              }
            />
          </div>

          <div className="form-group">
            <label>Thumbnail Image</label>
            <input type="file" name="thumbnail" accept="image/*" required />
          </div>

          <div className="form-group">
            <label>Video File</label>
            <input type="file" name="video" accept="video/*" multiple required />
          </div>

          {isUploading && (
            <div className="progress-section">
              <div className="progress-bar-container">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="progress-text">{progress}% Uploaded</p>
            </div>
          )}

          <button type="submit" disabled={isUploading} className="btn-submit">
            {isUploading ? "Uploading & Processing..." : "Save Movie"}
          </button>
        </form>
      </div>
    </div>
  );
}