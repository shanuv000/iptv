import type { NextConfig } from "next";
// @ts-expect-error - next-pwa doesn't have type definitions
import withPWA from "next-pwa";

const nextConfig: NextConfig = {
  // Tell Next.js to handle Turbopack + webpack configs
  turbopack: {},

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.jio.com' },
      { protocol: 'https', hostname: 'i.imgur.com' },
      { protocol: 'https', hostname: 'upload.wikimedia.org' },
      { protocol: 'https', hostname: '**.cloudfront.net' },
      { protocol: 'https', hostname: '**.streamready.in' },
      { protocol: 'https', hostname: '**.googleapis.com' },
      { protocol: 'https', hostname: '**.s3.eu-west-1.amazonaws.com' },
      { protocol: 'https', hostname: 'www.lyngsat.com' },
      { protocol: 'https', hostname: '**.oraclecloud.com' },
      { protocol: 'https', hostname: '**' },
    ],
  },
};

// PWA Configuration
const pwaConfig = withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/iptv-org\.github\.io\/.*$/i,
      handler: "NetworkFirst",
      options: {
        cacheName: "iptv-playlist-cache",
        expiration: {
          maxEntries: 10,
          maxAgeSeconds: 60 * 60, // 1 hour
        },
      },
    },
    {
      urlPattern: /^https:\/\/.*\.(png|jpg|jpeg|svg|gif|webp)$/i,
      handler: "CacheFirst",
      options: {
        cacheName: "image-cache",
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24 * 7, // 1 week
        },
      },
    },
  ],
});

export default pwaConfig(nextConfig);
