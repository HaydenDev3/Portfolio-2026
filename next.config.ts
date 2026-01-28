import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Remove the experimental: { turbo: ... } block entirely */
  /* Next.js 16.x handles Turbopack automatically during dev */
  
  typescript: {
    // This ensures that even if a tiny type error remains, the build can finish
    ignoreBuildErrors: false, 
  },
};

export default nextConfig;