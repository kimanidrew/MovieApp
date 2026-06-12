import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { title, fileSize } = await req.json();

    const accountId = process.env.CF_ACCOUNT_ID!;
    const token = process.env.CF_STREAM_TOKEN!;

    // 1. TUS uploads require pointing to the core stream endpoint with direct_user=true
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream?direct_user=true`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Tus-Resumable": "1.0.0",
          "Upload-Length": fileSize.toString(),
          // Metadata values must be base64-encoded for Cloudflare TUS to process them
          "Upload-Metadata": `name ${btoa(title)}`,
        },
      },
    );

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json({ error: errText }, { status: response.status });
    }

    // 2. Cloudflare passes the unique TUS token URL back inside the Location header
    const uploadURL = response.headers.get("Location");

    // 3. Extract the unique video UID out of the URL string path for state tracking
    const uid = uploadURL ? uploadURL.split("/").pop() : null;

    if (!uploadURL || !uid) {
      return NextResponse.json(
        { error: "Missing upload location" },
        { status: 500 },
      );
    }

    return NextResponse.json({ uploadURL, uid });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to allocate TUS route" },
      { status: 500 },
    );
  }
}
