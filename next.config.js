/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
    domains: ['img.clerk.com', 'images.clerk.dev'],
  },
  trailingSlash: false,
  // Important for Netlify
  output: 'export',
  distDir: 'out',
}

module.exports = nextConfig