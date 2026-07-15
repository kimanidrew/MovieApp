import { NextResponse } from "next/server";

export async function POST() {
  try {
    const accountId = process.env.CF_ACCOUNT_ID;
    const apiToken = process.env.CF_IMAGES_API_TOKEN;

    if (!accountId || !apiToken) {
      console.error("Missing Cloudflare Environment Configuration");
      return NextResponse.json(
        { error: "Cloudflare authentication variables are missing on the server." },
        { status: 500 }
      );
    }

    // Call Cloudflare's V2 Images API to request a secure one-time upload URL
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v2/direct_upload`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiToken}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      console.error("Cloudflare Images API error response:", data);
      throw new Error(data.errors?.[0]?.message || "Failed to retrieve upload ticket.");
    }

    // Extract the one-time target upload URL and the unique image ID assigned to it
    const { uploadURL, id } = data.result;

    return NextResponse.json({
      uploadUrl: uploadURL,
      imageId: id,
      // Provide a structured fallback URL pointing to your account target delivery configuration
      fallbackDirectUrl: `https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v1`,
    });
  } catch (error: any) {
    console.error("Failed to generate direct upload token:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}