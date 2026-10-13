import { createRouteOgImage, routeOgSize } from "@/app/_og/route-card";

export const runtime = "edge";
export const alt = "Zenith Companion — IdleMMO Market & Character Tools";
export const size = routeOgSize;
export const contentType = "image/png";

export default function Image() {
  return createRouteOgImage({
    accent: "#f5b041",
    eyebrow: "IdleMMO Toolkit",
    title: "Zenith Companion",
    description: "Live market prices, skilling profit/hr, alchemy calculators, boss timers, and character planners.",
    stats: ["1,353 items indexed", "profile-aware math", "live market data"],
  });
}
