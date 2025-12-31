/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Whitelist domains
    domains: ['lh3.googleusercontent.com', 'localhost'],
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
};

module.exports = nextConfig;
