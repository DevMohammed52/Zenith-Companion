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
  "/skill-profit",
  "/alchemy",
  "/alchemy/mythic",
  "/crafting",
  "/forge",
  "/forge/lessons",
  "/forge/craft",
  "/bis",
  "/bosses",
  "/dungeons",
  "/weather",
  "/map",
  "/housing",
  "/lore",
  "/patch-notes",
  "/whats-new",
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
