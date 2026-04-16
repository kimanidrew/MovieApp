import { redis } from "../src/lib/redis";

export async function updateProgress(jobId: string, progress: number, status = "processing") {
  const payload = {
    jobId,
    progress,
    status,
    updatedAt: Date.now(),
  };

  console.log("📊 Progress:", payload);

  await redis.set(`yt-job:${jobId}`, JSON.stringify(payload));
}