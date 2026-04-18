import fs from "fs";
import { Upload, Progress } from "@aws-sdk/lib-storage"; // 🔥 High-performance helper
import { redis } from "../src/lib/redis"; // Move import to top for stability
import { r2 } from "@/lib/r2";

/**
 * Updates progress in Redis with a 1-hour expiration to keep memory clean.
 */
async function updateProgress(jobId: string, progress: number, status = "uploading") {
  const payload = {
    jobId,
    progress,
    status,
    updatedAt: Date.now(),
  };

  try {
    // Non-blocking fire-and-forget update
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

  // Create a read stream for the file
  const fileStream = fs.createReadStream(filePath);

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
    queueSize: 4,          // Number of chunks to upload concurrently (adjust based on CPU)
    partSize: 20 * 1024 * 1024, // 20MB chunks (optimal for 10GB+ files)
    leavePartsOnError: false, 
  });

  // Track Progress
  parallelUpload.on("httpUploadProgress", (progress: Progress) => {
    if (progress.loaded && progress.total && jobId) {
      const percent = Math.round((progress.loaded / progress.total) * 100);
      // We don't need to await here to keep the upload loop fast
      updateProgress(jobId, percent);
    }
  });

  try {
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
    console.error("❌ Multipart Upload Failed:", err.message);
    
    if (jobId) {
      await updateProgress(jobId, 0, "failed");
    }
    
    throw err;
  }
}
