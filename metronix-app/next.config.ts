import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  turbopack: {
    // Fix workspace root detection
    root: __dirname,
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
  // Fix for React Server Components bundler issues
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    return config;
  },
  // Ensure proper module resolution
  transpilePackages: ['lucide-react'],
  // Fix for workspace root detection
  output: 'standalone',
  // Disable React strict mode to prevent double rendering issues
  reactStrictMode: false,
  // Improve error handling
  serverExternalPackages: [],
  // Fix for React Server Components streaming issues
  experimental: {
    // Remove deprecated serverComponentsExternalPackages
    // serverComponentsExternalPackages: [],
  },
  // Optimize for streaming
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  // Fix for hydration issues
  generateEtags: false,
};

export default nextConfig;
