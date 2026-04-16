import { NextResponse } from "next/server";
import { youtubeQueue } from "@/lib/queues/youtubeQueue";

export async function POST(req: Request) {
  try {
    const { url, title, description } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "Missing URL" }, { status: 400 });
    }

    const job = await youtubeQueue.add("download-video", {
      url,
      title,
      description,
    });

    return NextResponse.json({
      jobId: job.id,
      message: "Processing started",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}