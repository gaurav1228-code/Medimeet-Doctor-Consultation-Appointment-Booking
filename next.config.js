/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@clerk/nextjs'],
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: true, // Temporarily disable ESLint during build
  },
  images: {
    domains: ['images.clerk.dev', 'img.clerk.com'],
  },
  // Add this to handle dynamic server usage
  output: 'standalone', // Better for Vercel deployment
}

module.exports = nextConfig