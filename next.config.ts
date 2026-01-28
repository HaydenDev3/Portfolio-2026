import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // !! WARN !!
    // This allows production builds to successfully complete 
    // even if your project has type errors.
    ignoreBuildErrors: true,
  }
};

export default nextConfig;