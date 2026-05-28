import type { ReactNode } from "react";
import { createRouteMetadata } from "@/lib/route-metadata";

export const metadata = createRouteMetadata({
  title: "Alchemy",
  description: "Plan IdleMMO alchemy crafts with market-aware costs, recipe outputs, catalyst needs, and profile-friendly planning tools.",
  path: "/alchemy",
  keywords: ["IdleMMO alchemy", "IdleMMO recipes", "Zenith Companion alchemy"],
});

export default function AlchemyLayout({ children }: { children: ReactNode }) {
  return children;
}
