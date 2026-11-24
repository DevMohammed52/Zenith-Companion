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
      <div className="lore-eyebrow">
        <ZenithIcon name="archive" size={15} />
        <span>Chronicles of Valaron</span>
      </div>
      <h1 id="lore-page-title">Valaron Lore Archive</h1>
      <p className="lore-hero-lead">
        Edric&apos;s illuminated records of fallen realms, celestial deities, ancient relics, and historical silences.
      </p>
      <div className="lore-hero-stats" aria-label="Archive coverage statistics">
        <span className="lore-stat-pill">
          <strong>{loading ? "..." : entriesCount}</strong>
          <span>Records</span>
        </span>
        <span className="lore-stat-divider" aria-hidden="true">&bull;</span>
        <span className="lore-stat-pill">
          <strong>{loading ? "..." : relationsCount}</strong>
          <span>Relations</span>
        </span>
        <span className="lore-stat-divider" aria-hidden="true">&bull;</span>
        <span className="lore-stat-pill">
          <strong>{loading ? "..." : theoriesCount}</strong>
          <span>Theories</span>
        </span>
      </div>
    </section>
  );
}
