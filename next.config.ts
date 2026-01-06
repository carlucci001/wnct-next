import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
  // Don't bundle firebase-admin
  serverExternalPackages: ['firebase-admin'],
  // Disable strict ESLint during builds
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Disable TypeScript errors during builds (we check separately)
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
