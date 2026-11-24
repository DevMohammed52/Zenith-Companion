import type { CSSProperties } from "react";
import { ChevronRight } from "lucide-react";
import type { LoreEntry } from "@/data/lore";
import { CATEGORY_META, cleanLoreCopy } from "../types";

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
      className="lore-card"
      style={{ "--tone": meta.tone } as CSSProperties}
      onClick={() => onOpen(entry)}
      type="button"
      aria-label={`Open dossier for ${entry.title}`}
    >
      <div className="card-topline">
        <span className="card-topline-glyph">{meta.icon}</span>
        <span className="card-topline-label">{meta.label}</span>
      </div>
      <h3 className="card-title">{entry.title}</h3>
      <p className="card-summary">{cleanLoreCopy(entry.summary)}</p>
      {entry.keyFacts.length > 0 && (
        <div className="fact-list">
          {entry.keyFacts.slice(0, 2).map((fact) => (
            <span key={fact} className="fact-chip">{fact}</span>
          ))}
        </div>
      )}
      <div className="card-footer">
        <span className="card-threads-meta">{entry.relatedIds.length} linked threads</span>
        <span className="card-action-cue">
          <span>Read dossier</span>
          <ChevronRight size={15} aria-hidden="true" />
        </span>
      </div>
    </button>
  );
}
