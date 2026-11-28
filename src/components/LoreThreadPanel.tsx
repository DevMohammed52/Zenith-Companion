"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { getCachedLoreDataset, loadLoreData } from "@/data/lore";
import { getLoreHintsForNames, type LoreHint, type LoreNameInput } from "@/lib/lore-links";
import styles from "./LoreThreadPanel.module.css";

type LoreThreadPanelProps = {
  hints?: LoreHint[];
  names?: LoreNameInput[];
  title?: string;
  compact?: boolean;
  onOpenThread?: (entryId: string) => void;
};

const CONFIDENCE_CLASS: Record<string, string> = {
  canon: styles.confidenceCanon,
  inferred: styles.confidenceInferred,
  theory: styles.confidenceTheory,
};

export default function LoreThreadPanel({
  hints: initialHints,
  names,
  title = "Lore Thread",
  compact = false,
  onOpenThread,
}: LoreThreadPanelProps) {
  const [hints, setHints] = useState<LoreHint[]>(() => {
    if (initialHints && initialHints.length > 0) return initialHints;
    const cached = getCachedLoreDataset();
    if (cached && names && names.length > 0) {
      return getLoreHintsForNames(names, 6, cached);
    }
    return [];
  });

  useEffect(() => {
    if (initialHints && initialHints.length > 0) {
      setHints(initialHints);
      return;
    }
    if (names && names.length > 0) {
      let cancelled = false;
      loadLoreData()
        .then((dataset) => {
          if (!cancelled) {
            setHints(getLoreHintsForNames(names, 6, dataset));
          }
        })
        .catch(() => {});
      return () => {
        cancelled = true;
      };
    }
    if (!initialHints || initialHints.length === 0) {
      setHints([]);
    }
  }, [initialHints, names]);

  if (hints.length === 0) return null;

  return (
    <section className={`${styles.panel} ${compact ? styles.compact : ""}`.trim()}>
      <div className={styles.header}>
        <div className={styles.headerCopy}>
          <span className={styles.headerTitle}>
            <Icon name="lore" size={15} aria-hidden="true" /> {title}
          </span>
          <p className={styles.headerDesc}>
            Canon and clearly labeled inferred links from the Valaron archive.
          </p>
        </div>
        <Link href={`/lore?thread=${hints[0].entry.id}`} className={styles.atlasLink}>
          Open atlas <Icon name="arrowRight" size={13} aria-hidden="true" />
        </Link>
      </div>

      <div className={styles.cardGrid}>
        {hints.map((hint) => {
          const confidenceTone = CONFIDENCE_CLASS[hint.confidence] || "";
          const content = (
            <>
              <span className={`${styles.confidencePill} ${confidenceTone}`.trim()}>
                {hint.confidence}
              </span>
              <strong className={styles.miniCardTitle}>{hint.entry.title}</strong>
              <small className={styles.miniCardSource}>
                {hint.entry.category} from {hint.source}
              </small>
              <em className={styles.miniCardReason}>{hint.reason}</em>
            </>
          );

          if (onOpenThread) {
            return (
              <button
                key={`${hint.id}-${hint.source}-${hint.matchedName}`}
                type="button"
                className={styles.miniCard}
                onClick={() => onOpenThread(hint.entry.id)}
              >
                {content}
              </button>
            );
          }

          return (
            <Link
              key={`${hint.id}-${hint.source}-${hint.matchedName}`}
              href={`/lore?thread=${hint.entry.id}`}
              className={styles.miniCard}
            >
              {content}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
