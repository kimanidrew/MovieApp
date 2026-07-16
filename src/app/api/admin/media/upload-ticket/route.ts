// src/app/api/admin/media/upload-ticket/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { filename, sizeInBytes } = await req.json();

    const accountId = process.env.CF_ACCOUNT_ID;
    const apiToken = process.env.CF_API_TOKEN;

    if (!accountId || !apiToken) {
      return NextResponse.json({ error: "Cloudflare credentials unconfigured" }, { status: 500 });
    }

    // Direct Creator Upload endpoint via Tus Protocol for Stream
    const cfEndpoint = `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream?direct_user=true`;

    const response = await fetch(cfEndpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Tus-Resumable": "1.0.0",
        "Upload-Length": String(sizeInBytes),
        "Upload-Metadata": Buffer.from(`filename ${btoa(filename)}`).toString("base64"),
      },
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Cloudflare API handshake failure: ${errText}`);
    }

    // Cloudflare Stream responds with the secure tus endpoint mapped in the 'Location' header
    const uploadUrl = response.headers.get("Location");
    const videoId = response.headers.get("stream-media-id") || "";

    return NextResponse.json({ uploadUrl, videoId });
  } catch (error: any) {
    console.error("Tus token authorization failure:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}