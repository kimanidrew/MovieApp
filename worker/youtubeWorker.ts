// 1. MUST BE FIRST: Load environment variables
import "dotenv/config"; 

import { Worker } from "bullmq";
import { spawn } from "child_process";
import fs from "fs";
import { redis } from "../src/lib/redis";
import { S3Client } from "@aws-sdk/client-s3";
import { Upload, Progress } from "@aws-sdk/lib-storage";

console.log("🚀 GCP YouTube Worker (Single-File Mode) starting...");

// 2. Initialize S3 Client with timeouts to prevent hanging
const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY || "",
    secretAccessKey: process.env.R2_SECRET_KEY || "",
  },
});

new Worker(
  "youtube-download",
  async (job) => {
    const { url, title, description } = job.data;
    const filePath = `/tmp/${job.id}.mp4`;

    const updateProgress = async (progress: number, status: string) => {
      const payload = { jobId: job.id, progress, status, updatedAt: Date.now() };
      console.log(`📊 [${job.id}] → ${progress}% (${status})`);
      await redis.set(`yt-job:${job.id}`, JSON.stringify(payload), "EX", 3600);
    };

    try {
      await updateProgress(5, "starting");

      // --- DOWNLOAD ---
      console.log("⬇️ yt-dlp downloading...");
      await new Promise((resolve, reject) => {
        const yt = spawn("yt-dlp", [
          "--js-runtimes", "node",
          "-f", "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best",
          "-o", filePath,
          url,
        ]);
        yt.on("close", (code) => code === 0 ? resolve(true) : reject(new Error(`yt-dlp failed: ${code}`)));
      });

      if (!fs.existsSync(filePath)) throw new Error("File missing after download");
      console.log("✅ Download complete. Size:", (fs.statSync(filePath).size / 1024 / 1024).toFixed(2), "MB");

      // --- UPLOAD ---
      await updateProgress(60, "uploading");
      console.log("☁️ Starting R2 Upload...");

      const parallelUpload = new Upload({
        client: s3,
        params: {
          Bucket: process.env.R2_BUCKET!,
          Key: `videos/${job.id}.mp4`,
          Body: fs.createReadStream(filePath),
          ContentType: "video/mp4",
        },
        queueSize: 4,
        partSize: 10 * 1024 * 1024, // 10MB chunks
      });

      parallelUpload.on("httpUploadProgress", (progress: Progress) => {
        if (progress.loaded && progress.total) {
          const percent = Math.round((progress.loaded / progress.total) * 100);
          // Scale upload progress (60% to 90%)
          const scaledProgress = 60 + Math.floor(percent * 0.3);
          updateProgress(scaledProgress, "uploading");
        }
      });

      await parallelUpload.done();
      const videoUrl = `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/videos/${job.id}.mp4`;
      console.log("✅ Uploaded to R2:", videoUrl);

      // --- CLEANUP & DB ---
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      await updateProgress(95, "saving");

      const res = await fetch(`${process.env.APP_URL}/api/videos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          videoUrl,
          videoKey: `videos/${job.id}.mp4`,
          thumbnailUrl: "",
          releaseYear: new Date().getFullYear(),
        }),
      });

      if (!res.ok) throw new Error("API Save Failed");

      await updateProgress(100, "done");
      console.log("🎉 JOB SUCCESSFUL");
      return { videoUrl };

    } catch (err: any) {
      console.error("❌ JOB FAILED:", err.message);
      await redis.set(`yt-job:${job.id}`, JSON.stringify({ status: "failed", error: err.message }), "EX", 3600);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      throw err;
    }
  },
  { connection: redis, concurrency: 1 }
);
