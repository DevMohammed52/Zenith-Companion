import type { CSSProperties } from "react";
import { ChevronRight } from "lucide-react";
import type { LoreEntry } from "@/data/lore";
import { CATEGORY_META, cleanLoreCopy } from "../types";

export function LoreCard({ entry, onOpen }: { entry: LoreEntry; onOpen: (entry: LoreEntry) => void }) {
  const meta = CATEGORY_META[entry.category];
  return (
    <button className="lore-card" style={{ "--tone": meta.tone } as CSSProperties} onClick={() => onOpen(entry)} type="button">
      <div className="card-topline">{meta.icon} {meta.label}</div>
      <h3>{entry.title}</h3>
      <p>{cleanLoreCopy(entry.summary)}</p>
      <div className="fact-list">
        {entry.keyFacts.slice(0, 2).map((fact) => <span key={fact}>{fact}</span>)}
      </div>
      <div className="card-footer">
        <span>{entry.relatedIds.length} linked threads</span>
        <ChevronRight size={16} />
      </div>
    </button>
  );
}
