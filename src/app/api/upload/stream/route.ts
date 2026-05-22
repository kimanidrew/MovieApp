import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { title } = await req.json();

    const libraryId = process.env.BUNNY_LIBRARY_ID!;
    const apiKey = process.env.BUNNY_API_KEY!;

    const response = await fetch(
      `https://video.bunnycdn.com/library/${libraryId}/videos`,
      {
        method: "POST",
         headers: {
        Accept: "application/json",
        "Content-Type":
          "application/json",
        AccessKey: apiKey,
      },
        body: JSON.stringify({
          title,
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed creating Bunny video");
    }

    const data = await response.json();

    return NextResponse.json({
      videoId: data.guid,
      libraryId,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}