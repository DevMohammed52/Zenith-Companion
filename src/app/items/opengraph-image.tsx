import { createRouteOgImage, routeOgSize } from "@/app/_og/route-card";

export const runtime = "edge";
export const alt = "Zenith Companion item database preview";
export const size = routeOgSize;
export const contentType = "image/png";

export default function Image() {
  return createRouteOgImage({
    accent: "#f5b041",
    eyebrow: "Items + market data",
    title: "Item Database",
    description: "Search IdleMMO items with prices, source routes, usage links, and detail overlays.",
    stats: ["public item cache", "market snapshots", "source links"],
  });
}
