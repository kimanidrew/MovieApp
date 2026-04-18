import { Worker } from "bullmq";
import { spawn } from "child_process";
import fs from "fs";
import { redis } from "../src/lib/redis";
import { uploadToR2 } from "./r2Worker";

// Ensure environment variables are loaded for the worker
import "dotenv/config"; 

console.log("🚀 GCP YouTube Worker started...");

new Worker(
  "youtube-download",
  async (job) => {
    const { url, title, description } = job.data;

    console.log("\n==============================");
    console.log("🎬 NEW JOB:", job.id);
    console.log("🔗 URL:", url);

    const filePath = `/tmp/${job.id}.mp4`;

    try {
      // 🎯 FIXED: Added await and expiration to prevent hangs
      const updateProgress = async (progress: number, status: string) => {
        const payload = {
          jobId: job.id,
          progress,
          status,
          updatedAt: Date.now(),
        };

        console.log(`📊 [${job.id}] → ${progress}% (${status})`);
        
        // Use await here so the worker doesn't "get ahead" of the status
        await redis.set(`yt-job:${job.id}`, JSON.stringify(payload), "EX", 3600);
      };

      await updateProgress(5, "starting");

      // DOWNLOAD
      console.log("⬇️ yt-dlp downloading...");
      await new Promise((resolve, reject) => {
        const yt = spawn("yt-dlp", [
          "--js-runtimes", "node",
          "-f", "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best",
          "-o", filePath,
          url,
        ]);

        yt.on("close", (code) => {
          code === 0 ? resolve(true) : reject(new Error(`yt-dlp failed with code ${code}`));
        });
      });

      console.log("✅ Download complete");

      if (!fs.existsSync(filePath)) throw new Error("File missing after download");

      // 🎯 CRITICAL: Await the start of the upload status
      await updateProgress(60, "uploading");

      // UPLOAD
      console.log("☁️ Calling uploadToR2...");
      const videoUrl = await uploadToR2(
        filePath,
        `videos/${job.id}.mp4`,
        job.id 
      );

      console.log("✅ Uploaded URL:", videoUrl);

      // CLEANUP
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      
      await updateProgress(95, "saving");

      // SAVE DB
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

      await updateProgress(100, "done");
      console.log("🎉 JOB DONE:", job.id);

      return { videoUrl };
    } catch (err: any) {
      console.error("❌ JOB FAILED:", err.message);
      await redis.set(`yt-job:${job.id}`, JSON.stringify({ status: "failed" }), "EX", 3600);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      throw err;
    }
  },
  {
    connection: redis,
    concurrency: 1 // Start with 1 to ensure it's not a resource conflict
  }
);
