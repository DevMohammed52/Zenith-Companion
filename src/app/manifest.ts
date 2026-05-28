import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Zenith Companion",
    short_name: "Zenith",
    description:
      "Tools for IdleMMO players to check prices, plan profiles, compare pets, track guilds, and find useful routes.",
    id: "/",
    lang: "en",
    start_url: "/",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    background_color: "#05070d",
    theme_color: "#05070d",
    categories: ["games", "utilities", "productivity"],
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    screenshots: [
      {
        src: "/pwa/screenshots/items-wide.png",
        sizes: "1280x720",
        type: "image/png",
        form_factor: "wide",
        label: "Search IdleMMO items and market data",
      },
      {
        src: "/pwa/screenshots/skill-profit-narrow.png",
        sizes: "390x844",
        type: "image/png",
        form_factor: "narrow",
        label: "Plan crafting and skill profit on mobile",
      },
    ],
    shortcuts: [
      {
        name: "Items Database",
        short_name: "Items",
        description: "Search items, prices, locations, and usage signals.",
        url: "/items",
        icons: [{ src: "/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Skill Profit",
        short_name: "Profit",
        description: "Compare craft profit, prices, and material requirements.",
        url: "/skill-profit",
        icons: [{ src: "/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Profiles",
        short_name: "Profiles",
        description: "Manage local profiles and optional imports.",
        url: "/profiles",
        icons: [{ src: "/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "World Bosses",
        short_name: "Bosses",
        description: "Check boss timers and route planning tools.",
        url: "/bosses",
        icons: [{ src: "/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
    ],
  };
}
