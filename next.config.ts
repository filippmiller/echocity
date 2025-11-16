import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  /* config options here */
  // Exclude scripts from build
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      }
    }
    return config
  },
  // Exclude scripts directory from TypeScript compilation
  typescript: {
    ignoreBuildErrors: false,
  },
}

export default nextConfig

