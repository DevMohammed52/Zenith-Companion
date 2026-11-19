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
    <section className="lore-section">
      <SectionHeading label="Artifacts & Bestiary" detail="Objects of power, monsters, gods, cults, and other things that refuse to stay neatly categorized." />
      {artifactsAndBeasts.length > 0 ? (
        <div className="atlas-grid tight">
          {artifactsAndBeasts.map((entry) => <LoreCard key={entry.id} entry={entry} onOpen={openEntry} />)}
        </div>
      ) : (
        <div className="empty-thread">No artifact, bestiary, or concept records match this search or category filter.</div>
      )}
    </section>
  );
}
