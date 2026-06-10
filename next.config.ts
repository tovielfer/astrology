import type { NextConfig } from "next";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL(".", import.meta.url));

const nextConfig: NextConfig = {
  outputFileTracingRoot: projectRoot,
  serverExternalPackages: ["pdf-parse", "puppeteer", "puppeteer-core", "@sparticuz/chromium"],
};

export default nextConfig;
