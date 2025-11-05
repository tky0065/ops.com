import type { NextConfig } from "next";
import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  compress: true,

  // Optimizations
  poweredByHeader: false,

  // Enable standalone output for Docker production builds
  output: 'standalone',

  // Already enabled by default in Next.js 16
  // swcMinify: true,
};

export default withBundleAnalyzer(nextConfig);
