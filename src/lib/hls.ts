import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import path from "path";
import fs from "fs";

ffmpeg.setFfmpegPath(ffmpegPath!);

export async function convertToHLS(inputPath: string, outputDir: string) {
  return new Promise<string>((resolve, reject) => {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const masterPath = path.join(outputDir, "master.m3u8");

    ffmpeg(inputPath)
      .outputOptions([
        // 🔥 Split video into 3 qualities
        "-filter_complex",
        "[0:v]split=3[v1][v2][v3];" +
        "[v1]scale=w=1920:h=1080[v1out];" +
        "[v2]scale=w=1280:h=720[v2out];" +
        "[v3]scale=w=854:h=480[v3out]",

        // 🎥 Map video + audio streams
        "-map [v1out]", "-map 0:a",
        "-map [v2out]", "-map 0:a",
        "-map [v3out]", "-map 0:a",

        // ⚡ Video encoding
        "-c:v libx264",
        "-preset veryfast",
        "-crf 20",

        // 📊 Bitrates per quality
        "-b:v:0 5000k",
        "-b:v:1 2800k",
        "-b:v:2 1400k",

        // 🔊 Audio
        "-c:a aac",
        "-ar 48000",
        "-b:a 128k",

        // 📦 HLS settings
        "-f hls",
        "-hls_time 6",
        "-hls_playlist_type vod",

        // 📁 Segment files
        "-hls_segment_filename",
        path.join(outputDir, "v%v/segment_%03d.ts"),

        // 📄 Master playlist
        "-master_pl_name master.m3u8",

        // 🧠 Variant mapping
        "-var_stream_map",
        "v:0,a:0 v:1,a:1 v:2,a:2",
      ])
      .output(path.join(outputDir, "v%v/prog_index.m3u8"))

      .on("start", (cmd) => {
        console.log("🚀 FFmpeg started:");
        console.log(cmd);
      })
      .on("end", () => {
        console.log("✅ HLS conversion finished");
        resolve(masterPath);
      })
      .on("error", (err) => {
        console.error("❌ HLS conversion error:", err);
        reject(err);
      })
      .run();
  });
}