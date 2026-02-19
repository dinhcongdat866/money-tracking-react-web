import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true, // Temporarily ignore TS errors for metrics collection
  },
  eslint: {
    ignoreDuringBuilds: true, // Temporarily ignore ESLint errors for metrics collection
  },
};

export default nextConfig;
