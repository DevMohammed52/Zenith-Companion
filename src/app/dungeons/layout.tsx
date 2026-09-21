import type { ReactNode } from "react";
import { createRouteMetadata } from "@/lib/route-metadata";

export const metadata = createRouteMetadata({
  title: "IdleMMO Dungeon Drops & EV",
  description: "Explore IdleMMO dungeon requirements, monsters, drops, entry costs, shards, and EV in Zenith Companion.",
  path: "/dungeons",
  keywords: ["IdleMMO dungeons", "IdleMMO dungeon drops", "Zenith Companion dungeons", "IdleMMO dungeon guide"],
});

export default function DungeonsLayout({ children }: { children: ReactNode }) {
  return children;
}
