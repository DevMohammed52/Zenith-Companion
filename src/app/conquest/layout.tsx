import type { ReactNode } from "react";
import { createRouteMetadata } from "@/lib/route-metadata";

export const metadata = createRouteMetadata({
  title: "IdleMMO Guild Conquest",
  description: "Browse IdleMMO conquest assault windows, guild control, and zone pressure in Zenith Companion.",
  path: "/conquest",
  keywords: ["IdleMMO conquest", "IdleMMO guild conquest", "Zenith Companion conquest"],
});

export default function ConquestLayout({ children }: { children: ReactNode }) {
  return children;
}
