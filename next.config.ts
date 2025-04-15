import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    // Add remotePatterns to further enforce security and improve handling of Google images
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  output: 'standalone', // Enable standalone output for Docker
};

export default nextConfig;
