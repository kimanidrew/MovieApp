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

    console.log("🎬 NEW JOB:", job.id);
    console.log("🔗 URL:", url);

    const filePath = `/tmp/${job.id}.mp4`;

    await updateProgress(job.id!, 5, "starting");

    // -------------------------
    // DOWNLOAD VIDEO
    // -------------------------
    console.log("⬇️ yt-dlp downloading...");

    await new Promise((resolve, reject) => {
      const yt = spawn("yt-dlp", [
        "-f",
        "mp4",
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
        console.log("📥 yt-dlp exit code:", code);

        if (code === 0) resolve(true);
        else reject(new Error("Download failed"));
      });
    });

    await updateProgress(job.id!, 60, "uploading");

    // -------------------------
    // UPLOAD TO R2
    // -------------------------
    const videoUrl = await uploadToR2(
      filePath,
      `videos/${job.id}.mp4`
    );

    fs.unlinkSync(filePath);

    console.log("🧹 Temp file removed");

    await updateProgress(job.id!, 90, "saving");

    // -------------------------
    // SAVE DB
    // -------------------------
    console.log("💾 Saving to API...");

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
    console.log("💾 DB response:", db);

    await updateProgress(job.id!, 100, "done");

    console.log("🎉 JOB DONE:", job.id);

    return { videoUrl };
  },
  {
    connection: redis,
  }
);