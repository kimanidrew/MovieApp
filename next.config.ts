import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fix for ffmpeg and other binary-heavy packages
  serverExternalPackages: ["@ffmpeg-installer/ffmpeg", "fluent-ffmpeg"],
  images: {
  remotePatterns: [
    {
      protocol: "https",
      hostname: "**.r2.dev",
    },
    {
      protocol: "https",
      hostname: "**.cloudflarestorage.com",
    },
    {
      protocol: "https",
      hostname: "cdn.movieflix.com",
    },
    {
      protocol: "https",
      hostname: "i.ytimg.com",
    }
  ],
},
};

export default nextConfig;
