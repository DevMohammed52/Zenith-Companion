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
    <section className="lore-section">
      <SectionHeading label="Character Index" detail="Witnesses, rulers, exiles, spirits, and names Edric thought worth preserving." />
      {characterEntries.length > 0 ? (
        <>
          <div className="npc-network-panel">
            <div className="npc-network-header">
              <span><GitBranch size={15} /> NPC Relationship Map</span>
              <p>Characters grouped by their strongest official place, faction, or concept thread. Click any name to open the dossier.</p>
            </div>
            <div className="npc-network-grid">
              {npcNetworkGroups.map((group) => (
                <article key={group.id} className="npc-region-card" style={{ "--tone": group.tone } as CSSProperties}>
                  <div className="npc-region-head">
                    <span>{group.category}</span>
                    <h3>{group.title}</h3>
                    <small>{group.characters.length} linked {group.characters.length === 1 ? "character" : "characters"}</small>
                  </div>
                  <div className="npc-chip-grid">
                    {group.characters.map((entry) => (
                      <button key={`${group.id}-${entry.id}`} type="button" onClick={() => openEntry(entry)}>
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
            {characterEntries.map((entry) => <LoreCompactCard key={entry.id} entry={entry} onOpen={openEntry} />)}
          </div>
        </>
      ) : (
        <div className="empty-thread">No character records match this search or category filter.</div>
      )}
    </section>
  );
}
