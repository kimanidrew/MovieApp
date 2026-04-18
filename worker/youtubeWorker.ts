import "dotenv/config"; 
import { Worker } from "bullmq";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { redis } from "../src/lib/redis";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";

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
    const tempDir = `/tmp/hls-${jobId}`;
    const mp4Path = `/tmp/${jobId}.mp4`;
    const hlsFolderKey = `videos/hls/${jobId}`;

    try {
      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
      await updateProgress(jobId, 5, "fetching_metadata");

      // --- 1. FETCH METADATA ---
      const infoRes = await fetch(`${process.env.APP_URL}/api/upload/youtube/info`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const info = await infoRes.json();

      // --- 2. DOWNLOAD MP4 ---
      await updateProgress(jobId, 10, "downloading");
      await new Promise((resolve, reject) => {
        const yt = spawn("yt-dlp", [
          "--js-runtimes", "node",
          "-f", "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best",
          "-o", mp4Path,
          url,
        ]);
        yt.on("close", (code) => code === 0 ? resolve(true) : reject(new Error("yt-dlp failed")));
      });

      // --- 3. CONVERT TO HLS (FFMPEG) ---
      await updateProgress(jobId, 40, "transcoding_hls");
      console.log("🎬 Transcoding to HLS...");
      await new Promise((resolve, reject) => {
        const ffmpeg = spawn("ffmpeg", [
          "--js-runtimes", "deno",
          "-i", mp4Path,
          "-codec:v", "libx264", // Standard H264
          "-codec:a", "aac",    // Standard AAC
          "-hls_time", "10",     // 10 second segments
          "-hls_playlist_type", "vod",
          "-hls_segment_filename", `${tempDir}/segment%03d.ts`,
          `${tempDir}/playlist.m3u8`
        ]);
        ffmpeg.on("close", (code) => code === 0 ? resolve(true) : reject(new Error("ffmpeg failed")));
      });

      // --- 4. UPLOAD HLS FOLDER TO R2 ---
      await updateProgress(jobId, 70, "uploading_hls");
      const files = fs.readdirSync(tempDir);
      
      for (const file of files) {
        const fileStream = fs.createReadStream(path.join(tempDir, file));
        const contentType = file.endsWith(".m3u8") ? "application/x-mpegURL" : "video/MP2T";
        
        const upload = new Upload({
          client: s3,
          params: {
            Bucket: process.env.R2_BUCKET!,
            Key: `${hlsFolderKey}/${file}`,
            Body: fileStream,
            ContentType: contentType,
          },
        });
        await upload.done();
      }

      const hlsUrl = `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${hlsFolderKey}/playlist.m3u8`;

      // --- 5. SAVE TO DB ---
      await updateProgress(jobId, 95, "saving");
      const res = await fetch(`${process.env.APP_URL}/api/videos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: info.title,
          description: info.description,
          videoUrl: hlsUrl, // 🎯 HLS URL saved here
          thumbnailUrl: info.thumbnail,
          videoKey: hlsFolderKey,
          releaseYear: new Date().getFullYear(),
        }),
      });

      // --- CLEANUP ---
      fs.unlinkSync(mp4Path);
      fs.rmSync(tempDir, { recursive: true, force: true });
      await updateProgress(jobId, 100, "done");
      console.log("🎉 SUCCESS: HLS Uploaded");

    } catch (err: any) {
      console.error("❌ FATAL:", err.message);
      await updateProgress(jobId, 0, "failed");
      if (fs.existsSync(mp4Path)) fs.unlinkSync(mp4Path);
      if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });
      throw err;
    }
  },
  { connection: redis, concurrency: 1 }
);
