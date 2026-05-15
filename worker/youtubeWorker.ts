import "dotenv/config";
import { Worker } from "bullmq";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { redis } from "../src/lib/redis";
import { S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";

console.log("🚀 YouTube Ultra Streaming Worker Starting...");

const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY!,
    secretAccessKey: process.env.R2_SECRET_KEY!,
  },
});

async function updateProgress(
  jobId: string,
  progress: number,
  status = "processing"
) {
  await redis.set(
    `yt-job:${jobId}`,
    JSON.stringify({
      jobId,
      progress,
      status,
      updatedAt: Date.now(),
    }),
    "EX",
    3600
  );

  console.log(`📊 [${jobId}] ${progress}% (${status})`);
}

function run(command: string, args: string[]) {
  return new Promise<void>((resolve, reject) => {
    console.log(`🚀 ${command} ${args.join(" ")}`);

    const proc = spawn(command, args, {
      stdio: "inherit",
    });

    proc.on("error", reject);

    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} exited with ${code}`));
    });
  });
}

async function getVideoInfo(file: string) {
  return new Promise<any>((resolve, reject) => {
    let output = "";

    const ffprobe = spawn("ffprobe", [
      "-v",
      "quiet",
      "-print_format",
      "json",
      "-show_streams",
      file,
    ]);

    ffprobe.stdout.on("data", (d) => {
      output += d.toString();
    });

    ffprobe.on("close", () => {
      resolve(JSON.parse(output));
    });

    ffprobe.on("error", reject);
  });
}

new Worker(
  "youtube-download",
  async (job) => {
    const { url } = job.data;

    const jobId = String(job.id);

    const tempDir = `/tmp/${jobId}`;
    const mp4Path = `${tempDir}/source.mp4`;
    const hlsDir = `${tempDir}/hls`;

    const cookiePath =
      "/home/kimanidan585/MovieApp/cookies.txt";

    try {
      fs.mkdirSync(tempDir, { recursive: true });
      fs.mkdirSync(hlsDir, { recursive: true });

      await updateProgress(jobId, 5, "fetching_metadata");

      const infoRes = await fetch(
        `${process.env.APP_URL}/api/upload/youtube/info`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ url }),
        }
      );

      const info = await infoRes.json();

      // ============================================
      // DOWNLOAD BEST SOURCE
      // ============================================

      await updateProgress(jobId, 10, "downloading");

      await run("yt-dlp", [
        "--no-playlist",

        ...(fs.existsSync(cookiePath)
          ? ["--cookies", cookiePath]
          : []),

        "--merge-output-format",
        "mp4",

        "--remux-video",
        "mp4",

        "--format",
        "bv*+ba/best",

        "--concurrent-fragments",
        "8",

        "--downloader",
        "aria2c",

        "--downloader-args",
        "aria2c:-x 16 -k 1M",

        "-o",
        mp4Path,

        url,
      ]);

      // ============================================
      // DETECT SOURCE RESOLUTION
      // ============================================

      const probe = await getVideoInfo(mp4Path);

      const videoStream = probe.streams.find(
        (s: any) => s.codec_type === "video"
      );

      const sourceWidth = videoStream.width;
      const sourceHeight = videoStream.height;

      console.log("SOURCE:", sourceWidth, sourceHeight);

      // ============================================
      // BUILD QUALITY LADDER
      // ============================================

      const renditions = [
        {
          name: "360p",
          width: 640,
          height: 360,
          bitrate: "800k",
          maxrate: "856k",
          bufsize: "1200k",
          audio: "96k",
        },
        {
          name: "480p",
          width: 854,
          height: 480,
          bitrate: "1400k",
          maxrate: "1498k",
          bufsize: "2100k",
          audio: "128k",
        },
        {
          name: "720p",
          width: 1280,
          height: 720,
          bitrate: "2800k",
          maxrate: "2996k",
          bufsize: "4200k",
          audio: "128k",
        },
        {
          name: "1080p",
          width: 1920,
          height: 1080,
          bitrate: "5000k",
          maxrate: "5350k",
          bufsize: "7500k",
          audio: "192k",
        },
        {
          name: "2160p",
          width: 3840,
          height: 2160,
          bitrate: "18000k",
          maxrate: "19260k",
          bufsize: "27000k",
          audio: "320k",
        },
      ].filter(
        (r) =>
          r.width <= sourceWidth &&
          r.height <= sourceHeight
      );

      renditions.forEach((_, i) => {
        fs.mkdirSync(`${hlsDir}/v${i}`, {
          recursive: true,
        });
      });

      // ============================================
      // BUILD FILTER GRAPH
      // ============================================

      let filterComplex = "";

      renditions.forEach((r, i) => {
        filterComplex +=
          `[0:v]scale=w=${r.width}:h=${r.height}:` +
          `force_original_aspect_ratio=decrease:` +
          `flags=lanczos,` +
          `pad=${r.width}:${r.height}:(ow-iw)/2:(oh-ih)/2[v${i}];`;
      });

      // ============================================
      // FFMPEG
      // ============================================

      await updateProgress(jobId, 40, "transcoding");

      const ffmpegArgs = [
        "-i",
        mp4Path,

        "-filter_complex",
        filterComplex,

        // VIDEO MAPS
        ...renditions.flatMap((_, i) => [
          "-map",
          `[v${i}]`,
        ]),

        // AUDIO MAPS
        ...renditions.flatMap(() => [
          "-map",
          "0:a:0",
        ]),

        // GLOBAL VIDEO SETTINGS
        "-c:v",
        "libx264",

        "-preset",
        "slow",

        "-profile:v",
        "high",

        "-pix_fmt",
        "yuv420p",

        "-sc_threshold",
        "0",

        "-g",
        "48",

        "-keyint_min",
        "48",

        "-r",
        "30",

        // BETTER STREAMING
        "-movflags",
        "+faststart",

        // AUDIO
        "-c:a",
        "aac",

        "-ar",
        "48000",

        "-ac",
        "2",

        // QUALITY SETTINGS PER STREAM
        ...renditions.flatMap((r, i) => [
          `-b:v:${i}`,
          r.bitrate,

          `-maxrate:v:${i}`,
          r.maxrate,

          `-bufsize:v:${i}`,
          r.bufsize,

          `-b:a:${i}`,
          r.audio,
        ]),

        // HLS
        "-f",
        "hls",

        "-hls_time",
        "4",

        "-hls_playlist_type",
        "vod",

        "-hls_flags",
        "independent_segments+append_list",

        // MODERN HLS
        "-hls_segment_type",
        "fmp4",

        "-hls_fmp4_init_filename",
        "init.mp4",

        "-master_pl_name",
        "master.m3u8",

        "-var_stream_map",
        renditions
          .map((_, i) => `v:${i},a:${i}`)
          .join(" "),

        "-hls_segment_filename",
        `${hlsDir}/v%v/seg_%03d.m4s`,

        `${hlsDir}/v%v/index.m3u8`,

        "-y",
      ];

      await run("ffmpeg", ffmpegArgs);

      // ============================================
      // UPLOAD
      // ============================================

      await updateProgress(jobId, 75, "uploading");

      const getFiles = (dir: string): string[] => {
        return fs.readdirSync(dir, {
          withFileTypes: true,
        }).flatMap((entry) => {
          const full = path.join(dir, entry.name);

          return entry.isDirectory()
            ? getFiles(full)
            : [full];
        });
      };

      const files = getFiles(hlsDir);

      for (const file of files) {
        const relative = path.relative(hlsDir, file);

        const contentType = file.endsWith(".m3u8")
          ? "application/vnd.apple.mpegurl"
          : file.endsWith(".m4s")
          ? "video/iso.segment"
          : "video/mp4";

        const upload = new Upload({
          client: s3,
          params: {
            Bucket: process.env.R2_BUCKET!,
            Key: `videos/hls/${jobId}/${relative}`,
            Body: fs.createReadStream(file),
            ContentType: contentType,
          },
        });

        await upload.done();
      }

      // ============================================
      // SAVE DATABASE
      // ============================================

      await updateProgress(jobId, 95, "saving");

      const hlsUrl =
        `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}` +
        `/videos/hls/${jobId}/master.m3u8`;

      const dbRes = await fetch(
        `${process.env.APP_URL}/api/videos`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: info.title,
            description: info.description || "",
            videoUrl: hlsUrl,
            thumbnailUrl: info.thumbnail,
            videoKey: `videos/hls/${jobId}`,
            releaseYear: new Date().getFullYear(),
          }),
        }
      );

      if (!dbRes.ok) {
        throw new Error(await dbRes.text());
      }

      // ============================================
      // CLEANUP
      // ============================================

      fs.rmSync(tempDir, {
        recursive: true,
        force: true,
      });

      await updateProgress(jobId, 100, "done");
    } catch (err: any) {
      console.error("❌ WORKER ERROR:", err);

      await updateProgress(jobId, 0, "failed");

      throw err;
    }
  },
  {
    connection: redis,

    concurrency: 1,

    lockDuration: 7200000,
  }
);