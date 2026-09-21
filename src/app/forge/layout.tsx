import type { ReactNode } from "react";
import { createRouteMetadata } from "@/lib/route-metadata";

export const metadata = createRouteMetadata({
  title: "IdleMMO Forge Planner",
  description: "Plan IdleMMO forge upgrades and material needs with market-aware, profile-local calculations.",
  path: "/forge",
  keywords: ["IdleMMO forge", "IdleMMO upgrades", "Zenith Companion forge", "IdleMMO forge costs"],
});

export default function ForgeLayout({ children }: { children: ReactNode }) {
  return children;
}
