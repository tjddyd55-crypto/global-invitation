const path = require('path')

const remotePatterns = [
  {
    protocol: 'https',
    hostname: '**.r2.dev',
    pathname: '/**',
  },
  {
    protocol: 'https',
    hostname: '**.r2.cloudflarestorage.com',
    pathname: '/**',
  },
  {
    protocol: 'https',
    hostname: 'pub-5b2e66f46a5e403fbc9567b2772378be.r2.dev',
    pathname: '/**',
  },
]

try {
  const u = process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL && new URL(process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL)
  if (u && u.hostname) {
    remotePatterns.push({ protocol: 'https', hostname: u.hostname, pathname: '/**' })
  }
} catch (_) {
  /* optional env at build time */
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns,
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@': path.resolve(__dirname),
    }
    return config
  },
}

module.exports = nextConfig
