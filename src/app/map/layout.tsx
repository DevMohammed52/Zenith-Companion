import type { ReactNode } from "react";
import { createRouteMetadata } from "@/lib/route-metadata";

export const metadata = createRouteMetadata({
  title: "World Map",
  description: "Browse IdleMMO world locations, travel context, resources, monsters, and route planning references.",
  path: "/map",
  keywords: ["IdleMMO map", "IdleMMO locations", "Zenith Companion map"],
});

export default function MapLayout({ children }: { children: ReactNode }) {
  return children;
}
