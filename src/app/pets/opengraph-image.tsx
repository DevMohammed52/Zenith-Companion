import { createRouteOgImage, routeOgSize } from "@/app/_og/route-card";

export const runtime = "edge";
export const alt = "Zenith Companion pet database preview";
export const size = routeOgSize;
export const contentType = "image/png";

export default function Image() {
  return createRouteOgImage({
    accent: "#22c55e",
    eyebrow: "Pets + companions",
    title: "Pet Database",
    description: "Review IdleMMO pet stats, sources, bonuses, and comparison planning in one place.",
    stats: ["pet records", "source notes", "compare tools"],
  });
}
