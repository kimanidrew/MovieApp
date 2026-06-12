// app/api/videos/status/[uid]/route.ts

import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ uid: string }> }
) {
  try {
    const { uid } = await params;

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ACCOUNT_ID}/stream/${uid}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.CF_STREAM_TOKEN}`,
        },
        cache: "no-store",
      }
    );

    const data = await response.json();

    return NextResponse.json({
      readyToStream: data.result?.readyToStream ?? false,
      pctComplete: data.result?.status?.pctComplete ?? 0,
      state: data.result?.status?.state ?? null,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to fetch status" },
      { status: 500 }
    );
  }
}