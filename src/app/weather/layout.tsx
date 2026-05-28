import type { ReactNode } from "react";
import { createRouteMetadata } from "@/lib/route-metadata";

export const metadata = createRouteMetadata({
  title: "Weather",
  description: "Review IdleMMO weather data, location effects, enemy preferences, and planning context in Zenith Companion.",
  path: "/weather",
  keywords: ["IdleMMO weather", "IdleMMO locations", "Zenith Companion weather"],
});

export default function WeatherLayout({ children }: { children: ReactNode }) {
  return children;
}
