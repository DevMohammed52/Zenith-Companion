import { createRouteOgImage, routeOgSize } from "@/app/_og/route-card";

export const runtime = "edge";
export const alt = "Zenith Companion guild registry preview";
export const size = routeOgSize;
export const contentType = "image/png";

export default function Image() {
  return createRouteOgImage({
    accent: "#a78bfa",
    eyebrow: "Guild registry",
    title: "Guild Registry",
    description: "Browse public IdleMMO guild data, member counts, refresh status, and reference details.",
    stats: ["public guilds", "search index", "refresh status"],
  });
}
