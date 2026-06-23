import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Unsplash（Mock 資料封面圖）
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      // Spotify CDN（專輯封面）
      {
        protocol: "https",
        hostname: "i.scdn.co",
      },
      {
        protocol: "https",
        hostname: "*.scdn.co",
      },
      // Google（用戶頭像）
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      // Spotify 用戶頭像
      {
        protocol: "https",
        hostname: "*.spotifycdn.com",
      },
    ],
  },
  serverExternalPackages: ["node-cron"],
  allowedDevOrigins: ["127.0.0.1", "localhost"],
};

export default nextConfig;
