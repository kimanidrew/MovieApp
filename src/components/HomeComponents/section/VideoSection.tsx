"use client";

import VideoRow from "@/components/VideoRow";
import { Video } from "@/types/video";

export default function VideoSection({
  title,
  videos,
}: {
  title: string;
  videos: Video[];
}) {
  // Sanitize data: Ensure thumbnailUrl is null if undefined
  const sanitizedVideos: Video[] = videos.map((v) => ({
    ...v,
    thumbnailUrl: v.thumbnailUrl ?? null,
    description: v.description ?? null,
    videoUrl: v.videoUrl ?? null,
    hlsManifestUrl: v.hlsManifestUrl ?? null,
    releaseYear: v.releaseYear ?? null,
  }));

  return <VideoRow title={title} videos={sanitizedVideos} />;
}