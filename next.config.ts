import type { NextConfig } from "next";

const estimateBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
const processBaseUrl =
  process.env.NEXT_PUBLIC_PROCESS_API_BASE_URL || estimateBaseUrl;

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-XSS-Protection", value: "0" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  },
];

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "bcryptjs",
    "pg",
    "jsonwebtoken",
    "formidable",
    "mammoth",
    "pdf-parse",
  ],
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  async rewrites() {
    if (!estimateBaseUrl && !processBaseUrl) {
      return [];
    }

    const rewrites = [] as Array<{ source: string; destination: string }>;
    if (processBaseUrl) {
      const target = processBaseUrl.replace(/\/$/, "");
      rewrites.push({
        source: "/api/auth/:path*",
        destination: `${target}/api/auth/:path*`,
      });
      rewrites.push({
        source: "/api/tokens/:path*",
        destination: `${target}/api/tokens/:path*`,
      });
      rewrites.push({
        source: "/api/process",
        destination: `${target}/api/process`,
      });
      rewrites.push({
        source: "/api/upload",
        destination: `${target}/api/upload`,
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
