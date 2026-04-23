import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["169.254.1.172"],
  turbopack: {
    root: process.cwd(),
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:3000/api/:path*",
      },
    ];
  },
};

export default nextConfig;
