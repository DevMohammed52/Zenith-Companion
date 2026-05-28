import type { ReactNode } from "react";
import { createRouteMetadata } from "@/lib/route-metadata";

export const metadata = createRouteMetadata({
  title: "Lore Archive",
  description: "Explore IdleMMO item lore, descriptions, reference links, and archive-style discovery tools.",
  path: "/lore",
  keywords: ["IdleMMO lore", "IdleMMO item descriptions", "Zenith Companion lore"],
});

export default function LoreLayout({ children }: { children: ReactNode }) {
  return children;
}
