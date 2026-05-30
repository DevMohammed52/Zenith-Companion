import { createRouteOgImage, routeOgSize } from "@/app/_og/route-card";

export const runtime = "edge";
export const alt = "Zenith Companion world boss planner preview";
export const size = routeOgSize;
export const contentType = "image/png";

export default function Image() {
  return createRouteOgImage({
    accent: "#f87171",
    eyebrow: "World bosses",
    title: "Boss Planner",
    description: "Plan IdleMMO boss routes, teleport choices, timing, rewards, and profile-aware decisions.",
    stats: ["route timing", "rare drops", "travel tools"],
  });
}
