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
  // Redirect old Joomla URLs to homepage
  async redirects() {
    return [
      {
        source: '/index.php',
        destination: '/',
        permanent: true, // 301 redirect
      },
      {
        source: '/component/:path*',
        destination: '/',
        permanent: true,
      },
      {
        source: '/content/:path*',
        destination: '/',
        permanent: true,
      },
      {
        source: '/:path*.html',
        destination: '/',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
