/** @type {import('next').NextConfig} */
const nextConfig = {
  // This reduces the memory footprint of the compiler
  experimental: {
    turbo: {
      memoryLimit: 2048, // Limits Turbopack to 2GB
    },
  },
  // Disables heavy source maps in dev which saves massive amounts of RAM
  productionBrowserSourceMaps: false,
};

export default nextConfig;