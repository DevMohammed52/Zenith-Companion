import type { MetadataRoute } from "next";

const routes = [
  "",
  "/profiles",
  "/guilds",
  "/conquest",
  "/items",
  "/enemies",
  "/pets",
  "/pets/owned",
  "/pets/compare",
  "/museum",
  "/market-alerts",
  "/skill-profit",
  "/alchemy",
  "/alchemy/mythic",
  "/crafting",
  "/forge",
  "/bis",
  "/bosses",
  "/combat",
  "/dungeons",
  "/weather",
  "/map",
  "/housing",
  "/lore",
  "/settings",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return routes.map((route) => ({
    url: `https://zenith-companion.vercel.app${route}`,
    lastModified: now,
    changeFrequency: route === "" ? "daily" : "weekly",
    priority: route === "" ? 1 : route === "/profiles" ? 0.9 : 0.7,
  }));
}
