// lib/queues/youtubeQueue.ts
import { Queue } from "bullmq";
import { redis } from "@/lib/redis";

export const youtubeQueue = new Queue("youtube-download", {
  connection: redis,
});