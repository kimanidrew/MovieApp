// app/api/videos/status/[uid]/route.ts

import { NextRequest, NextResponse } from "next/server";

const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID!;
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN!;

export async function GET(
  req: NextRequest,
  { params }: { params: { uid: string } }
) {
  try {
    const uid = params.uid;

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream/${uid}`,
      {
        headers: {
          Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
        },
        cache: "no-store",
      }
    );

    const json = await response.json();

    if (!json.success) {
      return NextResponse.json(
        {
          error: json.errors,
        },
        { status: 500 }
      );
    }

    const result = json.result;

    const ready =
      result.readyToStream === true ||
      result.status?.state === "ready";

    return NextResponse.json({
      uid,
      readyToStream: ready,
      status: result.status?.state ?? "processing",
      pctComplete: result.status?.pctComplete ?? 0,
      duration: result.duration ?? 0,
      thumbnail: result.thumbnail,
      playback: result.playback,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Failed to check processing status.",
      },
      { status: 500 }
    );
  }
}