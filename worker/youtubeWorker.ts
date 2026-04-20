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

      // ================= HLS =================
      await updateProgress(jobId, 40, "transcoding");

      await new Promise<void>((resolve, reject) => {
        const ffmpeg = spawn("ffmpeg", [
          "-i", mp4Path,

          // 🔥 SCALE TO HD (1080p)
          "-vf", "scale=-2:1080",

          // 🔥 VIDEO QUALITY CONTROL
          "-c:v", "libx264",
          "-preset", "slow",          // better quality than veryfast
          "-crf", "20",               // 🔥 lower = better (18–23 ideal)

          // 🔥 AUDIO
          "-c:a", "aac",
          "-b:a", "192k",

          // 🔥 HLS SETTINGS
          "-hls_time", "6",
          "-hls_list_size", "0",
          "-hls_segment_filename", `${hlsDir}/seg%03d.ts`,

          `${hlsDir}/playlist.m3u8`,
          "-y",
        ]);

        ffmpeg.stderr.on("data", (d) => console.log("ffmpeg:", d.toString()));

        ffmpeg.on("close", (code) => {
          if (code === 0) resolve();
          else reject(new Error("ffmpeg failed"));
        });
      });

      // ================= UPLOAD =================
      await updateProgress(jobId, 70, "uploading");

      const files = fs.readdirSync(hlsDir);

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

      const hlsUrl = `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/videos/hls/${jobId}/playlist.m3u8`;

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