import React from "react";
import type { LoreEntry, LoreTheory } from "@/data/lore";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { SectionHeading } from "./SectionHeading";
import styles from "../Lore.module.css";

export function LoreTheoriesView({
  theories,
  entryById,
  openEntry,
}: {
  theories: LoreTheory[];
  entryById: Record<string, LoreEntry>;
  openEntry: (entry: LoreEntry) => void;
}) {
  return (
    <section className={styles.section} aria-label="Lore theories and speculation">
      <SectionHeading
        label="Theory Files"
        detail="Speculation and community hypotheses regarding unsolved mysteries in Valaron."
      />
      <div className={styles.theoryGrid}>
        {theories.map((theory) => (
          <article key={theory.id} className={styles.theoryCard}>
            <div className={styles.theoryCardHeader}>
              <Badge
                variant={
                  theory.speculationLevel === "High"
                    ? "danger"
                    : theory.speculationLevel === "Medium"
                    ? "warning"
                    : "refined"
                }
                size="sm"
              >
                {theory.speculationLevel} speculation
              </Badge>
            </div>
            <h3 className={styles.theoryTitle}>{theory.title}</h3>
            <p className={styles.theoryPremise}>{theory.premise}</p>
            {theory.evidenceIds.length > 0 && (
              <div className={styles.theoryEvidence} role="group" aria-label="Evidence threads">
                <span className={styles.theoryEvidenceLabel}>Evidence threads</span>
                <div className={styles.theoryEvidencePills}>
                  {theory.evidenceIds.map((id) => {
                    const entry = entryById[id];
                    return entry ? (
                      <button
                        key={id}
                        type="button"
                        className={styles.theoryEvidenceBtn}
                        onClick={() => openEntry(entry)}
                        aria-label={`Open dossier for ${entry.title}`}
                      >
                        <span>{entry.title}</span>
                      </button>
                    ) : null;
                  })}
                </div>
              </div>
            )}
            {theory.counterpoints.length > 0 && (
              <div className={styles.counterpoint}>
                <Icon name="counterpoint" size="sm" className={styles.counterpointIcon} aria-hidden="true" />
                <span>{theory.counterpoints[0]}</span>
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
