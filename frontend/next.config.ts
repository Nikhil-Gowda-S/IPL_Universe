import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Three.js is client-only; no SSR issues with dynamic imports
  reactStrictMode: true,
  // Allow cross-origin for API calls in dev
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
        ],
      },
    ];
  },
};

export default nextConfig;
