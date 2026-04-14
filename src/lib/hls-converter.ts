// @/lib/hls-converter.ts
import fs from "fs";
import path from "path";
import ffmpeg from "fluent-ffmpeg";
import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { r2 } from "@/lib/r2";
import { Readable } from "stream";

export async function processHLS(videoKey: string) {
  const outputDir = path.join("/tmp", `hls-${Date.now()}`);
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  console.log(`🔄 Downloading video from R2 with key: ${videoKey}`);
  // 1. Download source from R2 (using videoKey)
  const inputPath = await downloadVideoFromR2(videoKey);

  console.log(`🎬 Running FFmpeg to convert to HLS for video: ${videoKey}`);
  // 2. Run FFmpeg to create HLS segments
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .output(path.join(outputDir, "index.m3u8"))
      .outputOptions([
        "-hls_time 10",  // Segment duration
        "-hls_list_size 0",  // Unlimited playlist
        "-hls_segment_filename", path.join(outputDir, "seg_%03d.ts"),
      ])
      .on("end", async () => {
        console.log(`✅ FFmpeg conversion complete for video: ${videoKey}`);
        // 3. Upload HLS files back to R2
        const files = fs.readdirSync(outputDir);
        for (const file of files) {
          const fileBuffer = fs.readFileSync(path.join(outputDir, file));
          console.log(`📤 Uploading file ${file} to R2: videos/hls/${videoKey}/${file}`);
          await r2.send(new PutObjectCommand({
            Bucket: process.env.R2_BUCKET!,
            Key: `videos/hls/${videoKey}/${file}`,
            Body: fileBuffer,
            ContentType: file.endsWith(".m3u8") ? "application/x-mpegURL" : "video/MP2T"
          }));
        }
        resolve(true);
      })
      .on("error", (err) => {
        console.error(`❌ Error during FFmpeg conversion: ${err.message}`);
        reject(err);
      })
      .run();
  });
}

// Helper function to download the video file from R2
async function downloadVideoFromR2(videoKey: string): Promise<string> {
  const params = {
    Bucket: process.env.R2_BUCKET!,
    Key: videoKey,
  };

  console.log(`🔄 Downloading video with key: ${videoKey} from R2`);
  const { Body } = await r2.send(new GetObjectCommand(params));

  if (!Body) {
    throw new Error(`Failed to download video with key: ${videoKey}`);
  }

  // Convert ReadableStream to Node.js Readable stream
  const fileStream = await convertToReadableStream(Body);

  // Save the downloaded video to a local temporary path
  const tempFilePath = path.join("/tmp", videoKey);
  const writeStream = fs.createWriteStream(tempFilePath);

  return new Promise((resolve, reject) => {
    fileStream.pipe(writeStream);
    writeStream.on("finish", () => resolve(tempFilePath));
    writeStream.on("error", (err) => {
      console.error(`❌ Error writing video to file: ${err.message}`);
      reject(err);
    });
  });
}

// Helper function to convert AWS SDK's ReadableStream to Node.js Readable stream
function convertToReadableStream(body: any): Readable {
  if (body instanceof Readable) {
    return body;
  }

  // For AWS SDK v3, when Body is not a Node.js stream, we handle it as a Blob
  if (body instanceof Blob) {
    return Readable.from(body.stream());
  }

  throw new Error("Unsupported Body type from AWS SDK");
}