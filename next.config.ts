import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // Enable static export for standalone Tauri builds (Production only)
  // In dev, we use standard mode to allow dynamic routes to work without strict static params
  output: process.env.NODE_ENV === 'production' ? 'export' : undefined,
  // Required for Tauri app to work with client-side routing
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  // Ensure proper base path handling
  basePath: '',
  assetPrefix: '',
};

export default nextConfig;

