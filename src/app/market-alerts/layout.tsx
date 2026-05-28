import type { ReactNode } from "react";
import { createRouteMetadata } from "@/lib/route-metadata";

export const metadata = createRouteMetadata({
  title: "Market Alerts",
  description: "Create local IdleMMO market watchlists and price alerts that stay in your browser.",
  path: "/market-alerts",
  keywords: ["IdleMMO market alerts", "IdleMMO prices", "Zenith Companion market"],
});

export default function MarketAlertsLayout({ children }: { children: ReactNode }) {
  return children;
}
