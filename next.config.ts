import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // Tauri runs a full Next.js server, not static export
  // No output: "export", keep as standard server mode
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
};

export default nextConfig;

