import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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

export default nextConfig;
