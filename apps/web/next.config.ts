import { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: { taint: true },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
    minimumCacheTTL: 31536000,
  },
  transpilePackages: ["ui", "utils"],
}

export default nextConfig