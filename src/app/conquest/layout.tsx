import type { ReactNode } from "react";
import { createRouteMetadata } from "@/lib/route-metadata";

export const metadata = createRouteMetadata({
  title: "Conquest",
  description: "Browse IdleMMO conquest assault windows, guild control, and zone pressure in Zenith Companion.",
  path: "/conquest",
  keywords: ["IdleMMO conquest", "Zenith Companion conquest", "IdleMMO reference"],
});

export default function ConquestLayout({ children }: { children: ReactNode }) {
  return children;
}
