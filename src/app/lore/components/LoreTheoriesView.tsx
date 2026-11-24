import React from "react";
import { ShieldAlert } from "lucide-react";
import type { LoreEntry, LoreTheory } from "@/data/lore";
import { Badge } from "@/components/ui/Badge";
import { SectionHeading } from "./SectionHeading";

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
    <section className="lore-section" aria-label="Lore theories and speculation">
      <SectionHeading
        label="Theory Files"
        detail="Speculation and community hypotheses regarding unsolved mysteries in Valaron."
      />
      <div className="theory-grid">
        {theories.map((theory) => (
          <article key={theory.id} className="theory-card">
            <div className="theory-card-header">
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
            <h3 className="theory-title">{theory.title}</h3>
            <p className="theory-premise">{theory.premise}</p>
            {theory.evidenceIds.length > 0 && (
              <div className="theory-evidence" role="group" aria-label="Evidence threads">
                <span className="theory-evidence-label">Evidence threads</span>
                <div className="theory-evidence-pills">
                  {theory.evidenceIds.map((id) => {
                    const entry = entryById[id];
                    return entry ? (
                      <button
                        key={id}
                        type="button"
                        className="theory-evidence-btn"
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
              <div className="counterpoint">
                <ShieldAlert size={15} aria-hidden="true" />
                <span>{theory.counterpoints[0]}</span>
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
