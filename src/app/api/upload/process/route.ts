import { NextResponse } from "next/server";
import { spawn } from "child_process";

export async function POST(req: Request) {
  const video = await req.json();

  const worker = spawn("node", ["worker/ffmpeg.js", video.key]);

  worker.stdout.on("data", d => console.log(d.toString()));
  worker.stderr.on("data", d => console.log(d.toString()));

  return NextResponse.json({ status: "processing_started" });
}