import "dotenv/config"; 
import { Worker } from "bullmq";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { redis } from "../src/lib/redis";
import { S3Client } from "@aws-sdk/client-s3";
import { Upload, Progress } from "@aws-sdk/lib-storage";

console.log("🚀 GCP YouTube Worker (Strict Path Fix) starting...");

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
    const mp4Path = `/tmp/${jobId}.mp4`;
    const tempHlsDir = `/tmp/hls-${jobId}`;
    const hlsFolderKey = `videos/hls/${jobId}`;
    
    // 🎯 FIX: Explicitly target the MovieApp folder for cookies
    const cookiePath = "/home/kimanidan585/MovieApp/cookies.txt";

    try {
      if (!fs.existsSync(tempHlsDir)) fs.mkdirSync(tempHlsDir, { recursive: true });

      await updateProgress(jobId, 5, "fetching_metadata");

      const infoRes = await fetch(`${process.env.APP_URL}/api/upload/youtube/info`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const info = await infoRes.json();

      // --- 2. DOWNLOAD ---
      await updateProgress(jobId, 10, "downloading");

      await new Promise((resolve, reject) => {
      
        const args = [
          "--js-runtimes", "deno",
          "--no-playlist",
          // 🎯 This client is much harder for YouTube to block on GCP
          "--extractor-args", "youtube:player_client=web_embedded,android;formats=missing_pot",
          "-f", "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best",
          "-o", mp4Path,
          url,
        ];


        const yt = spawn("yt-dlp", args);

        yt.stderr.on("data", (d) => console.error(`yt-dlp-err: ${d.toString()}`));

        yt.on("close", (code) => {
          if (code === 0) resolve(true);
          else reject(new Error(`yt-dlp failed: ${code}`));
        });

      });

      // --- 3. CONVERT TO HLS ---
      await updateProgress(jobId, 40, "transcoding_hls");
      await new Promise((resolve, reject) => {
        const ffmpeg = spawn("ffmpeg", [
          "-i", mp4Path,
          "-codec:v", "libx264", "-preset", "veryfast",
          "-codec:a", "aac", "-b:a", "128k",
          "-hls_time", "10", "-hls_playlist_type", "vod",
          "-hls_segment_filename", `${tempHlsDir}/segment%03d.ts`,
          `${tempHlsDir}/playlist.m3u8`, "-y"
        ]);
        ffmpeg.on("close", (code) => code === 0 ? resolve(true) : reject(new Error("ffmpeg failed")));
      });

      // --- 4. UPLOAD TO R2 ---
      await updateProgress(jobId, 70, "uploading_hls");
      const files = fs.readdirSync(tempHlsDir);
      for (const file of files) {
        const upload = new Upload({
          client: s3,
          params: {
            Bucket: process.env.R2_BUCKET!,
            Key: `${hlsFolderKey}/${file}`,
            Body: fs.createReadStream(path.join(tempHlsDir, file)),
            ContentType: file.endsWith(".m3u8") ? "application/x-mpegURL" : "video/MP2T",
          },
        });
        await upload.done();
      }

      const hlsUrl = `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${hlsFolderKey}/playlist.m3u8`;

      // --- 5. SAVE DB ---
      await updateProgress(jobId, 95, "saving");
      await fetch(`${process.env.APP_URL}/api/videos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: info.title,
          description: info.description,
          videoUrl: hlsUrl,
          thumbnailUrl: info.thumbnail,
          videoKey: hlsFolderKey,
          releaseYear: new Date().getFullYear(),
        }),
      });

      // CLEANUP
      if (fs.existsSync(mp4Path)) fs.unlinkSync(mp4Path);
      if (fs.existsSync(tempHlsDir)) fs.rmSync(tempHlsDir, { recursive: true, force: true });
      await updateProgress(jobId, 100, "done");

    } catch (err: any) {
      console.error("❌ ERROR:", err.message);
      await updateProgress(jobId, 0, "failed");
      if (fs.existsSync(mp4Path)) fs.unlinkSync(mp4Path);
      throw err;
    }
  },
  { connection: redis, concurrency: 1 }
);
