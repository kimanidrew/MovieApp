import { NextResponse } from "next/server";
import ytdl from "@distube/ytdl-core";

export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    if (!url || !ytdl.validateURL(url)) {
      return NextResponse.json(
        { error: "Invalid or missing YouTube URL source link mapping." },
        { status: 400 }
      );
    }

    const cookieString = process.env.YOUTUBE_COOKIE;
    
    // Inject extracted authentication cookie parameters to pass bot checks
    const options: any = {
      requestOptions: {
        headers: {
          cookie: cookieString || "",
          "User-Agent": "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36"
        }
      }
    };

    const info = await ytdl.getInfo(url, options);
    const videoDetails = info.videoDetails;

    return NextResponse.json({
      title: videoDetails.title || "",
      description: videoDetails.description || "",
      thumbnail: videoDetails.thumbnails[videoDetails.thumbnails.length - 1]?.url || ""
    });

  } catch (error: any) {
    console.error("YouTube metadata parsing engine failure:", error);
    
    return NextResponse.json(
      { error: "Failed resolving YouTube details. Ensure your YOUTUBE_COOKIE string is pasted correctly inside .env.local" },
      { status: 500 }
    );
  }
}
