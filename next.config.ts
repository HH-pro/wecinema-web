import type { NextConfig } from "next";
import path from "node:path";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:3000";
const isProd = process.env.NODE_ENV === "production";

/**
 * Security headers applied to every response.
 *
 * Notes:
 * - HSTS is `production` only — sending it in dev would lock localhost to HTTPS.
 * - CSP is omitted here intentionally. next/script + next/font + Turbopack HMR
 *   all need `unsafe-inline`/`unsafe-eval` in dev, and a real CSP needs to be
 *   per-route with nonces. Add it via proxy when ready.
 */
const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(self), geolocation=(), interest-cohort=()",
  },
  ...(isProd
    ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]
    : []),
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  compress: true,

  turbopack: {
    root: path.join(__dirname),
  },

  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${BACKEND_URL}/:path*`,
      },
    ];
  },

  async headers() {
    // Note: Next.js sets `Cache-Control: public, max-age=31536000, immutable`
    // on /_next/static/* by itself — we intentionally don't override it here.
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        // Disable reverse-proxy (nginx) response buffering so the App Router's
        // streamed Suspense boundaries (the homepage galleries) reach the
        // browser progressively instead of all at once. Harmless on routes that
        // don't stream. See Next.js "Streaming → Reverse proxies".
        source: "/:path*",
        headers: [{ key: "X-Accel-Buffering", value: "no" }],
      },
    ];
  },

  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24, // 1 day
    remotePatterns: [
      { protocol: "https", hostname: "*.amazonaws.com" },
      { protocol: "https", hostname: "*.s3.amazonaws.com" },
      { protocol: "https", hostname: "*.s3.us-east-2.amazonaws.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "wecinema.co" },
      { protocol: "https", hostname: "*.wecinema.co" },
      { protocol: "https", hostname: "secure.gravatar.com" },
      { protocol: "https", hostname: "*.gravatar.com" },
    ],
  },
};

export default nextConfig;
