import type { ReactNode } from "react";
import { createRouteMetadata } from "@/lib/route-metadata";

export const metadata = createRouteMetadata({
  title: "Enemies",
  description: "Search IdleMMO enemies by stats, locations, drops, and planning context using Zenith Companion reference data.",
  path: "/enemies",
  keywords: ["IdleMMO enemies", "IdleMMO drops", "Zenith Companion enemies"],
});

export default function EnemiesLayout({ children }: { children: ReactNode }) {
  return children;
}
