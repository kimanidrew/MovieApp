// app/api/videos/route.ts

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.title || !body.videoKey) {
      return NextResponse.json(
        {
          error: "Missing required fields: title or videoKey",
        },
        {
          status: 400,
        },
      );
    }

    // Remove any accidental query string
    const uid = body.videoKey.split("?")[0].trim();

    const accountId = process.env.CF_ACCOUNT_ID!;
    const token = process.env.CF_STREAM_TOKEN!;

    const cfResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/${uid}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!cfResponse.ok) {
      const errorText = await cfResponse.text();

      throw new Error(
        `Cloudflare API Error (${cfResponse.status}): ${errorText}`,
      );
    }

    const cfData = await cfResponse.json();

    if (!cfData.success || !cfData.result) {
      throw new Error("Failed to retrieve Stream metadata");
    }

    const stream = cfData.result;

    // Build URLs directly from UID
    const hlsManifestUrl =
      stream.playback?.hls ||
      `https://videodelivery.net/${uid}/manifest/video.m3u8`;

    const dashManifestUrl =
      stream.playback?.dash ||
      `https://videodelivery.net/${uid}/manifest/video.mpd`;

    const thumbnailUrl =
      stream.thumbnail ||
      `https://videodelivery.net/${uid}/thumbnails/thumbnail.jpg`;

    const previewUrl =
      stream.preview || `https://videodelivery.net/${uid}/iframe`;

    const durationSeconds = Math.round(stream.duration ?? 0);

    if (!thumbnailUrl || !hlsManifestUrl) {
      throw new Error(
        "Video processing is not complete yet. Try again in a few moments.",
      );
    }

    const video = await prisma.video.create({
      data: {
        title: body.title,
        description: body.description || null,
        releaseYear: Number(body.releaseYear) || new Date().getFullYear(),
        category: body.category || "Action",

        videoKey: uid,

        hlsManifestUrl,
        videoUrl: previewUrl,
        thumbnailUrl,
        durationSeconds,

        introStart: Number(body.introStart) || 0,
        introEnd: Number(body.introEnd) || 0,
        isMovie: body.isMovie !== undefined ? Boolean(body.isMovie) : true,
      },
    });

    return NextResponse.json({
      success: true,
      video,
    });
  } catch (error: any) {
    console.error("Video save failed:", error);

    return NextResponse.json(
      {
        error: error?.message || "Failed to save video metadata",
      },
      {
        status: 500,
      },
    );
  }
}
