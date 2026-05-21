// app/api/upload/route.ts

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const file = formData.get("file") as File | null;
    const videoId = formData.get("videoId") as string | null;

    if (!file || !videoId) {
      return NextResponse.json(
        {
          error: "Missing file or video id",
        },
        {
          status: 400,
        }
      );
    }

    const arrayBuffer = await file.arrayBuffer();

    const uploadResponse = await fetch(
      `https://video.bunnycdn.com/library/${process.env.BUNNY_LIBRARY_ID}/videos/${videoId}`,
      {
        method: "PUT",
        headers: {
          AccessKey: process.env.BUNNY_API_KEY!,
          "Content-Type": "application/octet-stream",
        },
        body: Buffer.from(arrayBuffer),
      }
    );

    if (!uploadResponse.ok) {
      const text = await uploadResponse.text();

      return NextResponse.json(
        {
          error: text,
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (err: any) {
    console.error(err);

    return NextResponse.json(
      {
        error:
          err.message ||
          "Internal upload transport framework failure.",
      },
      {
        status: 500,
      }
    );
  }
}