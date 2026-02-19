import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  productionBrowserSourceMaps: true,
  experimental: {
    serverSourceMaps: true,
  },
};

export default nextConfig;
