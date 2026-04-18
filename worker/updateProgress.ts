import { redis } from "../src/lib/redis";

/**
 * Updates job progress in Redis.
 * Now using async/await and expiration for stability.
 */
export async function updateProgress(
  jobId: string,
  progress: number,
  status = "processing"
) {
  const payload = {
    jobId,
    progress,
    status,
    updatedAt: Date.now(),
  };

  try {
    // 🎯 Await the set operation so the worker stays in sync
    // 🎯 Set an expiration (e.g., 3600 seconds / 1 hour) to auto-clean Redis
    await redis.set(`yt-job:${jobId}`, JSON.stringify(payload), "EX", 3600);
    
    console.log(`📊 [${jobId}] → ${progress}% (${status})`);
  } catch (err) {
    console.error(`❌ [${jobId}] Redis error:`, err);
  }

  return payload;
}
