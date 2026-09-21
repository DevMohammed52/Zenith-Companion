import type { ReactNode } from "react";
import { createRouteMetadata } from "@/lib/route-metadata";

export const metadata = createRouteMetadata({
  title: "IdleMMO Weather Forecast",
  description: "Review IdleMMO weather forecasts, location effects, and favored or penalized enemies in Zenith Companion.",
  path: "/weather",
  keywords: ["IdleMMO weather", "IdleMMO weather forecast", "IdleMMO locations", "Zenith Companion weather"],
});

export default function WeatherLayout({ children }: { children: ReactNode }) {
  return children;
}
