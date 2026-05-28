import type { ReactNode } from "react";
import { createRouteMetadata } from "@/lib/route-metadata";

export const metadata = createRouteMetadata({
  title: "Museum",
  description: "Review IdleMMO museum categories, collection progress helpers, and profile-local reference tools.",
  path: "/museum",
  keywords: ["IdleMMO museum", "IdleMMO collections", "Zenith Companion museum"],
});

export default function MuseumLayout({ children }: { children: ReactNode }) {
  return children;
}
