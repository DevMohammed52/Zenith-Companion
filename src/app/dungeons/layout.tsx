import type { ReactNode } from "react";
import { createRouteMetadata } from "@/lib/route-metadata";

export const metadata = createRouteMetadata({
  title: "Dungeons",
  description: "Explore IdleMMO dungeon requirements, monsters, drops, entry costs, shards, and EV in Zenith Companion.",
  path: "/dungeons",
  keywords: ["IdleMMO dungeons", "IdleMMO dungeon drops", "Zenith Companion dungeons"],
});

export default function DungeonsLayout({ children }: { children: ReactNode }) {
  return children;
}
