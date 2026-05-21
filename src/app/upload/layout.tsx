"use client";

import React from "react";
import Tabs from "@/components/TabComponent";
import { UploadProvider, useUploadStatus } from "@/context/UploadContext";

const tabs = [
  { label: "Upload Video", path: "/upload/storage" },
  { label: "YouTube Import", path: "/upload/youtube" },
];

// Inner wrapper component to access context hooks
function UploadLayoutContent({ children }: { children: React.ReactNode }) {
  const { isUploading, progress } = useUploadStatus();

  return (
    <div style={{ paddingTop: "6rem" }}>
      {/* Disable tabs or style them differently if uploading */}
      <div style={{ pointerEvents: isUploading ? "none" : "auto", opacity: isUploading ? 0.6 : 1 }}>
        <Tabs tabs={tabs} />
      </div>

      <div style={{ padding: "2rem" }}>
        {/* Dynamic header showing global progress updates */}
        {isUploading && (
          <div style={{ marginBottom: "1.5rem", padding: "1rem", background: "#141414", borderRadius: "8px" }}>
            <p style={{ color: "#E50914", fontWeight: "bold", margin: "0 0 0.5rem 0" }}>
              Uploading Media... {progress}%
            </p>
            <div style={{ width: "100%", background: "#333", height: "4px", borderRadius: "2px" }}>
              <div style={{ width: `${progress}%`, background: "#E50914", height: "100%", borderRadius: "2px", transition: "width 0.2s ease" }} />
            </div>
          </div>
        )}

        {children}
      </div>
    </div>
  );
}

export default function UploadLayout({ children }: { children: React.ReactNode }) {
  return (
    <UploadProvider>
      <UploadLayoutContent>{children}</UploadLayoutContent>
    </UploadProvider>
  );
}
