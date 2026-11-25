import type { CSSProperties } from "react";
import type { LoreEntry } from "@/data/lore";
import { Icon } from "@/components/ui/Icon";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionHeading } from "./SectionHeading";
import { LoreCompactCard } from "./LoreCompactCard";
import type { NpcNetworkGroup } from "../hooks/useLoreState";
import styles from "../Lore.module.css";

export function LoreCharactersView({
  characterEntries,
  npcNetworkGroups,
  openEntry,
}: {
  characterEntries: LoreEntry[];
  npcNetworkGroups: NpcNetworkGroup[];
  openEntry: (entry: LoreEntry) => void;
}) {
  return (
    <section className={styles.section} aria-label="Character index and relationships">
      <SectionHeading
        label="Character Index"
        detail="Witnesses, rulers, exiles, and historical figures recorded in Valaron."
      />
      {characterEntries.length > 0 ? (
        <>
          <div className={styles.npcNetworkPanel}>
            <div className={styles.npcNetworkHeader}>
              <div className={styles.npcNetworkTitle}>
                <Icon name="relations" size="md" aria-hidden="true" />
                <span>NPC Relationship Map</span>
              </div>
              <p>Characters grouped by their primary regional or faction hub. Click any name to open the dossier.</p>
            </div>
            <div className={styles.npcNetworkGrid}>
              {npcNetworkGroups.map((group) => (
                <article key={group.id} className={styles.npcRegionGroup} style={{ "--tone": group.tone } as CSSProperties}>
                  <div className={styles.npcRegionHead}>
                    <span className={styles.npcRegionCategory}>{group.category}</span>
                    <h3 className={styles.npcRegionTitle}>{group.title}</h3>
                    <small className={styles.npcRegionCount}>
                      {group.characters.length} linked {group.characters.length === 1 ? "character" : "characters"}
                    </small>
                  </div>
                  <div className={styles.npcChipGrid} role="group" aria-label={`Characters in ${group.title}`}>
                    {group.characters.map((entry) => (
                      <button
                        key={`${group.id}-${entry.id}`}
                        type="button"
                        className={styles.npcChipBtn}
                        onClick={() => openEntry(entry)}
                        aria-label={`Open dossier for ${entry.title}`}
                      >
                        <strong>{entry.title}</strong>
                        <em>{entry.relatedIds.length} threads</em>
                      </button>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>
          <div className={styles.compactGrid}>
            {characterEntries.map((entry) => (
              <LoreCompactCard key={entry.id} entry={entry} onOpen={openEntry} />
            ))}
          </div>
        </>
      ) : (
        <EmptyState
          variant="search-empty"
          title="No character records match this filter"
          description="No NPC entries match your current search or category selection."
        />
      )}
    </section>
  );
}
