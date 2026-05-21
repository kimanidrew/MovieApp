import { NextResponse } from "next/server";
import { youtubeQueue } from "@/lib/queues/youtubeQueue";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Tracking identification token missing." }, { status: 400 });
  }

  const job = youtubeQueue.get(id);

  if (!job) {
    return NextResponse.json({ error: "Job structure has been completed or expired." }, { status: 404 });
  }

  return NextResponse.json({
    status: job.status,
    progress: job.progress,
    error: job.error || null
  });
}
