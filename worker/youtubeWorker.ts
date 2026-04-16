import { Worker } from "bullmq";
import { spawn } from "child_process";
import fs from "fs";
import { redis } from "../src/lib/redis";
import { uploadToR2 } from "./r2Worker";

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
      // -------------------------
      // START
      // -------------------------
      const updateProgress = async (progress: number, status: string) => {
        const payload = {
          jobId: job.id,
          progress,
          status,
          updatedAt: Date.now(),
        };

        console.log(`📊 [${job.id}] → ${progress}% (${status})`);

        redis.set(`yt-job:${job.id}`, JSON.stringify(payload));
      };

      updateProgress(5, "starting");

      // -------------------------
      // DOWNLOAD
      // -------------------------
      console.log("⬇️ yt-dlp downloading...");

      await new Promise((resolve, reject) => {
        const yt = spawn("yt-dlp", [
          "-f",
          "bestvideo+bestaudio/best",
          "-o",
          filePath,
          url,
        ]);

        yt.stdout.on("data", (d) =>
          console.log("yt-dlp:", d.toString())
        );

        yt.stderr.on("data", (d) =>
          console.log("yt-dlp err:", d.toString())
        );

        yt.on("close", (code) => {
          console.log("📥 yt-dlp exit:", code);
          code === 0 ? resolve(true) : reject(new Error("yt-dlp failed"));
        });
      });

      console.log("✅ Download complete");

      if (!fs.existsSync(filePath)) {
        throw new Error("File missing after download");
      }

      updateProgress(60, "uploading");

      // -------------------------
      // UPLOAD
      // -------------------------
      console.log("☁️ Uploading to R2...");

      const start = Date.now();

      const videoUrl = await uploadToR2(
        filePath,
        `videos/${job.id}.mp4`,
        job.id // 🔥 IMPORTANT
      );

      console.log("⏱ Upload time:", Date.now() - start, "ms");

      console.log("✅ Uploaded URL:", videoUrl);

      fs.unlinkSync(filePath);
      console.log("🧹 Temp file removed");

      updateProgress(95, "saving");

      // -------------------------
      // SAVE DB
      // -------------------------
      console.log("💾 Saving to API...");

      const res = await fetch(
        `${process.env.APP_URL}/api/videos`,
        {
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
        }
      );

      const db = await res.json();

      console.log("💾 DB response:", db);

      updateProgress(100, "done");

      console.log("🎉 JOB DONE:", job.id);

      return { videoUrl };
    } catch (err: any) {
      console.error("❌ JOB FAILED:", err.message);

      redis.set(
        `yt-job:${job.id}`,
        JSON.stringify({
          jobId: job.id,
          progress: 0,
          status: "failed",
          updatedAt: Date.now(),
        })
      );

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log("🧹 Cleanup after failure");
      }

      throw err;
    }
  },
  {
    connection: redis,
  }
);