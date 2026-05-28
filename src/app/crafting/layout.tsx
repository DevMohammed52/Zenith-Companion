import type { ReactNode } from "react";
import { createRouteMetadata } from "@/lib/route-metadata";

export const metadata = createRouteMetadata({
  title: "Crafting Queue",
  description: "Build IdleMMO crafting queues with material requirements, market context, time estimates, and profile-local planning.",
  path: "/crafting",
  keywords: ["IdleMMO crafting", "IdleMMO crafting queue", "Zenith Companion crafting"],
});

export default function CraftingLayout({ children }: { children: ReactNode }) {
  return children;
}
