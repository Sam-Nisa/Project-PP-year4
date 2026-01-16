/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Whitelist domains
    domains: ['lh3.googleusercontent.com', 'localhost'],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/webp'], // Use WebP format for better compression
    minimumCacheTTL: 60,
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/storage/**',
      },
      {
        protocol: 'https',
        hostname: '**',
        pathname: '**',
      },
    ],
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      debug: false, // ignore debug module
    };
    return config;
  },
  // Enable compression
  compress: true,
  // Optimize production builds
  swcMinify: true,
};

module.exports = nextConfig;
