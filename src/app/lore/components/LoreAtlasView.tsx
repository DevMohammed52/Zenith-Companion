import React from "react";
import type { LoreEntry } from "@/data/lore";
import { SectionHeading } from "./SectionHeading";
import { LoreCard } from "./LoreCard";
import { LoreCompactCard } from "./LoreCompactCard";
import type { LoreFilter } from "../types";

export function LoreAtlasView({
  featuredAtlas,
  activeCategory,
  loading,
  openEntry,
}: {
  featuredAtlas: LoreEntry[];
  activeCategory: LoreFilter;
  loading: boolean;
  openEntry: (entry: LoreEntry) => void;
}) {
  return (
    <section className="lore-section" aria-label="World atlas records">
      <SectionHeading
        label="World Atlas"
        detail="Realms, ancient civilizations, and geographic landmarks across Valaron."
      />
      {featuredAtlas.length > 0 ? (
        <div className={`atlas-grid ${activeCategory === "NPC" ? "npc-atlas" : ""}`}>
          {featuredAtlas.map((entry) => (
            activeCategory === "NPC"
              ? <LoreCompactCard key={entry.id} entry={entry} onOpen={openEntry} />
              : <LoreCard key={entry.id} entry={entry} onOpen={openEntry} />
          ))}
        </div>
      ) : (
        <div className="empty-thread atlas-empty">
          {loading ? "Loading lore archive..." : "No Atlas records match this filter."}
        </div>
      )}
    </section>
  );
}
