import type { CSSProperties } from "react";
import type { LoreEntry } from "@/data/lore";
import { Icon } from "@/components/ui/Icon";
import { CATEGORY_META, cleanLoreCopy } from "../types";
import styles from "../Lore.module.css";

export function LoreCompactCard({
  entry,
  onOpen,
}: {
  entry: LoreEntry;
  onOpen: (entry: LoreEntry) => void;
}) {
  const meta = CATEGORY_META[entry.category];
  return (
    <button
      className={styles.compactCard}
      style={{ "--tone": meta.tone } as CSSProperties}
      onClick={() => onOpen(entry)}
      type="button"
      aria-label={`Open dossier for ${entry.title}`}
    >
      <div className={styles.compactCardHeader}>
        <div className={styles.cardTopline}>
          <span className={styles.cardToplineGlyph}>{meta.icon}</span>
          <span>{meta.label}</span>
        </div>
        <span className={styles.compactCardMeta}>{entry.relatedIds.length} links</span>
      </div>
      <h3 className={styles.compactCardTitle}>{entry.title}</h3>
      <p className={styles.compactCardDetail}>{cleanLoreCopy(entry.keyFacts[0] || entry.summary)}</p>
      <div className={styles.compactCardFooter}>
        <span>Read dossier</span>
        <Icon name="chevronRight" size="sm" aria-hidden="true" />
      </div>
    </button>
  );
}
