/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // REMOVE output: 'export' - this is causing the build to fail
  images: {
    unoptimized: true,
    domains: ['img.clerk.com', 'images.clerk.dev'],
  },
  // Remove experimental config if not needed
}

module.exports = nextConfig