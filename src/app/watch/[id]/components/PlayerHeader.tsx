"use client";

import { useRouter } from "next/navigation";

interface Props {
  title: string;
  showControls: boolean;
}

export default function PlayerHeader({
  title,
  showControls
}: Props) {
  const router = useRouter();

  return (
    <div className={`netflix-header ${showControls ? 'visible' : ''}`}>
      <button
        onClick={() => router.back()}
        className="back-button hover-scale"
      >
        <svg width="32" height="32" viewBox="0 0 24 24">
          <path
            d="M19 12H5m7 7l-7-7 7-7"
            stroke="currentColor"
            strokeWidth="2.5"
            fill="none"
          />
        </svg>
      </button>

      <h2 className="header-title">{title}</h2>
    </div>
  );
}