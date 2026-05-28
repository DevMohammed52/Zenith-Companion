import type { ReactNode } from "react";
import { createRouteMetadata } from "@/lib/route-metadata";

export const metadata = createRouteMetadata({
  title: "Pet Database",
  description: "Search IdleMMO pets, compare bonuses, review sources, and plan profile-local pet decisions.",
  path: "/pets",
  keywords: ["IdleMMO pets", "IdleMMO pet database", "Zenith Companion pets"],
});

export default function PetsLayout({ children }: { children: ReactNode }) {
  return children;
}
