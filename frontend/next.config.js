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

function resolveAdminApiProxyTarget() {
  const raw =
    process.env.ADMIN_API_PROXY_TARGET?.trim() ||
    process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_BACKEND_URL?.trim() ||
    ''
  if (!raw) return null
  try {
    const url = new URL(raw)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
    return url.origin
  } catch {
    return null
  }
}

function resolveApiProxyTarget() {
  const raw =
    process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_BACKEND_URL?.trim() ||
    process.env.NEXT_PUBLIC_API_URL?.trim() ||
    ''
  if (!raw) return null
  try {
    const url = new URL(raw)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
    return url.origin
  } catch {
    return null
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns,
  },
  async rewrites() {
    const adminOrigin = resolveAdminApiProxyTarget()
    const apiOrigin = resolveApiProxyTarget()
    const rules = []
    if (adminOrigin) {
      rules.push({
        source: '/api/admin/:path*',
        destination: `${adminOrigin}/api/admin/:path*`,
      })
    }
    if (apiOrigin) {
      rules.push({ source: '/api/:path*', destination: `${apiOrigin}/api/:path*` })
    }
    return rules
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
