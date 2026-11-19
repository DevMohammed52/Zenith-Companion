import React from "react";
import ZenithIcon from "@/components/icons/ZenithIcon";

export function LoreHeader({
  loading,
  entriesCount,
  relationsCount,
  theoriesCount,
}: {
  loading: boolean;
  entriesCount: number;
  relationsCount: number;
  theoriesCount: number;
}) {
  return (
    <section className="lore-hero">
      <span className="lore-eyebrow"><ZenithIcon name="archive" size={16} /> IdleMMO Lore Wiki</span>
      <h1 id="lore-page-title">Chronicles of Valaron</h1>
      <p>
        Edric&apos;s archive, rebuilt as a living atlas of civilizations, artifacts, gods, creatures,
        witnesses, and suspiciously convenient historical silences.
      </p>
      <div className="lore-hero-stats" aria-label="Lore coverage">
        <span><strong>{loading ? "..." : entriesCount}</strong> official records</span>
        <span><strong>{loading ? "..." : relationsCount}</strong> source links</span>
        <span><strong>{loading ? "..." : theoriesCount}</strong> theory files</span>
      </div>
    </section>
  );
}
