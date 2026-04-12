import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.title || !body.videoUrl || !body.thumbnailUrl || !body.videoKey) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const video = await prisma.video.create({
      data: {
        title: body.title,
        description: body.description || null,
        releaseYear: body.releaseYear,
        videoUrl: body.videoUrl,
        thumbnailUrl: body.thumbnailUrl,
        videoKey: body.videoKey,
      },
    });

    return NextResponse.json({ video });
  } catch (err: any) {
    console.error("Database save failed:", err); 
    return NextResponse.json(
      { error: err.message || "DB error" },
      { status: 500 }
    );
  }
}