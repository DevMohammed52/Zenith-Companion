import type { ReactNode } from "react";
import { createRouteMetadata } from "@/lib/route-metadata";

export const metadata = createRouteMetadata({
  title: "IdleMMO Forge Recipe Crafting | Zenith Companion",
  description: "Plan equipment recipe crafting, calculate missing materials, and optimize craft costs.",
  path: "/forge/craft",
  keywords: ["IdleMMO forge craft", "IdleMMO recipe crafting", "Zenith Companion forge"],
});

export default function ForgeCraftLayout({ children }: { children: ReactNode }) {
  return children;
}
