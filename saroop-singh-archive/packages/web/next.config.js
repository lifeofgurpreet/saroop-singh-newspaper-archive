/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // typedRoutes: true, // Disabled for now
  },
  outputFileTracingRoot: __dirname,
  // Do not fail the build on ESLint errors in production builds
  eslint: {
    ignoreDuringBuilds: false,
  },
  
  // Enable ISR for better performance
  async generateBuildId() {
    return 'saroop-singh-archive-build'
  },
  images: {
    domains: ['localhost'],
    formats: ['image/avif', 'image/webp'],
    unoptimized: false,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  // Enable static exports for GitHub Pages if needed
  // output: 'export',
  // trailingSlash: true,
  // basePath: '/saroop-singh-archive',

  // Webpack config to handle markdown files
  webpack: config => {
    config.module.rules.push({
      test: /\.md$/,
      use: 'raw-loader',
    })

    return config
  },

  // Environment variables
  env: {
    SITE_NAME: 'Saroop Singh Archive',
    SITE_DESCRIPTION:
      'A digital archive documenting the athletic achievements and life of Saroop Singh',
  },

  // Redirects for SEO
  async redirects() {
    return []
  },

  // Headers for better performance
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
