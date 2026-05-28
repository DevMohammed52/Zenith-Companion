import type { ReactNode } from "react";
import { createRouteMetadata } from "@/lib/route-metadata";

export const metadata = createRouteMetadata({
  title: "World Boss Planner",
  description: "Plan IdleMMO world boss routes, travel timing, teleport choices, and reward decisions with profile-aware tools.",
  path: "/bosses",
  keywords: ["IdleMMO world bosses", "IdleMMO boss route", "Zenith Companion bosses"],
});

export default function BossesLayout({ children }: { children: ReactNode }) {
  return children;
}
