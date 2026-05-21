import { NextResponse } from "next/server";
import crypto from "crypto";
import ytdl from "@distube/ytdl-core";
import prisma from "@/lib/prisma";
import { youtubeQueue } from "@/lib/queues/youtubeQueue";
import { createBunnyVideoPlaceholder } from "@/app/actions/bunnyActions";

export async function POST(req: Request) {
  try {
    const { url, title, description, releaseYear } = await req.json();

    if (!url || !ytdl.validateURL(url)) {
      return NextResponse.json({ error: "Missing or invalid video link pattern mapping." }, { status: 400 });
    }

    const jobId = crypto.randomUUID();
    youtubeQueue.set(jobId, { id: jobId, status: "queued", progress: 0 });

    const cookieString = process.env.YOUTUBE_COOKIE || "";

    // Authenticated connection layer configuration setup block
    const ytdlOptions: any = {
      requestOptions: {
        headers: {
          cookie: cookieString,
          "User-Agent": "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36"
        }
      }
    };

    // Non-blocking asynchronous IIFE thread execution block background processing
    (async () => {
      const LIBRARY_ID = process.env.BUNNY_LIBRARY_ID;
      const API_KEY = process.env.BUNNY_API_KEY;

      try {
        youtubeQueue.update(jobId, { status: "queued", progress: 10 });
        const { bunnyVideoId } = await createBunnyVideoPlaceholder(title || "YouTube Import");

        youtubeQueue.update(jobId, { status: "downloading", progress: 25 });
        
        // Pass option flags containing auth cookie headers
        const info = await ytdl.getInfo(url, ytdlOptions);
        
        const format = ytdl.chooseFormat(info.formats, { 
          quality: "highestvideo",
          filter: (f) => f.hasVideo && f.hasAudio && f.container === "mp4"
        });

        if (!format || !format.url) throw new Error("Progressive MP4 stream layout configuration missing.");

        // Spread options variables to authenticate video chunk downloads
        const youtubeStream = ytdl(url, { format, ...ytdlOptions });

        youtubeQueue.update(jobId, { status: "uploading", progress: 50 });
        const bunnyUploadResponse = await fetch(
          `https://bunnycdn.com{LIBRARY_ID}/videos/${bunnyVideoId}`,
          {
            method: "PUT",
            headers: { AccessKey: API_KEY!, "Content-Type": "application/octet-stream" },
            body: youtubeStream as any,
            // @ts-ignore
            duplex: "half",
          }
        );

        if (!bunnyUploadResponse.ok) throw new Error("Binary byte-stream transfer rejected by server.");

        youtubeQueue.update(jobId, { status: "encoding", progress: 80 });

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
              throw new Error("Bunny.net background HLS segment encoding processes failed.");
            }
          }
        }

        youtubeQueue.update(jobId, { status: "encoding", progress: 95 });

        // Phase E: Push completed, signed streaming profiles directly into your Prisma layout
        await prisma.video.create({
          data: {
            title: title || info.videoDetails.title,
            description: description || info.videoDetails.description || "",
            releaseYear: Number(releaseYear) || new Date().getFullYear(),
            videoKey: bunnyVideoId,
            thumbnailUrl: `vz-0a6dc352-83d.b-cdn.net/${bunnyVideoId}/thumbnail.jpg`,
            hlsManifestUrl: `vz-0a6dc352-83d.b-cdn.net/${bunnyVideoId}/playlist.m3u8`,
            isMovie: true,
            introStart: 0,
            introEnd: 0
          }
        });

        youtubeQueue.update(jobId, { status: "done", progress: 100 });

      } catch (err: any) {
        console.error(`Background worker process block collapsed [${jobId}]:`, err);
        youtubeQueue.update(jobId, { status: "failed", progress: 0, error: err?.message || "Processing error." });
      }
    })();

    return NextResponse.json({ jobId });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed initializing pipeline queue." }, { status: 500 });
  }
}
