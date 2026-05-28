import type { ReactNode } from "react";
import { createRouteMetadata } from "@/lib/route-metadata";

export const metadata = createRouteMetadata({
  title: "Item Database",
  description: "Search IdleMMO items with market prices, locations, usage links, item details, and companion reference data.",
  path: "/items",
  keywords: ["IdleMMO items", "IdleMMO item database", "Zenith Companion items"],
});

export default function ItemsLayout({ children }: { children: ReactNode }) {
  return children;
}
