import { NextResponse } from "next/server";
import { Queue } from "bullmq";
import { redis } from "@/lib/redis";

const queue = new Queue("youtube-download", {
  connection: redis,
});

export async function POST(req: Request) {
  const body = await req.json();

  console.log("📥 Queue request received:");
  console.log(body);

  const job = await queue.add("download", body);

  console.log("🆔 Job created:", job.id);

  return NextResponse.json({ jobId: job.id });
}