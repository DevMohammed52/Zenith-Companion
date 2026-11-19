import React from "react";
import { ShieldAlert } from "lucide-react";
import type { LoreEntry, LoreTheory } from "@/data/lore";
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
    <section className="lore-section">
      <SectionHeading label="Theory Files" detail="Speculation is clearly labeled. Canon is the evidence, not the conclusion." />
      <div className="theory-grid">
        {theories.map((theory) => (
          <article key={theory.id} className="theory-card">
            <span className={`spec-level level-${theory.speculationLevel.toLowerCase()}`}>{theory.speculationLevel} speculation</span>
            <h3>{theory.title}</h3>
            <p>{theory.premise}</p>
            <div className="theory-evidence">
              <strong>Evidence threads</strong>
              {theory.evidenceIds.map((id) => {
                const entry = entryById[id];
                return entry ? <button key={id} type="button" onClick={() => openEntry(entry)}>{entry.title}</button> : null;
              })}
            </div>
            <div className="counterpoint">
              <ShieldAlert size={15} />
              <span>{theory.counterpoints[0]}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
