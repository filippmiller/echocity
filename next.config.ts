import type { NextConfig } from 'next'
import path from 'node:path'

// Wrap with Sentry only when the package is installed. This lets the app
// build and run without a real DSN or Sentry project being configured.
let withSentryConfig: ((config: NextConfig) => NextConfig) | undefined
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const sentry = require('@sentry/nextjs')
  withSentryConfig = sentry.withSentryConfig
} catch {
  // Sentry is optional; instrumentation is skipped if the package is missing.
}

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  async headers() {
    return [{
      source: '/(.*)',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
        { key: 'X-DNS-Prefetch-Control', value: 'on' },
        { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
      ],
    }]
  },
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

const config = withSentryConfig ? withSentryConfig(nextConfig) : nextConfig

export default config

