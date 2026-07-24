// src/utils/stickerUtils.ts
import { Video } from "@/types/video";

export const getStickerState = (video: Video): { text: string; className: string } | null => {
  const now = new Date().getTime();
  const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
  const createdAtTime = new Date(video.createdAt).getTime();

  // RULE 1: If older than 7 days, no sticker
  if (now - createdAtTime > sevenDaysInMs) return null;

  // RULE 2: Logic for Movies
  if (!video.isTvShow) {
    return { text: "Recently Added", className: "sticker-recent" };
  }

  // RULE 3: Logic for TV Shows
  if (video.episodeDates && video.episodeDates.length > 0) {
    const latest = new Date(video.episodeDates[0]).getTime();
    
    // If only one episode exists, show "Recently Added" (Not "New Episode Added")
    if (video.episodeDates.length === 1) {
      return { text: "Recently Added", className: "sticker-recent" };
    }
    
    const prev = new Date(video.episodeDates[1]).getTime();
    const oneDayInMs = 24 * 60 * 60 * 1000;

    // Check if dates are on different days (ignoring exact ms)
    const diffDays = Math.abs(latest - prev) > oneDayInMs;

    if (diffDays) {
      // Different day: "New Episode Added" with white background
      return { text: "New Episode Added", className: "sticker-new-episode" };
    } else {
      // Same day: "Recently Added"
      return { text: "Recently Added", className: "sticker-recent" };
    }
  }

  return { text: "Recently Added", className: "sticker-recent" };
};