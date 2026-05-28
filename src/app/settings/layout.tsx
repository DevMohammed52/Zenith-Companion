import type { ReactNode } from "react";
import { createRouteMetadata } from "@/lib/route-metadata";

export const metadata = createRouteMetadata({
  title: "Settings",
  description: "Adjust Zenith Companion preferences, accessibility behavior, theme choices, backups, and local browser state.",
  path: "/settings",
  keywords: ["Zenith Companion settings", "IdleMMO companion settings"],
});

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return children;
}
