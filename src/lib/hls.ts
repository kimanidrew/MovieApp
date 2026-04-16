import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import path from "path";
import fs from "fs";

ffmpeg.setFfmpegPath(ffmpegPath!);

export async function convertToHLS(inputPath: string, outputDir: string) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = path.join(outputDir, "index.m3u8");

    ffmpeg(inputPath)
      .outputOptions([
        "-profile:v baseline",
        "-level 3.0",
        "-start_number 0",
        "-hls_time 10",
        "-hls_list_size 0",
        "-f hls",
      ])
      .output(outputPath)
      .on("end", () => {
        console.log("✅ HLS conversion finished");
        resolve(outputPath);
      })
      .on("error", (err) => {
        console.error("❌ HLS conversion error:", err);
        reject(err);
      })
      .run();
  });
}