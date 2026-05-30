import type { NextConfig } from "next";

const scriptSources = [
  "'self'",
  "'unsafe-inline'",
  ...(process.env.NODE_ENV === "production" ? [] : ["'unsafe-eval'"]),
  "https://challenges.cloudflare.com",
].join(" ");

const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src ${scriptSources}`,
  "script-src-attr 'none'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://cdn.idle-mmo.com https://challenges.cloudflare.com",
  "font-src 'self' data:",
  "connect-src 'self' https://challenges.cloudflare.com",
  "frame-src https://challenges.cloudflare.com",
  "child-src https://challenges.cloudflare.com",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "media-src 'self' data: blob:",
  "base-uri 'self'",
  "object-src 'none'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=(), bluetooth=()",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "Content-Security-Policy",
    value: contentSecurityPolicy,
  },
];

const noIndexDataHeaders = [
  {
    key: "X-Robots-Tag",
    value: "noindex, nofollow",
  },
];

const longLivedDataHeaders = [
  {
    key: "Cache-Control",
    value: "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
  },
  ...noIndexDataHeaders,
];

const revalidatedAssetHeaders = [
  {
    key: "Cache-Control",
    value: "no-cache, max-age=0, must-revalidate",
  },
  ...noIndexDataHeaders,
];

const nextConfig: NextConfig = {
  /* config options here */
  devIndicators: false,
  poweredByHeader: false,
  allowedDevOrigins: ["192.168.31.72", "127.0.0.1"],
  images: {
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.idle-mmo.com",
        pathname: "/cdn-cgi/image/**",
      },
      {
        protocol: "https",
        hostname: "cdn.idle-mmo.com",
        pathname: "/global/**",
      },
      {
        protocol: "https",
        hostname: "cdn.idle-mmo.com",
        pathname: "/skins/**",
      },
      {
        protocol: "https",
        hostname: "cdn.idle-mmo.com",
        pathname: "/uploaded/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        source: "/:path(.*\\.json)",
        headers: noIndexDataHeaders,
      },
      {
        source: "/:path((?:global-search-index|guild-search-index|guild-list|usage-map|search-index|all-items-db|static-data|world-locations|gear-data|guild-database|pet-database|conquest-data|idlemmo-patch-notes)\\.json)",
        headers: longLivedDataHeaders,
      },
      {
        source: "/offline-cache-manifest.json",
        headers: revalidatedAssetHeaders,
      },
      {
        source: "/sw.js",
        headers: revalidatedAssetHeaders,
      },
      {
        source: "/manifest.webmanifest",
        headers: longLivedDataHeaders,
      },
      {
        source: "/guild-details/:path*.json",
        headers: longLivedDataHeaders,
      },
      {
        source: "/market-data.json",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=60, s-maxage=300, must-revalidate",
          },
          ...noIndexDataHeaders,
        ],
      },
      {
        source: "/scraper-status.json",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store",
          },
          ...noIndexDataHeaders,
        ],
      },
    ];
  },
};

export default nextConfig;
