/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Fix for Supabase Edge Runtime
  experimental: {
    esmExternals: 'loose'
  },
  webpack: (config) => {
    config.externals.push({
      'utf-8-validate': 'commonjs utf-8-validate',
      'bufferutil': 'commonjs bufferutil',
    })
    
    // Fix for the missing module
    config.resolve.fallback = {
      ...config.resolve.fallback,
      'tw-animate-css': false,
    }
    
    return config
  },
}

module.exports = nextConfig