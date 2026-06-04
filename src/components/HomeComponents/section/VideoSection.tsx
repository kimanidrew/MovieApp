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
  return <VideoRow title={title} videos={videos} />;
}
