// src/app/api/admin/media/upload-ticket/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { filename, sizeInBytes } = await req.json();

    const accountId = process.env.CF_ACCOUNT_ID;
    const apiToken = process.env.CF_API_TOKEN;

    if (!accountId || !apiToken) {
      return NextResponse.json({ error: "Cloudflare configurations missing" }, { status: 500 });
    }

    // Request direct creator upload URL from Cloudflare Stream
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/direct_upload`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          maxDurationSeconds: 14400, // 4-hour hard ceiling cap
          meta: { name: filename },
          uploadLength: sizeInBytes,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Cloudflare rejected request: ${errorText}`);
    }

    const data = await response.json();
    
    // Returns uploadURL (TUS boundary) and uid (Cloudflare asset pointer ID)
    return NextResponse.json({
      uploadUrl: data.result.uploadURL,
      videoId: data.result.uid,
    });
  } catch (error: any) {
    console.error("Cloudflare Ticket Generation Failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}