import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fix for ffmpeg and other binary-heavy packages
  serverExternalPackages: ["@ffmpeg-installer/ffmpeg", "fluent-ffmpeg"],
};

export default nextConfig;
