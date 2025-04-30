import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'diamond-diaries-media.s3.amazonaws.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  output: 'standalone', // Enable standalone output for Docker
};

export default nextConfig;
