import { createRouteMetadata } from "@/lib/route-metadata";
import PatchNotesClient from "./PatchNotesClient";

export const metadata = createRouteMetadata({
  title: "IdleMMO Patch Notes",
  description: "Search and filter the public IdleMMO patch note archive by version, mechanic, and keyword.",
  path: "/patch-notes",
  keywords: ["IdleMMO patch notes", "IdleMMO updates", "Zenith Companion patch notes"],
});

export default function IdleMmoPatchNotesPage() {
  return <PatchNotesClient />;
}
