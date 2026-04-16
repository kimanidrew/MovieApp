import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  console.log("📡 Status check:", id);

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const data = await redis.get(`yt-job:${id}`);

  console.log("📦 Redis data:", data);

  if (!data) {
    return NextResponse.json({
      status: "pending",
      progress: 0,
    });
  }

  return NextResponse.json(JSON.parse(data));
}