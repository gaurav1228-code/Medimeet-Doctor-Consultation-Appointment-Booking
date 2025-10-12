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
  // Remove output: 'export' for Netlify
  // output: 'export', // REMOVED FOR NETLIFY
}

module.exports = nextConfig