import { redis } from "../src/lib/redis";

export function updateProgress(
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

  console.log(`📊 [${jobId}] → ${progress}% (${status})`);

  redis
    .set(`yt-job:${jobId}`, JSON.stringify(payload))
    .then((res) => {
      console.log(`✅ [${jobId}] Redis OK → ${res}`);
    })
    .catch((err) => {
      console.error(`❌ [${jobId}] Redis error`, err);
    });

  return payload;
}