import type { CSSProperties } from "react";
import { ChevronRight } from "lucide-react";
import type { LoreEntry } from "@/data/lore";
import { CATEGORY_META, cleanLoreCopy } from "../types";

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
      className="compact-card"
      style={{ "--tone": meta.tone } as CSSProperties}
      onClick={() => onOpen(entry)}
      type="button"
      aria-label={`Open dossier for ${entry.title}`}
    >
      <div className="compact-card-header">
        <div className="card-topline">
          <span className="card-topline-glyph">{meta.icon}</span>
          <span className="card-topline-label">{meta.label}</span>
        </div>
        <span className="compact-card-meta">{entry.relatedIds.length} links</span>
      </div>
      <h3 className="compact-card-title">{entry.title}</h3>
      <p className="compact-card-detail">{cleanLoreCopy(entry.keyFacts[0] || entry.summary)}</p>
      <div className="compact-card-footer">
        <span>Read dossier</span>
        <ChevronRight size={14} aria-hidden="true" />
      </div>
    </button>
  );
}
