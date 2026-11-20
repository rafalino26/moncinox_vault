import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR || '.next',
  outputFileTracingRoot: process.cwd(),
  async headers() {
    return [{
      source: '/:file(sw.js|pwa-build.js)',
      headers: [
        { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
        { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
        { key: 'Service-Worker-Allowed', value: '/' },
      ],
    }];
  },
  experimental: {
    // Cache halaman dynamic di client supaya perpindahan antar tab lebih cepat (kurangi refetch server)
    staleTimes: {
      dynamic: 30,
    },
  },
};

export default nextConfig;
