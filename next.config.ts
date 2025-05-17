import { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'preset.mixpreset.com',
      }
    ],
    formats: ['image/webp'],
    minimumCacheTTL: 60,
  },
  // Add configuration for SVG files
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack']
    });
    return config;
  },
  // Add environment variables that should be available on both client and server
  env: {
    NEXT_PUBLIC_PRESET_S3_URL: process.env.NEXT_PUBLIC_PRESET_S3_URL || 'preset.mixpreset.com',
  },
  // Add other configuration options as needed
};

export default nextConfig;