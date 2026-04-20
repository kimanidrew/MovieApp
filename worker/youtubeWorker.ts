import "dotenv/config";
import { Worker } from "bullmq";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { redis } from "../src/lib/redis";
import { S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";

console.log("🚀 YouTube Worker (HARD FIX MODE) starting...");

const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY!,
    secretAccessKey: process.env.R2_SECRET_KEY!,
  },
});

async function updateProgress(jobId: string, progress: number, status = "processing") {
  await redis.set(
    `yt-job:${jobId}`,
    JSON.stringify({ jobId, progress, status, updatedAt: Date.now() }),
    "EX",
    3600
  );

  console.log(`📊 [${jobId}] ${progress}% (${status})`);
}

function runYtDlp(args: string[]) {
  return new Promise<void>((resolve, reject) => {
    console.log("🎬 yt-dlp args:", args.join(" "));

    const proc = spawn("yt-dlp", args, {
      stdio: "inherit", // 🔥 CRITICAL: shows real error (you were blind before)
    });

    proc.on("error", (err) => {
      console.error("❌ spawn error:", err);
      reject(err);
    });

    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`yt-dlp exited with code ${code}`));
    });
  });
}

new Worker(
  "youtube-download",
  async (job) => {
    const { url } = job.data;
    const jobId = String(job.id);

    const mp4Path = `/tmp/${jobId}.mp4`;
    const hlsDir = `/tmp/hls-${jobId}`;
    const cookiePath = "/home/kimanidan585/MovieApp/cookies.txt";

    try {
      if (!fs.existsSync(hlsDir)) {
        fs.mkdirSync(hlsDir, { recursive: true });
      }

      await updateProgress(jobId, 5, "fetching_metadata");

      const infoRes = await fetch(`${process.env.APP_URL}/api/upload/youtube/info`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const info = await infoRes.json();

      // ================= DOWNLOAD =================
      await updateProgress(jobId, 10, "downloading");

      const args: string[] = [
        "--no-playlist",

        // 🔥 FORCE AUTH FIRST (IMPORTANT ORDER)
        ...(fs.existsSync(cookiePath) ? ["--cookies", cookiePath] : []),

        "--extractor-args",
        "youtube:player_client=web",

        "--force-ipv4",

        "--concurrent-fragments",
        "2",

        "--retries",
        "15",

        "--fragment-retries",
        "15",

        "-f",
        "bv*+ba/best",

        "-o",
        mp4Path,

        url,
      ];

      await runYtDlp(args);

      // ================= HLS (ADAPTIVE STREAMING) =================
      await updateProgress(jobId, 40, "transcoding");

      await new Promise<void>((resolve, reject) => {
        const ffmpeg = spawn("ffmpeg", [
          "-i", mp4Path,

          // 🔥 SPLIT VIDEO INTO MULTIPLE STREAMS
          "-filter_complex",
          `
          [0:v]split=4[v1][v2][v3][v4];
          [v1]scale=w=640:h=360:force_original_aspect_ratio=decrease[v1out];
          [v2]scale=w=854:h=480:force_original_aspect_ratio=decrease[v2out];
          [v3]scale=w=1280:h=720:force_original_aspect_ratio=decrease[v3out];
          [v4]scale=w=1920:h=1080:force_original_aspect_ratio=decrease[v4out]
          `,

          // 🔥 MAP VIDEO STREAMS
          "-map", "[v1out]",
          "-map", "[v2out]",
          "-map", "[v3out]",
          "-map", "[v4out]",

          // 🔥 MAP AUDIO (ONCE, SHARED)
          "-map", "a:0",

          // ================= VIDEO SETTINGS =================
          "-c:v", "libx264",
          "-preset", "slow",
          "-crf", "20",

          // 🔥 BITRATES PER QUALITY
          "-b:v:0", "800k",
          "-b:v:1", "1400k",
          "-b:v:2", "2800k",
          "-b:v:3", "5000k",

          // ================= AUDIO =================
          "-c:a", "aac",
          "-b:a", "192k",

          // ================= HLS OUTPUT =================
          "-f", "hls",
          "-hls_time", "6",
          "-hls_playlist_type", "vod",
          "-hls_list_size", "0",

          // 🔥 IMPORTANT: variant streams
          "-var_stream_map",
          "v:0,a:0 v:1,a:0 v:2,a:0 v:3,a:0",

          // 🔥 MASTER PLAYLIST
          "-master_pl_name", "master.m3u8",

          // 🔥 OUTPUT FILE PATTERN
          "-hls_segment_filename",
          `${hlsDir}/v%v/seg_%03d.ts`,

          `${hlsDir}/v%v/index.m3u8`,
          "-y",
        ]);

        ffmpeg.stderr.on("data", (d) =>
          console.log("ffmpeg:", d.toString())
        );

        ffmpeg.on("close", (code) => {
          if (code === 0) resolve();
          else reject(new Error("ffmpeg failed"));
        });
      });

      // ================= UPLOAD =================
      await updateProgress(jobId, 70, "uploading");

      function getAllFiles(dir: string): string[] {
          const entries = fs.readdirSync(dir, { withFileTypes: true });

          return entries.flatMap((entry) => {
            const fullPath = path.join(dir, entry.name);
            return entry.isDirectory()
              ? getAllFiles(fullPath)
              : [fullPath];
          });
        }

      const files = getAllFiles(hlsDir);

      for (const file of files) {
        const upload = new Upload({
          client: s3,
          params: {
            Bucket: process.env.R2_BUCKET!,
            Key: `videos/hls/${jobId}/${file}`,
            Body: fs.createReadStream(path.join(hlsDir, file)),
            ContentType: file.endsWith(".m3u8")
              ? "application/x-mpegURL"
              : "video/MP2T",
          },
        });

        await upload.done();
      }

      const hlsUrl = `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/videos/hls/${jobId}/master.m3u8`;
      
      // ================= SAVE =================
      await updateProgress(jobId, 95, "saving");

      const payload = {
        title: info.title,
        description: info.description || "",
        videoUrl: hlsUrl,
        thumbnailUrl: info.thumbnail,
        videoKey: `videos/hls/${jobId}`, // 🔥 MUST MATCH UPLOAD PATH
        releaseYear: new Date().getFullYear(),
      };

      console.log("📦 DB PAYLOAD:", payload);

      const dbRes = await fetch(`${process.env.APP_URL}/api/videos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const dbText = await dbRes.text();

      console.log("📦 DB STATUS:", dbRes.status);
      console.log("📦 DB RESPONSE:", dbText);

      if (!dbRes.ok) {
        throw new Error(`DB SAVE FAILED: ${dbRes.status} -> ${dbText}`);
      }

      // ================= CLEAN =================
      fs.rmSync(mp4Path, { force: true });
      fs.rmSync(hlsDir, { recursive: true, force: true });

      await updateProgress(jobId, 100, "done");
    } catch (err: any) {
      console.error("❌ WORKER ERROR:", err.message);

      await updateProgress(jobId, 0, "failed");

      if (fs.existsSync(mp4Path)) fs.unlinkSync(mp4Path);
      if (fs.existsSync(hlsDir)) fs.rmSync(hlsDir, { recursive: true, force: true });

      throw err;
    }
  },
  { connection: redis, concurrency: 1 }
);