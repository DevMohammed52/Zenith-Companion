import type { ReactNode } from "react";
import { createRouteMetadata } from "@/lib/route-metadata";

export const metadata = createRouteMetadata({
  title: "Mythic Alchemy",
  description: "Track active IdleMMO mythic alchemy recipes, required materials, market value, and completion planning in Zenith Companion.",
  path: "/alchemy/mythic",
  keywords: ["IdleMMO mythic alchemy", "IdleMMO mythic recipes", "Zenith Companion alchemy"],
});

export default function MythicAlchemyLayout({ children }: { children: ReactNode }) {
  return children;
}
