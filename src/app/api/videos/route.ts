import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // ✅ FIX 1: Validate fields matching Bunny's requirements (URLs are now built on the server)
    if (!body.title || !body.videoKey) {
      return NextResponse.json(
        { error: "Missing required fields: title or videoKey" },
        { status: 400 }
      );
    }

    const LIBRARY_ID = process.env.BUNNY_LIBRARY_ID;
    const PULL_ZONE = process.env.BUNNY_PULL_ZONE;

    if (!LIBRARY_ID || !PULL_ZONE) {
      return NextResponse.json(
        { error: "Missing Bunny.net server environment configurations" },
        { status: 500 }
      );
    }

    // ✅ FIX 2: Generate production-ready Bunny streaming and thumbnail links
    const hlsManifestUrl = `https://${PULL_ZONE}/${body.videoKey}/playlist.m3u8`;
    const videoUrl = `https://mediadelivery.net{LIBRARY_ID}/${body.videoKey}`;
    const thumbnailUrl = `https://${PULL_ZONE}/${body.videoKey}/thumbnail.jpg`;

    // Save record to database mapping your precise schema fields
    const video = await prisma.video.create({
      data: {
        title: body.title,
        description: body.description || null,
        releaseYear: Number(body.releaseYear) || new Date().getFullYear(),
        videoKey: body.videoKey,
        
        // Generated dynamic Bunny endpoints
        hlsManifestUrl,
        videoUrl,
        thumbnailUrl,
        
        // Netflix-like system defaults passed from your form
        category: body.category || "Action",
        introStart: Number(body.introStart) || 0, 
        introEnd: Number(body.introEnd) || 0,
        isMovie: body.isMovie !== undefined ? Boolean(body.isMovie) : true,
        durationSeconds: Math.floor(body.duration || 0)
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
