import "dotenv/config";
import { Worker } from "bullmq";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { redis } from "../src/lib/redis";
import { S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";

console.log("🚀 YouTube Worker (STABLE MODE) starting...");

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
    const proc = spawn("yt-dlp", args, { stdio: "inherit" });
    proc.on("error", reject);
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
      // 1. Setup Directories (Crucial: FFmpeg won't create v0, v1, etc.)
      if (fs.existsSync(hlsDir)) fs.rmSync(hlsDir, { recursive: true, force: true });
      fs.mkdirSync(hlsDir, { recursive: true });
      for (let i = 0; i < 4; i++) {
        fs.mkdirSync(path.join(hlsDir, `v${i}`), { recursive: true });
      }

      await updateProgress(jobId, 5, "fetching_metadata");

      const infoRes = await fetch(`${process.env.APP_URL}/api/upload/youtube/info`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const info = await infoRes.json();

      // 2. Download
      await updateProgress(jobId, 10, "downloading");
      const dlArgs: string[] = [
        "--no-playlist",
        ...(fs.existsSync(cookiePath) ? ["--cookies", cookiePath] : []),
        "--extractor-args", "youtube:player_client=web",
        "--force-ipv4",
        "-f", "bv*+ba/best",
        "-o", mp4Path,
        url,
      ];
      await runYtDlp(dlArgs);

      // 3. Transcode
      await updateProgress(jobId, 40, "transcoding");
      await new Promise<void>((resolve, reject) => {
        const ffmpeg = spawn("ffmpeg", [
          "-i", mp4Path,

          "-filter_complex",
          // Split video into 4 AND split audio into 4
          "[0:v]split=4[v1][v2][v3][v4]; \
          [0:a]asplit=4[a1][a2][a3][a4]; \
          [v1]scale=640:360:force_original_aspect_ratio=decrease,pad=ceil(iw/2)*2:ceil(ih/2)*2[v1out]; \
          [v2]scale=854:480:force_original_aspect_ratio=decrease,pad=ceil(iw/2)*2:ceil(ih/2)*2[v2out]; \
          [v3]scale=1280:720:force_original_aspect_ratio=decrease,pad=ceil(iw/2)*2:ceil(ih/2)*2[v3out]; \
          [v4]scale=1920:1080:force_original_aspect_ratio=decrease,pad=ceil(iw/2)*2:ceil(ih/2)*2[v4out]",

          // Map each video to its corresponding audio split
          "-map", "[v1out]", "-map", "[a1]",
          "-map", "[v2out]", "-map", "[a2]",
          "-map", "[v3out]", "-map", "[a3]",
          "-map", "[v4out]", "-map", "[a4]",

          "-c:v", "libx264",
          "-preset", "veryfast",
          "-crf", "18", // Slightly better quality than 20
          "-g", "48",
          "-keyint_min", "48",
          "-sc_threshold", "0",
          
          "-c:a", "aac",
          "-ar", "48000",

          // Video Bitrates
          "-b:v:0", "800k",
          "-b:v:1", "1400k",
          "-b:v:2", "2800k",
          "-b:v:3", "5000k",

          // Audio Bitrates (matching your previous high-quality setup)
          "-b:a:0", "96k",
          "-b:a:1", "128k",
          "-b:a:2", "128k",
          "-b:a:3", "192k",

          "-f", "hls",
          "-hls_time", "6",
          "-hls_playlist_type", "vod",
          "-hls_list_size", "0",
          "-hls_flags", "independent_segments",

          // Map variant 0 to v:0 and a:0, variant 1 to v:1 and a:1, etc.
          "-var_stream_map", "v:0,a:0 v:1,a:1 v:2,a:2 v:3,a:3",

          "-master_pl_name", "master.m3u8",
          "-hls_segment_filename", `${hlsDir}/v%v/seg_%03d.ts`,
          `${hlsDir}/v%v/index.m3u8`,

          "-y"
        ]);



        ffmpeg.stderr.on("data", (d) => console.log("ffmpeg:", d.toString()));
        ffmpeg.on("close", (code) => (code === 0 ? resolve() : reject(new Error("ffmpeg failed"))));
      });

      // 4. Upload
      await updateProgress(jobId, 70, "uploading");
      const getAllFiles = (dir: string): string[] => {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        return entries.flatMap((e) => {
          const res = path.join(dir, e.name);
          return e.isDirectory() ? getAllFiles(res) : [res];
        });
      };

      const files = getAllFiles(hlsDir);
      for (const file of files) {
        const relativePath = path.relative(hlsDir, file); // Fixes the R2 path
        const upload = new Upload({
          client: s3,
          params: {
            Bucket: process.env.R2_BUCKET!,
            Key: `videos/hls/${jobId}/${relativePath}`,
            Body: fs.createReadStream(file),
            ContentType: file.endsWith(".m3u8") ? "application/x-mpegURL" : "video/MP2T",
          },
        });
        await upload.done();
      }

      // 5. Save to DB
      await updateProgress(jobId, 95, "saving");
      const hlsUrl = `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/videos/hls/${jobId}/master.m3u8`;
      const dbRes = await fetch(`${process.env.APP_URL}/api/videos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: info.title,
          description: info.description || "",
          videoUrl: hlsUrl,
          thumbnailUrl: info.thumbnail,
          videoKey: `videos/hls/${jobId}`,
          releaseYear: new Date().getFullYear(),
        }),
      });

      if (!dbRes.ok) throw new Error(`DB Save Failed: ${await dbRes.text()}`);

      // Cleanup
      fs.rmSync(mp4Path, { force: true });
      fs.rmSync(hlsDir, { recursive: true, force: true });
      await updateProgress(jobId, 100, "done");

    } catch (err: any) {
      console.error("❌ WORKER ERROR:", err);
      await updateProgress(jobId, 0, "failed");
      if (fs.existsSync(mp4Path)) fs.unlinkSync(mp4Path);
      if (fs.existsSync(hlsDir)) fs.rmSync(hlsDir, { recursive: true, force: true });
      throw err;
    }
  },
  { 
    connection: redis, 
    concurrency: 1,
    // 🔥 Increased lock duration to 1 hour so BullMQ doesn't timeout during transcode
    lockDuration: 3600000 
  }
);
