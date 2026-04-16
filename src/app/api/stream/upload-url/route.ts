import { NextResponse } from "next/server";

export async function POST() {
  try {
    console.log("🚀 Creating Cloudflare Stream upload URL...");

    const accountId = process.env.CF_ACCOUNT_ID;
    const token = process.env.CF_API_TOKEN;

    // 🔍 DEBUG: check env vars
    console.log("ACCOUNT_ID:", accountId ? "OK" : "MISSING");
    console.log("API_TOKEN:", token ? "OK" : "MISSING");

    if (!accountId || !token) {
      console.error("❌ Missing env variables");
      return NextResponse.json(
        { error: "Missing CF_ACCOUNT_ID or CF_API_TOKEN" },
        { status: 500 }
      );
    }

    const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/direct_upload`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        maxDurationSeconds: 3600,
      }),
    });

    // 🔥 IMPORTANT: capture raw response
    const data = await res.json();

    console.log("🌐 Cloudflare response:");
    console.log(JSON.stringify(data, null, 2));

    if (!res.ok) {
      console.error("❌ HTTP ERROR:", res.status);
      return NextResponse.json(
        {
          error: "Cloudflare request failed",
          status: res.status,
          details: data,
        },
        { status: 500 }
      );
    }

    if (!data.success) {
      console.error("❌ Cloudflare API error:", data.errors);

      return NextResponse.json(
        {
          error: "Cloudflare API failed",
          details: data.errors,
        },
        { status: 500 }
      );
    }

    const streamUid = data.result.uid;

    console.log("✅ Stream UID:", streamUid);

    return NextResponse.json({
      uploadURL: data.result.uploadURL,
      streamUid,
    });
  } catch (err: any) {
    console.error("🔥 SERVER ERROR:", err);

    return NextResponse.json(
      {
        error: err.message,
        stack: err.stack,
      },
      { status: 500 }
    );
  }
}