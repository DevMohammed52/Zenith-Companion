import type { ReactNode } from "react";
import { createRouteMetadata } from "@/lib/route-metadata";

export const metadata = createRouteMetadata({
  title: "Best-in-Slot Planner",
  description: "Compare IdleMMO equipment, stats, and upgrade paths with a focused best-in-slot planning workspace.",
  path: "/bis",
  keywords: ["IdleMMO best in slot", "IdleMMO gear", "Zenith Companion BiS"],
});

export default function BisLayout({ children }: { children: ReactNode }) {
  return children;
}
