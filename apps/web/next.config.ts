import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // Monorepo: trace dependencies hoisted at repo root (Vercel / npm workspaces)
  outputFileTracingRoot: path.join(__dirname, "../.."),
};

export default nextConfig;
