import fs from "fs";
import { Upload, Progress } from "@aws-sdk/lib-storage";
import { redis } from "../src/lib/redis"; 
import { S3Client } from "@aws-sdk/client-s3";
import { NodeHttpHandler } from "@smithy/node-http-handler";

const r2 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT, // e.g., https://<id>.r2.cloudflarestorage.com
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY!,
    secretAccessKey: process.env.R2_SECRET_KEY!,
  },
  requestHandler: new NodeHttpHandler({
    connectionTimeout: 10000, // 10 seconds
    socketTimeout: 10000,
  }),
});

async function updateProgress(jobId: string, progress: number, status = "uploading") {
  const payload = {
    jobId,
    progress,
    status,
    updatedAt: Date.now(),
  };

  try {
    // We await here to ensure Redis is updated before the function continues
    await redis.set(`yt-job:${jobId}`, JSON.stringify(payload), "EX", 3600);
    console.log(`📊 [${jobId}] → ${progress}% (${status})`);
  } catch (err) {
    console.error(`❌ Redis progress error [${jobId}]:`, err);
  }
}

/**
 * High-speed parallel multipart upload to R2
 */
export async function uploadToR2(
  filePath: string,
  key: string,
  jobId?: string
) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const stats = fs.statSync(filePath);
  const fileSize = stats.size;
  console.log(`📦 Starting Parallel R2 Upload: ${(fileSize / (1024 ** 3)).toFixed(2)} GB`);

  // 🎯 Immediate update to 1% so the UI doesn't look "stuck" at 0
  if (jobId) {
    await updateProgress(jobId, 1, "uploading");
  }

  const fileStream = fs.createReadStream(filePath);

  try {
    // 🎯 Use the @aws-sdk/lib-storage Upload class
    const parallelUpload = new Upload({
      client: r2,
      params: {
        Bucket: process.env.R2_BUCKET!,
        Key: key,
        Body: fileStream,
        ContentType: "video/mp4",
      },
      // 🔥 PERFORMANCE SETTINGS
      queueSize: 4,               // Concurrent chunks
      partSize: 10 * 1024 * 1024, // 10MB chunks for smoother progress updates
      leavePartsOnError: false, 
    });

    // Track Progress
    parallelUpload.on("httpUploadProgress", (progress: Progress) => {
      if (progress.loaded && progress.total && jobId) {
        const percent = Math.round((progress.loaded / progress.total) * 100);
        // Don't await here to avoid slowing down the data stream
        updateProgress(jobId, percent);
      }
    });

    const start = Date.now();
    await parallelUpload.done();
    const duration = (Date.now() - start) / 1000;

    console.log(`🎉 Upload COMPLETE in ${duration.toFixed(2)}s`);

    if (jobId) {
      await updateProgress(jobId, 100, "done");
    }

    // Return the public URL
    return `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${key}`;
  } catch (err: any) {
    console.error("❌ Multipart Upload Failed:", err);
    
    if (jobId) {
      await updateProgress(jobId, 0, "failed");
    }
    
    throw err;
  }
}
