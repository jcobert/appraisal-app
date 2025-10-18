import { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [],
    minimumCacheTTL: 31536000,
  },
  transpilePackages: ['@repo/ui', '@repo/utils', '@repo/types'],
}

export default nextConfig
