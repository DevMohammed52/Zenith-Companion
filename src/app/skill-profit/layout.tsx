import type { ReactNode } from "react";
import { createRouteMetadata } from "@/lib/route-metadata";

export const metadata = createRouteMetadata({
  title: "Skill Profit",
  description: "Compare IdleMMO skilling methods with market prices, buffs, tools, taxes, profile data, and profit estimates.",
  path: "/skill-profit",
  keywords: ["IdleMMO skill profit", "IdleMMO profit calculator", "Zenith Companion skill profit"],
});

export default function SkillProfitLayout({ children }: { children: ReactNode }) {
  return children;
}
