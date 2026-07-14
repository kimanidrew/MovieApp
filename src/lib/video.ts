// src/lib/video.ts

import prisma from "@/lib/prisma";

export interface CloudflareVideoMetadata {
  uid: string;
  hlsManifestUrl: string;
  dashManifestUrl: string;
  thumbnailUrl: string;
  previewUrl: string;
  durationSeconds: number;
}

export async function getCloudflareVideo(
  uid: string,
): Promise<CloudflareVideoMetadata> {
  const accountId = process.env.CF_ACCOUNT_ID!;
  const token = process.env.CF_STREAM_TOKEN!;

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/${uid}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const json = await response.json();

  if (!json.success || !json.result) {
    throw new Error("Cloudflare Stream lookup failed.");
  }

  const stream = json.result;

  return {
    uid,

    hlsManifestUrl:
      stream.playback?.hls ??
      `https://videodelivery.net/${uid}/manifest/video.m3u8`,

    dashManifestUrl:
      stream.playback?.dash ??
      `https://videodelivery.net/${uid}/manifest/video.mpd`,

    thumbnailUrl:
      stream.thumbnail ??
      `https://videodelivery.net/${uid}/thumbnails/thumbnail.jpg`,

    previewUrl:
      stream.preview ??
      `https://videodelivery.net/${uid}/iframe`,

    durationSeconds: Math.round(stream.duration ?? 0),
  };
}

export async function waitUntilVideoReady(
  uid: string,
  retries = 120,
) {
  for (let i = 0; i < retries; i++) {
    const video = await getCloudflareVideo(uid);

    if (video.durationSeconds > 0) {
      return video;
    }

    await new Promise((resolve) => setTimeout(resolve, 3000));
  }

  throw new Error("Cloudflare video processing timed out.");
}

export async function createVideoRecord(
  uid: string,
  introStart = 0,
  introEnd = 0,
  recapStart = 0,
  recapEnd = 0,
  creditsStart?: number,
  creditsEnd?: number,
) {
  const stream = await getCloudflareVideo(uid);

  return prisma.video.create({
    data: {
      durationSeconds: stream.durationSeconds,

      introStart,
      introEnd,
      recapStart,
      recapEnd,
      creditsStart,
      creditsEnd,

      sources: {
        create: {
          type: "HLS",
          url: stream.hlsManifestUrl,
          resolution: "P1080",
          codec: "H264",
          audioCodec: "AAC",
          fps: 30,
          hdr: "SDR",
          aspectRatio: "16:9",
        },
      },
    },
    include: {
      sources: true,
    },
  });
}