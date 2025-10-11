/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Important for Netlify deployment
  output: 'standalone',
  // Enable if you face module issues
  experimental: {
    esmExternals: false,
  }
}

module.exports = nextConfig