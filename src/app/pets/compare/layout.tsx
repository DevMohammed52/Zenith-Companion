import type { ReactNode } from "react";
import { createRouteMetadata } from "@/lib/route-metadata";

export const metadata = createRouteMetadata({
  title: "Pet Compare",
  description: "Compare IdleMMO pet bonuses and sources side by side with Zenith Companion reference data.",
  path: "/pets/compare",
  keywords: ["IdleMMO pet compare", "IdleMMO pets", "Zenith Companion pets"],
});

export default function PetCompareLayout({ children }: { children: ReactNode }) {
  return children;
}
