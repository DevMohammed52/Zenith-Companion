import type { ReactNode } from "react";
import { createRouteMetadata } from "@/lib/route-metadata";

export const metadata = createRouteMetadata({
  title: "Combat Planner",
  description: "Review IdleMMO enemies, drops, food, hunt context, and combat planning signals in a profile-friendly combat workspace.",
  path: "/combat",
  keywords: ["IdleMMO combat", "IdleMMO enemies", "Zenith Companion combat"],
});

export default function CombatLayout({ children }: { children: ReactNode }) {
  return children;
}
