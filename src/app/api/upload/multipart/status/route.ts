import { NextResponse } from "next/server";

const store = new Map(); // replace with Redis in production

export async function POST(req: Request) {
  const { uploadId } = await req.json();

  console.log("📡 STATUS CHECK:", uploadId);

  return NextResponse.json({
    uploadId,
    data: store.get(uploadId) || null,
  });
}