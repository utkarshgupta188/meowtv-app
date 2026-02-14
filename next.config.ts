import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // Keep server mode for dynamic API routes (/api/proxy, /api/hls)
  // Tauri will connect to devUrl: http://localhost:3000
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
};

export default nextConfig;

