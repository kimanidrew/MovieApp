"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { uploadLargeFile } from "@/utils/multipartUpload"; // Assuming this is the correct helper for video upload
import { uploadManager } from "@/utils/uploadManager"; // Assuming this handles thumbnail upload
import "./upload.css"; // Assuming your custom styles are imported here

export default function UploadPage() {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    releaseYear: new Date().getFullYear(),
  });

  // Handle form submission
  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsUploading(true);
    setProgress(0);

    try {
      const form = e.currentTarget;

      // Fetch files for video and thumbnail
      const videoFiles = (form.elements.namedItem("video") as HTMLInputElement).files;
      const thumbFile = (form.elements.namedItem("thumbnail") as HTMLInputElement).files?.[0];

      // Check if files are provided
      if (!videoFiles || videoFiles.length === 0 || !thumbFile) {
        throw new Error("Please select both video and thumbnail files");
      }

      console.log("📤 Uploading thumbnail...");
      // Upload the thumbnail image
      const thumbRes = await uploadManager(thumbFile);

      console.log("🎬 Uploading video (multipart)...");
      // Upload the video file (only the first file in case of multiple)
      const videoRes = await uploadLargeFile([videoFiles[0]], setProgress); // Pass in the progress setter

      console.log("💾 Saving to DB...");
      // Send movie data to your backend API (adjust to match your DB API)
      const dbRes = await fetch("/api/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          videoUrl: videoRes.url, // URL for the uploaded video
          thumbnailUrl: thumbRes.url, // URL for the uploaded thumbnail
          videoKey: videoRes.key, // If your backend expects a key, include it here
        }),
      });

      if (!dbRes.ok) throw new Error("Database save failed");

      router.push("/dashboard"); // Redirect to dashboard after saving
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
          {/* Title Input */}
          <div className="form-group">
            <label>Title</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
            />
          </div>

          {/* Description Input */}
          <div className="form-group">
            <label>Description</label>
            <textarea
              rows={3}
              required
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>

          {/* Release Year Input */}
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

          {/* Thumbnail Image Input */}
          <div className="form-group">
            <label>Thumbnail Image</label>
            <input
              type="file"
              name="thumbnail"
              accept="image/*"
              required
            />
          </div>

          {/* Video File Input */}
          <div className="form-group">
            <label>Video File</label>
            <input
              type="file"
              name="video"
              accept="video/*"
              required
            />
          </div>

          {/* Upload Progress */}
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

          {/* Submit Button */}
          <button type="submit" disabled={isUploading} className="btn-submit">
            {isUploading ? "Uploading & Processing..." : "Save Movie"}
          </button>
        </form>
      </div>
    </div>
  );
}