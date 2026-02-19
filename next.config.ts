import type { NextConfig } from "next";

const estimateBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
const processBaseUrl =
  process.env.NEXT_PUBLIC_PROCESS_API_BASE_URL || estimateBaseUrl;

const nextConfig: NextConfig = {
  async rewrites() {
    if (!estimateBaseUrl && !processBaseUrl) {
      return [];
    }

    const rewrites = [] as Array<{ source: string; destination: string }>;
    if (processBaseUrl) {
      const target = processBaseUrl.replace(/\/$/, "");
      rewrites.push({
        source: "/api/process",
        destination: `${target}/api/process`,
      });
    }
    if (estimateBaseUrl) {
      const target = estimateBaseUrl.replace(/\/$/, "");
      rewrites.push({
        source: "/api/estimate",
        destination: `${target}/api/estimate`,
      });
    }
    return rewrites;
  },
};

export default nextConfig;
