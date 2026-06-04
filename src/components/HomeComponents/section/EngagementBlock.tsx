"use client";

import React from "react";
import { Video } from "@/types/video";
import FeatureRow from "@/components/FeatureRow";

export default function EngagementBlock({
  title,
  videos,
  onSelect,
}: {
  title: string;
  videos: Video[];
  onSelect: (v: Video) => void;
}) {
  return (
    <>
      <div className="engagement-direct-track">
        <FeatureRow title={title} videos={videos} />
      </div>

      <style>{`
        .engagement-direct-track {
          width: 100%;
          box-sizing: border-box;
          margin: 1rem 0;
          overflow: visible;
        }

        .engagement-direct-track :global(.feature-row-title) {
          display: flex;
          align-items: center;
          gap: 10px;
          text-shadow: 0 2px 10px rgba(255, 255, 255, 0.05);
        }
      `}</style>
    </>
  );
}
