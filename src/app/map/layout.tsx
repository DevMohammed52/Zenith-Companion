import type { ReactNode } from "react";
import { createRouteMetadata } from "@/lib/route-metadata";

export const metadata = createRouteMetadata({
  title: "World Map",
  description: "Browse IdleMMO world locations, travel routes, resources, monsters, and weather references.",
  path: "/map",
  keywords: ["IdleMMO map", "IdleMMO locations", "Zenith Companion map"],
});

export default function MapLayout({ children }: { children: ReactNode }) {
  return children;
}
