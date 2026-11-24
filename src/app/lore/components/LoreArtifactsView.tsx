import React from "react";
import type { LoreEntry } from "@/data/lore";
import { SectionHeading } from "./SectionHeading";
import { LoreCard } from "./LoreCard";

export function LoreArtifactsView({
  artifactsAndBeasts,
  openEntry,
}: {
  artifactsAndBeasts: LoreEntry[];
  openEntry: (entry: LoreEntry) => void;
}) {
  return (
    <section className="lore-section" aria-label="Artifacts, bestiary, and divine concepts">
      <SectionHeading
        label="Artifacts & Bestiary"
        detail="Relics of power, creatures, deities, and mythic concepts recorded in Valaron."
      />
      {artifactsAndBeasts.length > 0 ? (
        <div className="atlas-grid tight">
          {artifactsAndBeasts.map((entry) => (
            <LoreCard key={entry.id} entry={entry} onOpen={openEntry} />
          ))}
        </div>
      ) : (
        <div className="empty-thread">No artifact, bestiary, or concept records match this search or category filter.</div>
      )}
    </section>
  );
}
