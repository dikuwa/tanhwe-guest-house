import type { NextConfig } from "next";

const r2PublicUrl = process.env.R2_PUBLIC_URL ? new URL(process.env.R2_PUBLIC_URL) : null;
const r2LegacyPublicUrl = process.env.R2_LEGACY_PUBLIC_URL
  ? new URL(process.env.R2_LEGACY_PUBLIC_URL)
  : null;

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: r2PublicUrl
    ? {
        remotePatterns: [r2PublicUrl, r2LegacyPublicUrl]
          .filter((value): value is URL => Boolean(value))
          .map((value) => ({
            protocol: value.protocol.replace(":", "") as "http" | "https",
            hostname: value.hostname,
            pathname: `${value.pathname}**`,
          })),
      }
    : undefined,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          ...(process.env.NODE_ENV === "production"
            ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }]
            : []),
        ],
      },
    ];
  },
};

export default nextConfig;
