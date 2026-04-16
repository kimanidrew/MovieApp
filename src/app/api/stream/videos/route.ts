import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSmartThumbnail } from "@/lib/cloudflareThumbnail";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      title,
      description,
      releaseYear,
      streamUid,
    } = body;

    if (!title || !streamUid) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // 🎯 Auto-generate thumbnail from Cloudflare Stream
    const autoThumbnailUrl = getSmartThumbnail(streamUid);

    const videoKey = streamUid;

    const hlsManifestUrl = `https://videodelivery.net/${videoKey}/manifest/video.m3u8`;

    const video = await prisma.video.create({
      data: {
        title,
        description: description || null,
        releaseYear: releaseYear || new Date().getFullYear(),
        videoKey,
        hlsManifestUrl,
        thumbnailUrl: autoThumbnailUrl, // 👈 AUTO GENERATED
      },
    });

    return NextResponse.json({
      success: true,
      video,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}