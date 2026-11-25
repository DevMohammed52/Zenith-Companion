import React from "react";
import type { LoreEntry } from "@/data/lore";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton, SkeletonContainer } from "@/components/ui/Skeleton";
import { SectionHeading } from "./SectionHeading";
import { LoreCard } from "./LoreCard";
import { LoreCompactCard } from "./LoreCompactCard";
import type { LoreFilter } from "../types";
import styles from "../Lore.module.css";

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
    <section className={styles.section} aria-label="World atlas records">
      <SectionHeading
        label="World Atlas"
        detail="Realms, ancient civilizations, and geographic landmarks across Valaron."
      />
      {loading && featuredAtlas.length === 0 ? (
        <SkeletonContainer announcement="Loading lore archive...">
          <div className={styles.atlasGrid}>
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className={styles.skeletonCard} aria-hidden="true">
                <Skeleton variant="text" width="32%" height={12} />
                <Skeleton variant="text" width="68%" height={20} />
                <Skeleton variant="text" width="100%" height={42} />
                <Skeleton variant="text" width="48%" height={14} />
              </div>
            ))}
          </div>
        </SkeletonContainer>
      ) : featuredAtlas.length > 0 ? (
        <div className={activeCategory === "NPC" ? styles.compactGrid : styles.atlasGrid}>
          {featuredAtlas.map((entry) =>
            activeCategory === "NPC" ? (
              <LoreCompactCard key={entry.id} entry={entry} onOpen={openEntry} />
            ) : (
              <LoreCard key={entry.id} entry={entry} onOpen={openEntry} />
            ),
          )}
        </div>
      ) : (
        <EmptyState
          variant="search-empty"
          title="No Atlas records match this filter"
          description="Try clearing your search query or selecting All categories."
        />
      )}
    </section>
  );
}
