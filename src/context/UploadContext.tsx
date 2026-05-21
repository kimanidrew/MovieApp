"use client";

import React, { createContext, useContext, useState } from "react";

interface UploadContextType {
  isUploading: boolean;
  progress: number;
  setIsUploading: (state: boolean) => void;
  setProgress: (pct: number) => void;
}

const UploadContext = createContext<UploadContextType | undefined>(undefined);

export function UploadProvider({ children }: { children: React.ReactNode }) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  return (
    <UploadContext.Provider value={{ isUploading, progress, setIsUploading, setProgress }}>
      {children}
    </UploadContext.Provider>
  );
}

export function useUploadStatus() {
  const context = useContext(UploadContext);
  if (!context) throw new Error("useUploadStatus must be used within an UploadProvider");
  return context;
}
