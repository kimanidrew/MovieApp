"use client";

import React, { useState } from "react";
import { Video } from "@/types/video";
import HeroSection from "./HeroSection";
import { ContentRenderer } from "./ContentRenderer";
import VideoModal from "@/components/VideoModal";
import { useVideoHistory } from "@/hooks/useVideoHistory";

export default function HomeClient({
  initialVideos,
}: {
  initialVideos: Video[];
}) {
  const { isContinueWatching } = useVideoHistory();
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  const heroVideo = initialVideos[0];

  return (
    <main>
      {heroVideo && (
        <HeroSection
          heroVideo={heroVideo}
          isContinueWatching={isContinueWatching}
          onOpen={setSelectedVideo}
        />
      )}

      <ContentRenderer videos={initialVideos} onSelect={setSelectedVideo} />

      {selectedVideo && (
        <VideoModal
          video={selectedVideo}
          onClose={() => setSelectedVideo(null)}
        />
      )}
    </main>
  );
}
