import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const video = await prisma.video.create({
      data: {
        title: body.title,
        description: body.description,
        releaseYear: body.releaseYear,

        // R2 storage fields
        videoUrl: body.videoUrl,
        thumbnailUrl: body.thumbnailUrl,
        videoKey: body.videoKey, // ✅ IMPORTANT (R2 object key)
      },
    });

    return NextResponse.json({ video });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "DB error" },
      { status: 500 }
    );
  }
}