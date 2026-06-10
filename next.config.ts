import type { NextConfig } from "next";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL(".", import.meta.url));

const nextConfig: NextConfig = {
  outputFileTracingRoot: projectRoot,
  serverExternalPackages: ["pdf-parse", "@react-pdf/renderer"],
  outputFileTracingIncludes: {
    "/api/report/generate": ["./src/lib/fonts/**"],
  },
};

export default nextConfig;
