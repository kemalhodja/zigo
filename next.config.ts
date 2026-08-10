import type { NextConfig } from "next";

import { buildSecurityHeaders } from "./src/lib/server/security-headers";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone",
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  async headers() {
    const securityHeaders = buildSecurityHeaders(process.env.NODE_ENV === "production");
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
  async redirects() {
    return [
      { source: "/reels", destination: "/micro", permanent: true },
      { source: "/reels/:path*", destination: "/micro/:path*", permanent: true },
      { source: "/stories", destination: "/sparks", permanent: true },
      { source: "/stories/:path*", destination: "/sparks/:path*", permanent: true },
    ];
  },
  experimental: {
    optimizePackageImports: ["@supabase/supabase-js", "lucide-react"],
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
      {
        protocol: "https",
        hostname: "**.googleusercontent.com",
      },
    ],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
};

function withOptionalBundleAnalyzer(config: NextConfig): NextConfig {
  if (process.env.ANALYZE !== "true") return config;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const bundleAnalyzer = require("@next/bundle-analyzer").default;
    return bundleAnalyzer({ enabled: true })(config);
  } catch {
    console.warn("ANALYZE=true but @next/bundle-analyzer is not installed; continuing without analyzer.");
    return config;
  }
}

import { withSentryConfig } from "@sentry/nextjs";

export default withSentryConfig(
  withOptionalBundleAnalyzer(nextConfig),
  {
    silent: true,
    org: "zigo-education",
    project: "zigo-web",
    widenClientFileUpload: true,
    transpileClientSDK: true,
    tunnelRoute: "/monitoring",
    hideSourceMaps: true,
    disableLogger: true,
  }
);
