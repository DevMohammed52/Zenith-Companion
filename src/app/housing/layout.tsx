import type { ReactNode } from "react";
import { createRouteMetadata } from "@/lib/route-metadata";

export const metadata = createRouteMetadata({
  title: "Housing",
  description: "Model IdleMMO housing buffs, activity bonuses, idle hours, and profile-local upgrade choices.",
  path: "/housing",
  keywords: ["IdleMMO housing", "IdleMMO buffs", "Zenith Companion housing"],
});

export default function HousingLayout({ children }: { children: ReactNode }) {
  return children;
}
