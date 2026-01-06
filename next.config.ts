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
  // Don't bundle firebase-admin (fixes Turbopack symlink issue on Windows)
  serverExternalPackages: ['firebase-admin'],
  // Disable Turbopack for builds on Windows (symlink permission issue)
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
