import type { NextConfig } from "next";

import { buildSecurityHeaders } from "./src/lib/server/security-headers";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
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

export default withOptionalBundleAnalyzer(nextConfig);
