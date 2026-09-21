import type { ReactNode } from "react";
import { createRouteMetadata } from "@/lib/route-metadata";

export const metadata = createRouteMetadata({
  title: "IdleMMO Enemy Database",
  description: "Search IdleMMO enemies by stats, locations, drops, levels, and weather behavior.",
  path: "/enemies",
  keywords: ["IdleMMO enemies", "IdleMMO enemy drops", "Zenith Companion enemies", "IdleMMO enemy database"],
});

export default function EnemiesLayout({ children }: { children: ReactNode }) {
  return children;
}
