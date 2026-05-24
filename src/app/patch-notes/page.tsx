import type { Metadata } from "next";
import PatchNotesClient from "./PatchNotesClient";

export const metadata: Metadata = {
  title: "IdleMMO Patch Notes | Zenith Companion",
  description: "Search and filter the public IdleMMO patch note archive by version, mechanic, and keyword.",
};

export default function IdleMmoPatchNotesPage() {
  return <PatchNotesClient />;
}
