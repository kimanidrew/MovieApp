import { NextResponse } from "next/server";
import crypto from "crypto";
import ytdl from "@distube/ytdl-core";
import prisma from "@/lib/prisma";
import { youtubeQueue } from "@/lib/queues/youtubeQueue";
import { createBunnyVideoPlaceholder } from "@/app/actions/bunnyActions";

export async function POST(req: Request) {
  try {
    const { url, title, description } = await req.json();

    // 1. Verify incoming video link parameters are mapping safely
    if (!url || !ytdl.validateURL(url)) {
      return NextResponse.json(
        { error: "Invalid or missing YouTube video URL string." }, 
        { status: 400 }
      );
    }

    // 2. Generate a secure, unique runtime identifier token tracking hash
    const jobId = crypto.randomUUID();
    
    // Instantiate background memory register tracking mapping state indices
    youtubeQueue.set(jobId, { id: jobId, status: "queued", progress: 0 });

    const cookieString = process.env.YOUTUBE_COOKIE || "";

    // Authenticated connection layer header options payload definitions object
    const ytdlOptions: any = {
      requestOptions: {
        headers: {
          cookie: cookieString,
          "User-Agent": "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36"
        }
      }
    };

    // 3. Spawn a non-blocking background streaming runtime loop context
    (async () => {
      const LIBRARY_ID = process.env.BUNNY_LIBRARY_ID;
      const API_KEY = process.env.BUNNY_API_KEY;

      try {
        youtubeQueue.update(jobId, { status: "queued", progress: 10 });
        
        // Initialize streaming framework register placeholders downstream on Bunny.net
        const { bunnyVideoId } = await createBunnyVideoPlaceholder(title || "YouTube Import");

        youtubeQueue.update(jobId, { status: "downloading", progress: 25 });
        const info = await ytdl.getInfo(url, ytdlOptions);
        
        const format = ytdl.chooseFormat(info.formats, { 
          quality: "highestvideo",
          filter: (f) => f.hasVideo && f.hasAudio && f.container === "mp4"
        });

        if (!format || !format.url) throw new Error("Progressive MP4 codec profile stream missing.");

        // Pull active video chunks securely from YouTube utilizing account cookies
        const youtubeStream = ytdl(url, { format, ...ytdlOptions });

        youtubeQueue.update(jobId, { status: "uploading", progress: 50 });
        
        // Mirror chunks byte arrays straight onto CDN without disk file caching
        const bunnyUploadResponse = await fetch(
          `https://bunnycdn.com{LIBRARY_ID}/videos/${bunnyVideoId}`,
          {
            method: "PUT",
            headers: { AccessKey: API_KEY!, "Content-Type": "application/octet-stream" },
            body: youtubeStream as any,
            // @ts-ignore - Direct streaming flag instruction optimization hook
            duplex: "half",
          }
        );

        if (!bunnyUploadResponse.ok) throw new Error("CDN data storage transfer rejected.");

        youtubeQueue.update(jobId, { status: "encoding", progress: 80 });

        // Loop internal status polling updates till cloud transcoding process completes
        let transcodeCompleted = false;
        while (!transcodeCompleted) {
          await new Promise((resolve) => setTimeout(resolve, 4000));

          const statusCheck = await fetch(
            `https://bunnycdn.com{LIBRARY_ID}/videos/${bunnyVideoId}`,
            { method: "GET", headers: { AccessKey: API_KEY! }, cache: "no-store" }
          );

          if (statusCheck.ok) {
            const data = await statusCheck.json();
            if (data.status === 4) {
              transcodeCompleted = true;
            } else if (data.status === 5) {
              throw new Error("Bunny.net media transcoding encoder pipeline failure.");
            }
          }
        }

        youtubeQueue.update(jobId, { status: "encoding", progress: 95 });

        // 4. Save video record fields to PostgreSQL database through your Prisma adaptor
        await prisma.video.create({
          data: {
            title: title || info.videoDetails.title,
            description: description || info.videoDetails.description || "",
            releaseYear: new Date().getFullYear(),
            videoKey: bunnyVideoId,
            thumbnailUrl: `vz-0a6dc352-83d.b-cdn.net/${bunnyVideoId}/thumbnail.jpg`,
            hlsManifestUrl: `vz-0a6dc352-83d.b-cdn.net/${bunnyVideoId}/playlist.m3u8`,
            isMovie: true,
            introStart: 0,
            introEnd: 0
          }
        });

        // Terminate job safely marking complete status variables 
        youtubeQueue.update(jobId, { status: "done", progress: 100 });

      } catch (err: any) {
        console.error(`Background worker process block collapsed for Job ID [${jobId}]:`, err);
        youtubeQueue.update(jobId, { status: "failed", progress: 0, error: err?.message || "Unknown error." });
      }
    })();

    // 5. Instantly yield job identifier tokens tracking hash straight back to the client interface threads
    return NextResponse.json({
      jobId: jobId,
      message: "Processing started",
    });

  } catch (err: any) {
    console.error("HTTP Queue setup boundary failure:", err);
    return NextResponse.json(
      { error: err?.message || "Internal network error occurred." },
      { status: 500 }
    );
  }
}
