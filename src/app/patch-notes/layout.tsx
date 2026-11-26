import type { ReactNode } from "react";
import { createRouteMetadata } from "@/lib/route-metadata";

export const metadata = createRouteMetadata({
  title: "IdleMMO Patch Notes",
  description: "Search and filter the public IdleMMO patch note archive by version, mechanic, year, and keyword.",
  path: "/patch-notes",
  keywords: ["IdleMMO patch notes", "IdleMMO updates", "Zenith Companion patch notes"],
});

export default function PatchNotesLayout({ children }: { children: ReactNode }) {
  return children;
}
