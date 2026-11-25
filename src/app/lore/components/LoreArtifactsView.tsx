import React from "react";
import type { LoreEntry } from "@/data/lore";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionHeading } from "./SectionHeading";
import { LoreCard } from "./LoreCard";
import styles from "../Lore.module.css";

export function LoreArtifactsView({
  artifactsAndBeasts,
  openEntry,
}: {
  artifactsAndBeasts: LoreEntry[];
  openEntry: (entry: LoreEntry) => void;
}) {
  return (
    <section className={styles.section} aria-label="Artifacts, bestiary, and divine concepts">
      <SectionHeading
        label="Artifacts & Bestiary"
        detail="Relics of power, creatures, deities, and mythic concepts recorded in Valaron."
      />
      {artifactsAndBeasts.length > 0 ? (
        <div className={styles.atlasGrid}>
          {artifactsAndBeasts.map((entry) => (
            <LoreCard key={entry.id} entry={entry} onOpen={openEntry} />
          ))}
        </div>
      ) : (
        <EmptyState
          variant="search-empty"
          title="No artifact, bestiary, or concept records match this filter"
          description="Try clearing your search query or switching back to All categories."
        />
      )}
    </section>
  );
}
