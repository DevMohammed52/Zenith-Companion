import type { CSSProperties } from "react";
import type { LoreEntry } from "@/data/lore";
import { Icon } from "@/components/ui/Icon";
import { CATEGORY_META, cleanLoreCopy } from "../types";
import styles from "../Lore.module.css";

export function LoreCard({
  entry,
  onOpen,
}: {
  entry: LoreEntry;
  onOpen: (entry: LoreEntry) => void;
}) {
  const meta = CATEGORY_META[entry.category];
  return (
    <button
      className={styles.loreCard}
      style={{ "--tone": meta.tone } as CSSProperties}
      onClick={() => onOpen(entry)}
      type="button"
      aria-label={`Open dossier for ${entry.title}`}
    >
      <div className={styles.cardTopline}>
        <span className={styles.cardToplineGlyph}>{meta.icon}</span>
        <span>{meta.label}</span>
      </div>
      <h3 className={styles.cardTitle}>{entry.title}</h3>
      <p className={styles.cardSummary}>{cleanLoreCopy(entry.summary)}</p>
      {entry.keyFacts.length > 0 && (
        <div className={styles.factList}>
          {entry.keyFacts.slice(0, 2).map((fact) => (
            <span key={fact} className={styles.factChip}>{fact}</span>
          ))}
        </div>
      )}
      <div className={styles.cardFooter}>
        <span>{entry.relatedIds.length} linked threads</span>
        <span className={styles.cardActionCue}>
          <span>Read dossier</span>
          <Icon name="chevronRight" size="sm" aria-hidden="true" />
        </span>
      </div>
    </button>
  );
}
