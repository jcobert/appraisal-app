import { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: { taint: true },
  images: {
    remotePatterns: [],
    minimumCacheTTL: 31536000,
  },
  rewrites: async () => [
    { source: '/healthz', destination: '/api/health' },
    { source: '/api/healthz', destination: '/api/health' },
    { source: '/health', destination: '/api/health' },
    { source: '/ping', destination: '/api/health' },
  ],
}

export default nextConfig
