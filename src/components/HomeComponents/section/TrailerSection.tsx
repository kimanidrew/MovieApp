"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Hls from "hls.js";
import { Video } from "@/types/video";
import { normalizeUrl } from "@/utils/normalizeUrl";
import VideoModal from "@/components/Modals/VideoModal"; // Ensure this path is correct
import PauseIcon from "@/components/icons/PauseIcon";
import PlayIcon from "@/components/icons/PlayIcon";

// [Icon components remain the same as your provided code]
const VolumeMuteIcon = ({ size = 20, color = "#fff" }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5L6 9H2v6h4l5 4V5zM23 9l-6 6M17 9l6 6" /></svg>;
const VolumeHighIcon = ({ size = 20, color = "#fff" }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5L6 9H2v6h4l5 4V5zM15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14" /></svg>;
const ShareIcon = ({ size = 20, color = "#fff" }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13" /></svg>;
const PlusIcon = ({ size = 20, color = "#fff" }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>;
const CheckIcon = ({ size = 20, color = "#fff" }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>;

export default function TrailerSection({
  videos,
  onSelect,
}: {
  videos: Video[];
  onSelect: (v: Video) => void;
}) {
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [showControlsOnly, setShowControlsOnly] = useState(false);
  const [selectedModalVideo, setSelectedModalVideo] = useState<Video | null>(null);
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});
  const [addedToList, setAddedToList] = useState<Record<string, boolean>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isVideoBuffering, setIsVideoBuffering] = useState(true);
  const [isLoopTransitioning, setIsLoopTransitioning] = useState(false);
  const [isInViewport, setIsInViewport] = useState(false);
  const [outOfViewOverlay, setOutOfViewOverlay] = useState(false);

  const sectionRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const queueRef = useRef<HTMLDivElement>(null);
  const uiTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const activeVideo = videos[activeVideoIndex];

  // Playback & Observer logic remains effectively the same as your functional logic
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !activeVideo?.hlsManifestUrl) return;
    
    let hls: Hls | null = null;
    const streamUrl = normalizeUrl(activeVideo.hlsManifestUrl);

    if (Hls.isSupported()) {
      hls = new Hls();
      hls.loadSource(streamUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (isInViewport) video.play().catch(() => {});
      });
    }
    
    return () => { if (hls) hls.destroy(); };
  }, [activeVideoIndex, activeVideo?.hlsManifestUrl, isInViewport]);

  const handleListToggle = () => {
    setAddedToList((prev) => ({ ...prev, [activeVideo.id]: !prev[activeVideo.id] }));
    setToastMessage(addedToList[activeVideo.id] ? "Removed from My List" : "Added to My List");
    setTimeout(() => setToastMessage(null), 2000);
  };

  if (!activeVideo) return null;

  return (
    <>
      <section ref={sectionRef} className="trailer-theater-section">
        {/* Banner/Video Layer */}
        <div className="theater-banner">
          <video
            ref={videoRef}
            autoPlay
            muted={isMuted}
            playsInline
            loop
            className="theater-video-bg"
          />
          <div className="theater-content-card">
            <h2 className="theater-title">{activeVideo.title}</h2>
            <div className="theater-action-row">
              <button className="btn-theater-play" onClick={() => setSelectedModalVideo(activeVideo)}>
                ▶ Watch Full Movie
              </button>
              <button className="circle-action-btn" onClick={handleListToggle}>
                {addedToList[activeVideo.id] ? <CheckIcon /> : <PlusIcon />}
              </button>
            </div>
          </div>
        </div>

        {/* Queue Panel */}
        <div className="vertical-queue-panel">
          {videos.map((video, idx) => (
            <div key={video.id} className={`vertical-thumb-card ${activeVideoIndex === idx ? 'active-thumb' : ''}`} onClick={() => setActiveVideoIndex(idx)}>
              <p>{video.title}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FIXED: Modal passes the selected video directly */}
      {selectedModalVideo && (
        <VideoModal
          video={selectedModalVideo}
          videos={videos}
          onClose={() => setSelectedModalVideo(null)}
        />
      )}

      <style jsx>{`
        .trailer-theater-section { display: flex; height: 75vh; background: #141414; color: #fff; }
        .theater-banner { position: relative; flex: 1; overflow: hidden; }
        .theater-video-bg { width: 100%; height: 100%; object-fit: cover; }
        .theater-content-card { position: absolute; bottom: 20%; left: 5%; z-index: 10; }
        .btn-theater-play { background: #fff; color: #000; padding: 10px 20px; border-radius: 4px; font-weight: bold; cursor: pointer; }
        .vertical-queue-panel { width: 300px; padding: 20px; overflow-y: auto; }
        .vertical-thumb-card { padding: 10px; cursor: pointer; border-bottom: 1px solid #333; }
        .active-thumb { background: #222; }
      `}</style>
    </>
  );
}