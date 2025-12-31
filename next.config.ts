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
    unoptimized: false,
  },
  // Temporarily disabled turbopack due to crash
  // turbopack: {
  //   root: 'c:/dev/wnct-next',
  // },
};

export default nextConfig;
