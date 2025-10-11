/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
    domains: ['img.clerk.com', 'images.clerk.dev'],
  },
  experimental: {
    esmExternals: false,
  },
  // Netlify specific
  assetPrefix: process.env.NODE_ENV === 'production' ? '' : '',
}

module.exports = nextConfig