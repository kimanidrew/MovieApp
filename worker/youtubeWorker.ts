// 1. MUST BE FIRST: Load environment variables
import "dotenv/config"; 

import { Worker } from "bullmq";
import { spawn } from "child_process";
import fs from "fs";
import { redis } from "../src/lib/redis";
import { S3Client } from "@aws-sdk/client-s3";
import { Upload, Progress } from "@aws-sdk/lib-storage";

console.log("🚀 GCP YouTube Worker (Strict Types) starting...");

// 2. Initialize S3 Client with non-null assertions (!) 
// This tells TS "I guarantee these exist in my .env"
const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT!, 
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY!,
    secretAccessKey: process.env.R2_SECRET_KEY!,
  },
});

/**
 * Updates progress in Redis. 
 * Awaited to ensure synchronization.
 */
async function updateProgress(jobId: string, progress: number, status = "processing") {
  const payload = { jobId, progress, status, updatedAt: Date.now() };
  console.log(`📊 [${jobId}] → ${progress}% (${status})`);
  try {
    // Expiration set to 3600s (1 hour)
    await redis.set(`yt-job:${jobId}`, JSON.stringify(payload), "EX", 3600);
  } catch (err) {
    console.error("❌ Redis Error:", err);
  }
}

new Worker(
  "youtube-download",
  async (job) => {
    const { url, title, description } = job.data;
    const jobId = String(job.id); // Ensure jobId is a string
    const filePath = `/tmp/${jobId}.mp4`;

    try {
      await updateProgress(jobId, 5, "starting");

      // --- DOWNLOAD ---
      console.log("⬇️ yt-dlp downloading...");
      await new Promise((resolve, reject) => {
        const yt = spawn("yt-dlp", [
          "--js-runtimes", "node",
          "-f", "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best",
          "-o", filePath,
          url,
        ]);
        
        yt.on("close", (code) => {
          if (code === 0) resolve(true);
          else reject(new Error(`yt-dlp failed with code ${code}`));
        });
      });

      if (!fs.existsSync(filePath)) throw new Error("File missing after download");
      console.log("✅ Download complete.");

      // --- UPLOAD ---
      await updateProgress(jobId, 60, "uploading");
      console.log("☁️ Starting R2 Parallel Upload...");

      const parallelUpload = new Upload({
        client: s3,
        params: {
          Bucket: process.env.R2_BUCKET!,
          Key: `videos/${jobId}.mp4`,
          Body: fs.createReadStream(filePath),
          ContentType: "video/mp4",
        },
        queueSize: 4,
        partSize: 10 * 1024 * 1024,
      });

      parallelUpload.on("httpUploadProgress", (progress: Progress) => {
        if (progress.loaded && progress.total) {
          const percent = Math.round((progress.loaded / progress.total) * 100);
          const scaled = 60 + Math.floor(percent * 0.3); // Scale progress 60-90%
          updateProgress(jobId, scaled, "uploading");
        }
      });

      await parallelUpload.done();
      
      const baseUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "";
      const videoUrl = `${baseUrl.replace(/\/$/, "")}/videos/${jobId}.mp4`;
      console.log("✅ Uploaded to R2:", videoUrl);

      // --- DB SAVE ---
      await updateProgress(jobId, 91, "saving");
      
      const appUrl = process.env.APP_URL || "http://localhost:3000";
      const res = await fetch(`${appUrl}/api/videos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          videoUrl,
          videoKey: `videos/${jobId}.mp4`,
          thumbnailUrl: "",
          releaseYear: new Date().getFullYear(),
        }),
      });

      if (!res.ok) throw new Error(`API Save failed: ${res.statusText}`);

      // --- FINISH ---
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      await updateProgress(jobId, 100, "done");
      console.log("🎉 Job Completed!");

    } catch (err: any) {
      console.error("❌ Worker Error:", err.message);
      await updateProgress(jobId, 0, "failed");
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      throw err;
    }
  },
  { connection: redis, concurrency: 1 }
);
