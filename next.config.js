/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Add these for Vercel
  experimental: {
    serverComponentsExternalPackages: ['@clerk/nextjs'],
  },
  // Handle trailing slashes
  trailingSlash: false,
  // Enable SWC minification
  swcMinify: true,
}

module.exports = nextConfig