"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import "../upload.css";

export default function YoutubeUploadPage() {
  const router = useRouter();

  const [url, setUrl] = useState("");
  const [jobId, setJobId] = useState<string | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  const [progress, setProgress] = useState(0);

  const [preview, setPreview] = useState<any>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    releaseYear: new Date().getFullYear(),
  });

  /**
   * PREVIEW INFO
   */
  const handlePreview = async () => {
    setIsLoadingPreview(true);

    const res = await fetch("/api/upload/youtube/info", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error);
      setIsLoadingPreview(false);
      return;
    }

    setPreview(data);

    setFormData((p) => ({
      ...p,
      title: data.title ?? "",
      description: data.description ?? "",
    }));

    setIsLoadingPreview(false);
  };

  /**
   * QUEUE JOB
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);

    const res = await fetch("/api/upload/youtube/queue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url,
        title: formData.title,
        description: formData.description,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error);
      setIsUploading(false);
      return;
    }

    setJobId(data.jobId);

    // start polling
    pollJob(data.jobId);
  };

  /**
   * POLL JOB STATUS
   */
const pollJob = async (id: string) => {
  console.log("🔄 Start polling:", id);

  const interval = setInterval(async () => {
    const res = await fetch(`/api/upload/youtube/status?id=${id}`);
    const data = await res.json();

    console.log("📡 Poll response:", data);

    if (data.progress !== undefined) {
      setProgress(data.progress);
    }

    if (data.status === "done") {
      console.log("✅ Job completed");
      clearInterval(interval);
      setIsUploading(false);
      router.push("/dashboard");
    }

    if (data.status === "failed") {
      console.error("❌ Job failed");
      clearInterval(interval);
      setIsUploading(false);
      alert("Upload failed");
    }
  }, 2000);
};

  return (
    <div className="upload-container">
      <div className="upload-card">
        <h1 className="upload-title">YouTube Import</h1>

        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste YouTube URL"
        />

        <button type="button" onClick={handlePreview}>
          {isLoadingPreview ? "Loading..." : "Load Preview"}
        </button>

        {preview && (
          <div className="yt-preview">
            <img src={preview.thumbnail} />
          </div>
        )}

        <form onSubmit={handleSubmit} className="upload-form">
          <input
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            placeholder="Title"
          />

          <textarea
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
          />

          <button disabled={isUploading}>
            {isUploading ? "Processing..." : "Import"}
          </button>

          <div>{progress}%</div>
        </form>
      </div>
    </div>
  );
}