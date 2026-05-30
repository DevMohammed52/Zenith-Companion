import { createRouteOgImage, routeOgSize } from "@/app/_og/route-card";

export const runtime = "edge";
export const alt = "Zenith Companion skill profit preview";
export const size = routeOgSize;
export const contentType = "image/png";

export default function Image() {
  return createRouteOgImage({
    accent: "#38bdf8",
    eyebrow: "Profit planning",
    title: "Skill Profit",
    description: "Compare skilling routes with market prices, tools, buffs, taxes, and profile defaults.",
    stats: ["safe prices", "route filters", "profile inputs"],
  });
}
