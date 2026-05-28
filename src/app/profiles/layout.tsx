import type { ReactNode } from "react";
import { createRouteMetadata } from "@/lib/route-metadata";

export const metadata = createRouteMetadata({
  title: "Profiles",
  description: "Manage browser-local IdleMMO profiles, optional imports, backups, and profile-scoped planning state.",
  path: "/profiles",
  keywords: ["IdleMMO profile import", "IdleMMO profiles", "Zenith Companion profiles"],
});

export default function ProfilesLayout({ children }: { children: ReactNode }) {
  return children;
}
