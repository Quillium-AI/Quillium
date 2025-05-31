import { NextConfig } from 'next';

const nextConfig: NextConfig = {
  env: {
    // Server-side environment variables
    BACKEND_URL: process.env.BACKEND_URL || 'http://backend:8080',
  },
  // Enable WebSocket support and exclude binary modules
  webpack: (config) => {
    config.experiments = { ...config.experiments, topLevelAwait: true };
    // These packages are for binary WebSocket capabilities
    config.externals = [...(config.externals || []), 'bufferutil', 'utf-8-validate'];
    return config;
  },
  // Socket.IO requires special rewrites setup
  async rewrites() {
    return {
      beforeFiles: [
        // Route Socket.IO requests to our API handler
        {
          source: '/socket.io/:path*',
          destination: '/api/ws',
        }
      ],
      afterFiles: [
        // Handle all other API routes
        {
          source: '/api/:path*',
          destination: '/api/:path*',
        }
      ],
      fallback: []
    };
  },
  // External packages for server components
  serverExternalPackages: ['socket.io', 'socket.io-client', 'ws'],
  // Important for WebSocket support
  poweredByHeader: false,
};

export default nextConfig;
