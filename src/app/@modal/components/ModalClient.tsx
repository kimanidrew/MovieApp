"use client";

import { useRouter } from "next/navigation";
import VideoModal from "./VideoModal";
import { Video } from "@/types/video";

interface ModalClientProps {
  video: Video;
  allVideos: Video[];
  type: "show" | "movie"; // Added type definition
}

export default function ModalClient({ video, allVideos, type }: ModalClientProps) {
  const router = useRouter();

  return (
    <VideoModal 
      video={video} 
      videos={allVideos} 
      onClose={() => router.back()} 
      type={type} // Pass the prop through
    />
  );
}