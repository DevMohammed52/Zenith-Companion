import type { ReactNode } from "react";
import { createRouteMetadata } from "@/lib/route-metadata";

export const metadata = createRouteMetadata({
  title: "Combat Planner",
  description: "Review IdleMMO enemies, drops, food, kills per hour, and profile-aware combat EV in Zenith Companion.",
  path: "/combat",
  keywords: ["IdleMMO combat", "IdleMMO enemies", "Zenith Companion combat"],
});

export default function CombatLayout({ children }: { children: ReactNode }) {
  return children;
}
