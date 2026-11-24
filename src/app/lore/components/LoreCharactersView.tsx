import type { CSSProperties } from "react";
import { GitBranch } from "lucide-react";
import type { LoreEntry } from "@/data/lore";
import { SectionHeading } from "./SectionHeading";
import { LoreCompactCard } from "./LoreCompactCard";
import type { NpcNetworkGroup } from "../hooks/useLoreState";

export function LoreCharactersView({
  characterEntries,
  npcNetworkGroups,
  openEntry,
}: {
  characterEntries: LoreEntry[];
  npcNetworkGroups: NpcNetworkGroup[];
  openEntry: (entry: LoreEntry) => void;
}) {
  return (
    <section className="lore-section" aria-label="Character index and relationships">
      <SectionHeading
        label="Character Index"
        detail="Witnesses, rulers, exiles, and historical figures recorded in Valaron."
      />
      {characterEntries.length > 0 ? (
        <>
          <div className="npc-network-panel">
            <div className="npc-network-header">
              <div className="npc-network-title">
                <GitBranch size={16} aria-hidden="true" />
                <span>NPC Relationship Map</span>
              </div>
              <p>Characters grouped by their primary regional or faction hub. Click any name to open the dossier.</p>
            </div>
            <div className="npc-network-grid">
              {npcNetworkGroups.map((group) => (
                <article key={group.id} className="npc-region-card" style={{ "--tone": group.tone } as CSSProperties}>
                  <div className="npc-region-head">
                    <span className="npc-region-category">{group.category}</span>
                    <h3 className="npc-region-title">{group.title}</h3>
                    <small className="npc-region-count">
                      {group.characters.length} linked {group.characters.length === 1 ? "character" : "characters"}
                    </small>
                  </div>
                  <div className="npc-chip-grid" role="group" aria-label={`Characters in ${group.title}`}>
                    {group.characters.map((entry) => (
                      <button
                        key={`${group.id}-${entry.id}`}
                        type="button"
                        className="npc-chip-btn"
                        onClick={() => openEntry(entry)}
                        aria-label={`Open dossier for ${entry.title}`}
                      >
                        <strong>{entry.title}</strong>
                        <em>{entry.relatedIds.length} threads</em>
                      </button>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>
          <div className="compact-grid">
            {characterEntries.map((entry) => (
              <LoreCompactCard key={entry.id} entry={entry} onOpen={openEntry} />
            ))}
          </div>
        </>
      ) : (
        <div className="empty-thread">No character records match this search or category filter.</div>
      )}
    </section>
  );
}
