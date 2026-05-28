import type { ReactNode } from "react";
import { createRouteMetadata } from "@/lib/route-metadata";

export const metadata = createRouteMetadata({
  title: "Guild Registry",
  description: "Browse and search public IdleMMO guild data, member counts, refresh status, and guild reference details.",
  path: "/guilds",
  keywords: ["IdleMMO guilds", "IdleMMO guild registry", "Zenith Companion guilds"],
});

export default function GuildsLayout({ children }: { children: ReactNode }) {
  return children;
}
