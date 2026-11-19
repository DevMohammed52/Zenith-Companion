import type { CSSProperties } from "react";
import type { LoreEntry } from "@/data/lore";
import { CATEGORY_META, cleanLoreCopy } from "../types";

export function LoreCompactCard({ entry, onOpen }: { entry: LoreEntry; onOpen: (entry: LoreEntry) => void }) {
  const meta = CATEGORY_META[entry.category];
  return (
    <button className="compact-card" style={{ "--tone": meta.tone } as CSSProperties} onClick={() => onOpen(entry)} type="button">
      <div className="card-topline">{meta.icon} {meta.label}</div>
      <h3>{entry.title}</h3>
      <p>{cleanLoreCopy(entry.keyFacts[0] || entry.summary)}</p>
    </button>
  );
}
