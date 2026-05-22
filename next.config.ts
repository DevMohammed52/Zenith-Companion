import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  devIndicators: false,
  allowedDevOrigins: ["192.168.31.72", "127.0.0.1"],
  async headers() {
    return [
      {
        source: "/:path((?:global-search-index|guild-search-index|guild-list|usage-map|search-index|all-items-db|static-data|world-locations|gear-data|guild-database)\\.json)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
          },
        ],
      },
      {
        source: "/guild-details/:path*.json",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
          },
        ],
      },
      {
        source: "/market-data.json",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=60, s-maxage=300, must-revalidate",
          },
        ],
      },
      {
        source: "/scraper-status.json",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
