"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { uploadLargeFile } from "@/utils/multipartUpload";
import { uploadManager } from "@/utils/uploadManager";
import "../upload.css";

export default function StorageUploadPage() {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    releaseYear: new Date().getFullYear(),
  });

  const generateThumbnail = async (file: File): Promise<File> => {
    const video = document.createElement("video");
    video.src = URL.createObjectURL(file);

    await new Promise((r) => (video.onloadeddata = r));

    video.currentTime = 3;

    await new Promise((r) => (video.onseeked = r));

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth * 2;
    canvas.height = video.videoHeight * 2;

    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>((res) =>
      canvas.toBlob(res, "image/jpeg", 0.95)
    );

    return new File([blob!], "thumb.jpg");
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setIsUploading(true);

    try {
      const file = e.target.video.files?.[0];
      if (!file) throw new Error("Select video");

      const videoRes = await uploadLargeFile([file], setProgress);

      const thumbFile = await generateThumbnail(file);
      const thumbRes = await uploadManager(thumbFile);

      await fetch("/api/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          videoUrl: videoRes.url,
          thumbnailUrl: thumbRes.url,
          videoKey: videoRes.key,
        }),
      });

      router.push("/dashboard");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsUploading(false);
    }
  };

return (
    <div className="upload-container">
      <div className="upload-card">
        <h1 className="upload-title">Add New Movie</h1>

        <form onSubmit={handleSubmit} className="upload-form">
          <div className="form-group">
            <label>Title</label>
            <input
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              type="text"
              required
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>

          <div className="form-group">
            <label>Release Year</label>
            <input
              type="number"
              value={formData.releaseYear}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  releaseYear: Number(e.target.value),
                })
              }
            />
          </div>

          <div className="form-group">
            <label>Video File</label>
            <input type="file" name="video" accept="video/*" required />
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
            {isUploading ? "Processing..." : "Save Movie"}
          </button>
        </form>
      </div>
    </div>
  );
}