import { Worker } from "bullmq";
import { spawn } from "child_process";
import fs from "fs";
import { redis } from "../src/lib/redis";
import { uploadToR2 } from "./r2Worker";
import { updateProgress } from "./updateProgress";

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
      updateProgress(job.id!, 5, "starting");

      // -------------------------
      // DOWNLOAD VIDEO
      // -------------------------
      console.log("⬇️ Starting yt-dlp...");

      await new Promise((resolve, reject) => {
        const yt = spawn("yt-dlp", [
          "-f",
          "bestvideo+bestaudio/best",
          "-o",
          filePath,
          url,
        ]);

        yt.stdout.on("data", (d) => {
          const msg = d.toString();
          console.log("📥 yt-dlp:", msg);
        });

        yt.stderr.on("data", (d) => {
          const msg = d.toString();
          console.log("⚠️ yt-dlp err:", msg);
        });

        yt.on("close", (code) => {
          console.log("📥 yt-dlp exit code:", code);
          if (code === 0) resolve(true);
          else reject(new Error("yt-dlp failed"));
        });
      });

      console.log("✅ Download complete:", filePath);

      updateProgress(job.id!, 60, "uploading");

      // -------------------------
      // UPLOAD TO R2
      // -------------------------
      console.log("☁️ Uploading to R2...");

      const videoUrl = await uploadToR2(
        filePath,
        `videos/${job.id}.mp4`
      );

      console.log("✅ Uploaded to R2:", videoUrl);

      // cleanup
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log("🧹 Temp file removed");
      }

      updateProgress(job.id!, 85, "saving");

      // -------------------------
      // SAVE TO DB
      // -------------------------
      console.log("💾 Saving to DB...");

      const res = await fetch(
        `${process.env.APP_URL}/api/videos`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
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

      console.log("💾 DB RESPONSE:", db);

      if (!res.ok) {
        throw new Error("DB save failed");
      }

      updateProgress(job.id!, 100, "done");

      console.log("🎉 JOB DONE:", job.id);
      console.log("==============================\n");

      return { videoUrl };
    } catch (err: any) {
      console.error("❌ JOB FAILED:", job.id, err.message);

      updateProgress(job.id!, 0, "failed");

      // cleanup if exists
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