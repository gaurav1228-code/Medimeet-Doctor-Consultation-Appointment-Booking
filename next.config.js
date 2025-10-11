/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  output: 'standalone',
  images: {
    unoptimized: true,
    domains: ['img.clerk.com', 'images.clerk.dev'],
  },
  experimental: {
    esmExternals: false,
  }
}

module.exports = nextConfig