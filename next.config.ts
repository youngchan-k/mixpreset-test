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
      },
      {
        protocol: 'https',
        hostname: 'mixpreset-preset.s3.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 'mixpreset-preset.s3.us-east-1.amazonaws.com',
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
  // Add other configuration options as needed
};

export default nextConfig;