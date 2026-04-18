import "dotenv/config"; 
import { Worker } from "bullmq";
import { spawn } from "child_process";
import fs from "fs";
import { redis } from "../src/lib/redis";
import { S3Client } from "@aws-sdk/client-s3";
import { Upload, Progress } from "@aws-sdk/lib-storage";

console.log("🚀 GCP YouTube Worker (Full Integration) starting...");

const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY!,
    secretAccessKey: process.env.R2_SECRET_KEY!,
  },
});

async function updateProgress(jobId: string, progress: number, status = "processing") {
  const payload = { jobId, progress, status, updatedAt: Date.now() };
  try {
    await redis.set(`yt-job:${jobId}`, JSON.stringify(payload), "EX", 3600);
    console.log(`📊 [${jobId}] → ${progress}% (${status})`);
  } catch (err) {
    console.error("❌ Redis Error:", err);
  }
}

new Worker(
  "youtube-download",
  async (job) => {
    const { url } = job.data;
    const jobId = String(job.id);
    const filePath = `/tmp/${jobId}.mp4`;
    const videoKey = `videos/youtube/${jobId}.mp4`;

    try {
      await updateProgress(jobId, 5, "fetching_metadata");

      // --- 1. FETCH METADATA (Title, Description, Thumbnail) ---
      console.log("🔍 Fetching YouTube metadata...");
      const infoRes = await fetch(`${process.env.APP_URL}/api/upload/youtube/info`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (!infoRes.ok) {
        throw new Error(`Failed to fetch YouTube info: ${await infoRes.text()}`);
      }

      const info = await infoRes.json();
      console.log("✅ Metadata fetched:", info.title);

      // --- 2. DOWNLOAD ---
      await updateProgress(jobId, 10, "downloading");
      console.log("⬇️ Downloading video...");
      await new Promise((resolve, reject) => {
        const yt = spawn("yt-dlp", [
          "--js-runtimes", "node",
          "-f", "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best",
          "-o", filePath,
          url,
        ]);
        yt.on("close", (code) => code === 0 ? resolve(true) : reject(new Error(`yt-dlp code ${code}`)));
      });

      // --- 3. UPLOAD TO R2 ---
      await updateProgress(jobId, 60, "uploading");
      const parallelUpload = new Upload({
        client: s3,
        params: {
          Bucket: process.env.R2_BUCKET!,
          Key: videoKey,
          Body: fs.createReadStream(filePath),
          ContentType: "video/mp4",
        },
        queueSize: 4,
        partSize: 10 * 1024 * 1024,
      });

      parallelUpload.on("httpUploadProgress", (p: Progress) => {
        if (p.loaded && p.total) {
          const percent = Math.round((p.loaded / p.total) * 100);
          updateProgress(jobId, 60 + Math.floor(percent * 0.3), "uploading");
        }
      });

      await parallelUpload.done();
      const videoUrl = `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${videoKey}`;

      // --- 4. SAVE TO DB ---
      await updateProgress(jobId, 95, "saving");
      
      const dbPayload = {
        title: info.title,
        description: info.description,
        videoUrl: videoUrl,
        thumbnailUrl: info.thumbnail, // Matches info response
        videoKey: videoKey,
        releaseYear: new Date().getFullYear(),
      };

      console.log("💾 Saving to Database...");
      const res = await fetch(`${process.env.APP_URL}/api/videos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dbPayload),
      });

      if (!res.ok) {
        const errorDetail = await res.text();
        throw new Error(`API DB Error: ${errorDetail}`);
      }

      // --- 5. CLEANUP ---
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      await updateProgress(jobId, 100, "done");
      console.log("🎉 SUCCESS: Movie added to database.");

    } catch (err: any) {
      console.error("❌ FATAL:", err.message);
      await updateProgress(jobId, 0, "failed");
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      throw err;
    }
  },
  { connection: redis, concurrency: 1 }
);
