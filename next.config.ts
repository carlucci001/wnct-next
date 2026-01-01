import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
    unoptimized: true,  // Bypass Next.js image optimization - load directly from source
  },
  // Temporarily disabled turbopack due to crash
  // turbopack: {
  //   root: 'c:/dev/wnct-next',
  // },
};

export default nextConfig;
