import type { ReactNode } from "react";
import { createRouteMetadata } from "@/lib/route-metadata";

export const metadata = createRouteMetadata({
  title: "Owned Pets",
  description: "Track owned IdleMMO pets locally in your browser and compare collection gaps against public pet data.",
  path: "/pets/owned",
  keywords: ["IdleMMO owned pets", "IdleMMO pet collection", "Zenith Companion pets"],
});

export default function OwnedPetsLayout({ children }: { children: ReactNode }) {
  return children;
}
