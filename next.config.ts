import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Cache halaman dynamic di client supaya perpindahan antar tab lebih cepat (kurangi refetch server)
    staleTimes: {
      dynamic: 30,
    },
  },
};

export default nextConfig;
