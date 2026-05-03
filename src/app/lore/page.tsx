"use client";

import type { CSSProperties, ReactNode } from "react";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  BookOpen,
  Brain,
  ChevronRight,
  Clock,
  Compass,
  ExternalLink,
  Eye,
  Filter,
  GitBranch,
  Landmark,
  Layers,
  Map,
  Package,
  ScrollText,
  Search,
  ShieldAlert,
  Skull,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import {
  LORE_ENTRIES,
  LORE_ENTRY_BY_ID,
  LORE_ITEM_LINKS,
  LORE_RELATIONS,
  LORE_THEORIES,
  LORE_TIMELINE,
  type LoreEntry,
  type LoreRelation,
} from "@/data/lore";

type LoreView = "atlas" | "timeline" | "characters" | "artifacts" | "board" | "theories";
type LoreFilter = "all" | LoreEntry["category"];
type RelationFilter = "all" | LoreRelation["confidence"];

const isLoreView = (value: string | null): value is LoreView =>
  value === "atlas" ||
  value === "timeline" ||
  value === "characters" ||
  value === "artifacts" ||
  value === "board" ||
  value === "theories";

const VIEW_OPTIONS: Array<{ id: LoreView; label: string; icon: ReactNode }> = [
  { id: "atlas", label: "Atlas", icon: <Map size={16} /> },
  { id: "timeline", label: "Timeline", icon: <Clock size={16} /> },
  { id: "characters", label: "Characters", icon: <Users size={16} /> },
  { id: "artifacts", label: "Artifacts & Beasts", icon: <Skull size={16} /> },
  { id: "board", label: "Mystery Board", icon: <GitBranch size={16} /> },
  { id: "theories", label: "Theories", icon: <Brain size={16} /> },
];

const CATEGORY_META: Record<LoreEntry["category"], { label: string; tone: string; icon: ReactNode }> = {
  Index: { label: "Archive", tone: "#f5b041", icon: <Layers size={16} /> },
  Overview: { label: "Overview", tone: "#38bdf8", icon: <BookOpen size={16} /> },
  Civilization: { label: "Civilization", tone: "#4ade80", icon: <Landmark size={16} /> },
  World: { label: "World", tone: "#60a5fa", icon: <Compass size={16} /> },
  Concept: { label: "Concept", tone: "#a78bfa", icon: <Sparkles size={16} /> },
  Artifact: { label: "Artifact", tone: "#f59e0b", icon: <Package size={16} /> },
  Bestiary: { label: "Bestiary", tone: "#f87171", icon: <Skull size={16} /> },
  NPC: { label: "NPC", tone: "#f472b6", icon: <Users size={16} /> },
};

const FEATURED_ATLAS_IDS = [
  "world-valaron",
  "world-solaris-isle",
  "world-the-citadel",
  "civilizations-arvendor",
  "civilizations-eldorian",
  "civilizations-mokthar",
  "civilizations-oakenra",
  "civilizations-ombric",
  "civilizations-the-ancients",
  "civilizations-the-first-people",
  "artifacts-the-runemark-of-eternity",
  "concepts-gods-and-deities",
];

const NPC_NETWORK_HUB_IDS = [
  "civilizations-arvendor",
  "civilizations-ombric",
  "world-the-citadel",
  "world-solaris-isle",
  "civilizations-eldorian",
  "civilizations-oakenra",
  "civilizations-mokthar",
  "concepts-gods-and-deities",
  "concepts-cults",
  "world-valaron",
];

const entries = LORE_ENTRIES as readonly LoreEntry[];

const normalizeLoreText = (value: string) => value
  .toLowerCase()
  .replace(/&/g, " and ")
  .replace(/[^a-z0-9]+/g, " ")
  .trim();

function LoreContent() {
  const searchParams = useSearchParams();
  const searchParamKey = searchParams.toString();
  const initialViewParam = searchParams.get("view");
  const initialThreadParam = searchParams.get("thread");
  const initialView = initialThreadParam && LORE_ENTRY_BY_ID[initialThreadParam]
    ? "board"
    : isLoreView(initialViewParam)
      ? initialViewParam
      : "atlas";
  const [activeView, setActiveView] = useState<LoreView>(initialView);
  const [activeCategory, setActiveCategory] = useState<LoreFilter>("all");
  const [search, setSearch] = useState("");
  const [selectedEntry, setSelectedEntry] = useState<LoreEntry | null>(
    initialThreadParam && LORE_ENTRY_BY_ID[initialThreadParam] ? LORE_ENTRY_BY_ID[initialThreadParam] : null,
  );
  const [boardEntryId, setBoardEntryId] = useState(
    initialThreadParam && LORE_ENTRY_BY_ID[initialThreadParam] ? initialThreadParam : "artifacts-the-runemark-of-eternity",
  );
  const [relationFilter, setRelationFilter] = useState<RelationFilter>("all");

  useEffect(() => {
    const thread = searchParams.get("thread");
    const query = searchParams.get("q");
    const view = searchParams.get("view");
    if (query) setSearch(query);
    if (isLoreView(view)) setActiveView(view);
    if (thread && LORE_ENTRY_BY_ID[thread]) {
      setBoardEntryId(thread);
      setActiveView("board");
      setSelectedEntry(LORE_ENTRY_BY_ID[thread]);
    }
  }, [searchParamKey, searchParams]);

  const categoryCounts = useMemo(() => {
    return entries.reduce<Record<string, number>>((acc, entry) => {
      acc[entry.category] = (acc[entry.category] || 0) + 1;
      return acc;
    }, {});
  }, []);

  const filteredEntries = useMemo(() => {
    const q = search.trim().toLowerCase();
    return entries.filter((entry) => {
      const categoryMatch = activeCategory === "all" || entry.category === activeCategory;
      if (!categoryMatch) return false;
      if (!q) return true;
      const haystack = [
        entry.title,
        entry.category,
        entry.summary,
        ...entry.tags,
        ...entry.keyFacts,
      ].join(" ").toLowerCase();
      return haystack.includes(q);
    });
  }, [activeCategory, search]);

  const featuredAtlas = useMemo(() => {
    const featured = FEATURED_ATLAS_IDS.map((id) => LORE_ENTRY_BY_ID[id]).filter(Boolean);
    if (search.trim() || activeCategory !== "all") return filteredEntries.filter((entry) => entry.category !== "NPC");
    return featured;
  }, [activeCategory, filteredEntries, search]);

  const characterEntries = useMemo(
    () => filteredEntries.filter((entry) => entry.category === "NPC"),
    [filteredEntries],
  );

  const npcNetworkGroups = useMemo(() => {
    const hubs = NPC_NETWORK_HUB_IDS
      .map((id) => LORE_ENTRY_BY_ID[id])
      .filter((entry): entry is LoreEntry => Boolean(entry));

    const assigned = new Set<string>();
    const groups = hubs.map((hub) => {
      const hubTitle = normalizeLoreText(hub.title);
      const characters = characterEntries.filter((entry) => {
        if (assigned.has(entry.id)) return false;
        if (entry.relatedIds.includes(hub.id)) return true;
        return entry.tags.some((tag) => normalizeLoreText(tag) === hubTitle);
      });
      characters.forEach((entry) => assigned.add(entry.id));

      return {
        id: hub.id,
        title: hub.title,
        category: CATEGORY_META[hub.category].label,
        tone: CATEGORY_META[hub.category].tone,
        detail: hub.summary,
        characters,
      };
    }).filter((group) => group.characters.length > 0);

    const unplaced = characterEntries.filter((entry) => !assigned.has(entry.id));

    if (unplaced.length > 0) {
      groups.push({
        id: "unplaced",
        title: "Unplaced Threads",
        category: "Archive",
        tone: "#f5b041",
        detail: "Characters without a strong place or faction link in the current official relationship data.",
        characters: unplaced,
      });
    }

    return groups;
  }, [characterEntries]);

  const artifactsAndBeasts = useMemo(
    () => filteredEntries.filter((entry) => entry.category === "Artifact" || entry.category === "Bestiary" || entry.category === "Concept"),
    [filteredEntries],
  );

  const boardEntry = LORE_ENTRY_BY_ID[boardEntryId] || LORE_ENTRY_BY_ID["artifacts-the-runemark-of-eternity"] || entries[0];
  const boardRelations = useMemo(() => {
    return (LORE_RELATIONS as readonly LoreRelation[]).filter((relation) => {
      const touchesBoard = relation.source === boardEntry.id || relation.target === boardEntry.id;
      const passesFilter = relationFilter === "all" || relation.confidence === relationFilter;
      return touchesBoard && passesFilter;
    }).slice(0, 18);
  }, [boardEntry.id, relationFilter]);

  const boardStats = useMemo(() => {
    const related = (LORE_RELATIONS as readonly LoreRelation[]).filter((relation) => relation.source === boardEntry.id || relation.target === boardEntry.id);
    return {
      total: related.length,
      canon: related.filter((relation) => relation.confidence === "canon").length,
      inferred: related.filter((relation) => relation.confidence === "inferred").length,
      theory: related.filter((relation) => relation.confidence === "theory").length,
    };
  }, [boardEntry.id]);

  const boardGraphRelations = boardRelations.slice(0, 8);

  const openEntry = (entry: LoreEntry) => {
    setSelectedEntry(entry);
    setBoardEntryId(entry.id);
  };

  return (
    <main className="lore-page">
      <LoreCanvas />
      <div className="lore-shade" aria-hidden="true" />

      <section className="lore-hero">
        <span className="lore-eyebrow"><ScrollText size={16} /> IdleMMO Lore Wiki</span>
        <h1>Chronicles of Valaron</h1>
        <p>
          Edric&apos;s archive, rebuilt as a living atlas of civilizations, artifacts, gods, creatures,
          witnesses, and suspiciously convenient historical silences.
        </p>
        <div className="lore-hero-stats" aria-label="Lore coverage">
          <span><strong>{entries.length}</strong> official records</span>
          <span><strong>{LORE_RELATIONS.length}</strong> source links</span>
          <span><strong>{LORE_THEORIES.length}</strong> theory files</span>
        </div>
      </section>

      <section className="lore-toolbar" aria-label="Lore controls">
        <div className="lore-search">
          <Search size={17} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search names, factions, places, artifacts..."
          />
        </div>
        <div className="lore-view-tabs" role="tablist" aria-label="Lore views">
          {VIEW_OPTIONS.map((view) => (
            <button
              key={view.id}
              type="button"
              className={activeView === view.id ? "active" : ""}
              onClick={() => setActiveView(view.id)}
              aria-pressed={activeView === view.id}
            >
              {view.icon}
              <span>{view.label}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="category-rail" aria-label="Lore categories">
        <button className={activeCategory === "all" ? "active" : ""} onClick={() => setActiveCategory("all")} type="button">
          <Filter size={15} /> All <span>{entries.length}</span>
        </button>
        {(Object.keys(CATEGORY_META) as LoreEntry["category"][]).map((category) => (
          <button
            key={category}
            type="button"
            style={{ "--tone": CATEGORY_META[category].tone } as CSSProperties}
            className={activeCategory === category ? "active" : ""}
            onClick={() => setActiveCategory(category)}
          >
            {CATEGORY_META[category].icon}
            {CATEGORY_META[category].label}
            <span>{categoryCounts[category] || 0}</span>
          </button>
        ))}
      </section>

      {activeView === "atlas" && (
        <section className="lore-section">
          <SectionHeading label="World Atlas" detail="Civilizations, realms, artifacts, and mythic pressure points." />
          <div className="atlas-grid">
            {featuredAtlas.map((entry) => <LoreCard key={entry.id} entry={entry} onOpen={openEntry} />)}
          </div>
        </section>
      )}

      {activeView === "timeline" && (
        <section className="lore-section">
          <SectionHeading label="Chronology" detail="The clean version of history, with enough gaps to make anyone nervous." />
          <div className="timeline-list">
            {LORE_TIMELINE.map((event) => (
              <article key={event.id} className="timeline-item">
                <div className="timeline-era">{event.era}</div>
                <div className="timeline-body">
                  <h3>{event.title}</h3>
                  <p>{event.summary}</p>
                  <div className="thread-pills">
                    {event.entryIds.map((id) => {
                      const entry = LORE_ENTRY_BY_ID[id];
                      return entry ? (
                        <button key={id} type="button" onClick={() => openEntry(entry)}>
                          {entry.title}
                        </button>
                      ) : null;
                    })}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {activeView === "characters" && (
        <section className="lore-section">
          <SectionHeading label="Character Index" detail="Witnesses, rulers, exiles, spirits, and names Edric thought worth preserving." />
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
        </section>
      )}

      {activeView === "artifacts" && (
        <section className="lore-section">
          <SectionHeading label="Artifacts & Bestiary" detail="Objects of power, monsters, gods, cults, and other things that refuse to stay neatly categorized." />
          <div className="atlas-grid tight">
            {artifactsAndBeasts.map((entry) => <LoreCard key={entry.id} entry={entry} onOpen={openEntry} />)}
          </div>
        </section>
      )}

      {activeView === "board" && (
        <section className="lore-section">
          <SectionHeading label="Mystery Board" detail="Official links first. The red-string energy is optional, but encouraged." />
          <div className="board-controls">
            <select value={boardEntry.id} onChange={(event) => setBoardEntryId(event.target.value)}>
              {entries.filter((entry) => entry.category !== "Index").map((entry) => (
                <option key={entry.id} value={entry.id}>{entry.title}</option>
              ))}
            </select>
            <div className="confidence-tabs">
              {(["all", "canon", "inferred", "theory"] as RelationFilter[]).map((filter) => (
                <button key={filter} className={relationFilter === filter ? "active" : ""} onClick={() => setRelationFilter(filter)} type="button">
                  {filter}
                </button>
              ))}
            </div>
          </div>
          <div className="mystery-board">
            <article className="board-center" style={{ "--tone": CATEGORY_META[boardEntry.category].tone } as CSSProperties}>
              <span>{CATEGORY_META[boardEntry.category].icon} {CATEGORY_META[boardEntry.category].label}</span>
              <h3>{boardEntry.title}</h3>
              <p>{boardEntry.summary}</p>
              <div className="board-stat-row">
                <span><strong>{boardStats.total}</strong> total</span>
                <span><strong>{boardStats.canon}</strong> canon</span>
                <span><strong>{boardStats.inferred}</strong> inferred</span>
                <span><strong>{boardStats.theory}</strong> theory</span>
              </div>
              <button type="button" onClick={() => openEntry(boardEntry)}>Open dossier</button>
            </article>
            <div className="board-map" aria-label={`Connection map for ${boardEntry.title}`}>
              <div className="board-map-core">
                <span>{CATEGORY_META[boardEntry.category].label}</span>
                <strong>{boardEntry.title}</strong>
              </div>
              {boardGraphRelations.map((relation, index) => {
                const otherId = relation.source === boardEntry.id ? relation.target : relation.source;
                const other = LORE_ENTRY_BY_ID[otherId];
                if (!other) return null;
                return (
                  <button
                    key={`node-${relation.source}-${relation.target}`}
                    type="button"
                    className={`board-node node-${index % 8} ${relation.confidence}`}
                    onClick={() => setBoardEntryId(other.id)}
                  >
                    <span>{relation.confidence}</span>
                    <strong>{other.title}</strong>
                  </button>
                );
              })}
            </div>
            <div className="thread-list">
              {boardRelations.length > 0 ? boardRelations.map((relation) => {
                const otherId = relation.source === boardEntry.id ? relation.target : relation.source;
                const other = LORE_ENTRY_BY_ID[otherId];
                if (!other) return null;
                return (
                  <button key={`${relation.source}-${relation.target}`} type="button" className="thread-card" onClick={() => setBoardEntryId(other.id)}>
                    <span className={`confidence ${relation.confidence}`}>{relation.confidence}</span>
                    <strong>{other.title}</strong>
                    <small>{relation.type}</small>
                    <em>{relation.evidence}</em>
                  </button>
                );
              }) : (
                <div className="empty-thread">No matching connections for this filter.</div>
              )}
            </div>
          </div>
        </section>
      )}

      {activeView === "theories" && (
        <section className="lore-section">
          <SectionHeading label="Theory Files" detail="Speculation is clearly labeled. Canon is the evidence, not the conclusion." />
          <div className="theory-grid">
            {LORE_THEORIES.map((theory) => (
              <article key={theory.id} className="theory-card">
                <span className={`spec-level level-${theory.speculationLevel.toLowerCase()}`}>{theory.speculationLevel} speculation</span>
                <h3>{theory.title}</h3>
                <p>{theory.premise}</p>
                <div className="theory-evidence">
                  <strong>Evidence threads</strong>
                  {theory.evidenceIds.map((id) => {
                    const entry = LORE_ENTRY_BY_ID[id];
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
      )}

      {filteredEntries.length === 0 && (
        <section className="lore-empty">
          <Eye size={26} />
          <h2>No thread found</h2>
          <p>Try a broader search or switch back to all categories.</p>
        </section>
      )}

      {selectedEntry && <LoreEntryModal entry={selectedEntry} onClose={() => setSelectedEntry(null)} onOpen={openEntry} />}

      <style jsx global>{`
        .lore-page {
          --panel: rgba(13, 13, 16, 0.78);
          --line: rgba(255,255,255,0.08);
          --soft: rgba(255,255,255,0.055);
          box-sizing: border-box;
          max-width: 100%;
          min-height: calc(100vh - 40px);
          overflow-x: hidden;
          padding: 2rem;
          position: relative;
          background:
            linear-gradient(135deg, rgba(245,176,65,0.08), transparent 32rem),
            linear-gradient(225deg, rgba(56,189,248,0.08), transparent 38rem),
            #050506;
          color: #fff;
        }

        .lore-shade {
          background:
            linear-gradient(180deg, rgba(0,0,0,0.18), rgba(0,0,0,0.64)),
            repeating-linear-gradient(90deg, rgba(255,255,255,0.018) 0 1px, transparent 1px 86px);
          inset: 0;
          pointer-events: none;
          position: fixed;
          z-index: 1;
        }

        .lore-page *,
        .lore-page *::before,
        .lore-page *::after {
          box-sizing: border-box;
        }

        .lore-hero,
        .lore-toolbar,
        .category-rail,
        .lore-section,
        .lore-empty {
          margin-inline: auto;
          max-width: 1240px;
          min-width: 0;
          position: relative;
          width: 100%;
          z-index: 5;
        }

        .lore-hero {
          padding: 3rem 0 2rem;
        }

        .lore-eyebrow {
          align-items: center;
          color: #f5b041;
          display: inline-flex;
          font-size: 0.78rem;
          font-weight: 900;
          gap: 0.5rem;
          letter-spacing: 0.16em;
          margin-bottom: 1rem;
          text-transform: uppercase;
        }

        .lore-hero h1 {
          font-size: clamp(3rem, 8vw, 7rem);
          letter-spacing: 0;
          line-height: 0.95;
          margin: 0;
          max-width: 920px;
        }

        .lore-hero p {
          color: rgba(255,255,255,0.66);
          font-size: clamp(1rem, 2vw, 1.35rem);
          line-height: 1.6;
          margin-top: 1rem;
          max-width: 740px;
        }

        .lore-hero-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, max-content));
          gap: 0.75rem;
          margin-top: 1.5rem;
        }

        .lore-hero-stats span {
          background: rgba(255,255,255,0.045);
          border: 1px solid var(--line);
          border-radius: 8px;
          color: rgba(255,255,255,0.68);
          min-width: 0;
          overflow-wrap: anywhere;
          padding: 0.7rem 0.9rem;
        }

        .lore-hero-stats strong {
          color: #fff;
          font-family: var(--font-mono);
          margin-right: 0.35rem;
        }

        .lore-toolbar {
          align-items: center;
          background: var(--panel);
          border: 1px solid var(--line);
          border-radius: 8px;
          display: grid;
          gap: 1rem;
          grid-template-columns: minmax(240px, 1fr) auto;
          padding: 0.85rem;
          position: sticky;
          top: 0.75rem;
          z-index: 20;
          backdrop-filter: blur(18px);
        }

        .lore-search {
          align-items: center;
          background: rgba(0,0,0,0.32);
          border: 1px solid var(--line);
          border-radius: 7px;
          display: grid;
          gap: 0.65rem;
          grid-template-columns: auto minmax(0, 1fr);
          min-width: 0;
          padding: 0 0.8rem;
        }

        .lore-search:focus-within {
          border-color: rgba(245,176,65,0.58);
          box-shadow: 0 0 0 3px rgba(245,176,65,0.16);
        }

        .lore-search input {
          background: transparent;
          border: 0;
          color: #fff;
          font: inherit;
          min-height: 42px;
          outline: 0;
          width: 100%;
        }

        .lore-view-tabs,
        .category-rail,
        .confidence-tabs,
        .thread-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .lore-view-tabs button,
        .category-rail button,
        .confidence-tabs button,
        .thread-pills button,
        .board-center button {
          align-items: center;
          background: rgba(255,255,255,0.035);
          border: 1px solid var(--line);
          border-radius: 7px;
          color: rgba(255,255,255,0.72);
          cursor: pointer;
          display: inline-flex;
          font: inherit;
          font-size: 0.82rem;
          font-weight: 800;
          gap: 0.45rem;
          min-height: 38px;
          min-width: 0;
          overflow: hidden;
          padding: 0.55rem 0.8rem;
          transition: background 0.18s ease, border-color 0.18s ease, color 0.18s ease, transform 0.18s ease;
        }

        .lore-view-tabs button span {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .lore-view-tabs button:hover,
        .category-rail button:hover,
        .confidence-tabs button:hover,
        .thread-pills button:hover,
        .board-center button:hover {
          border-color: rgba(245,176,65,0.45);
          color: #fff;
          transform: translateY(-1px);
        }

        .lore-view-tabs button.active,
        .category-rail button.active,
        .confidence-tabs button.active {
          background: rgba(245,176,65,0.13);
          border-color: rgba(245,176,65,0.42);
          color: #fff;
        }

        .category-rail {
          margin-top: 1rem;
        }

        .category-rail button {
          border-color: color-mix(in srgb, var(--tone, #f5b041), transparent 78%);
        }

        .category-rail button span {
          color: color-mix(in srgb, var(--tone, #f5b041), white 20%);
          font-family: var(--font-mono);
        }

        .lore-section {
          margin-top: 2rem;
        }

        .section-heading {
          align-items: end;
          border-bottom: 1px solid var(--line);
          display: flex;
          justify-content: space-between;
          margin-bottom: 1rem;
          padding-bottom: 1rem;
          gap: 1rem;
        }

        .section-heading h2 {
          font-size: clamp(1.4rem, 3vw, 2.1rem);
          margin: 0;
        }

        .section-heading p {
          color: rgba(255,255,255,0.55);
          margin: 0;
          max-width: 560px;
          text-align: right;
        }

        .atlas-grid,
        .compact-grid,
        .theory-grid {
          display: grid;
          gap: 1rem;
          grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
        }

        .atlas-grid.tight {
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        }

        .lore-card,
        .compact-card,
        .theory-card,
        .timeline-item,
        .board-center,
        .thread-card,
        .empty-thread {
          background: var(--panel);
          border: 1px solid var(--line);
          border-radius: 8px;
          backdrop-filter: blur(16px);
        }

        .lore-card,
        .compact-card,
        .thread-card {
          appearance: none;
          border: 1px solid var(--line);
          cursor: pointer;
          font: inherit;
          text-align: left;
          transition: border-color 0.18s ease, transform 0.18s ease, background 0.18s ease;
          width: 100%;
        }

        .lore-card:hover,
        .compact-card:hover,
        .thread-card:hover {
          border-color: color-mix(in srgb, var(--tone, #f5b041), transparent 45%);
          transform: translateY(-3px);
        }

        .lore-card {
          color: #fff;
          min-height: 260px;
          overflow: hidden;
          padding: 1.15rem;
          position: relative;
        }

        .lore-card::before {
          background: linear-gradient(90deg, var(--tone), transparent);
          content: "";
          height: 3px;
          left: 0;
          position: absolute;
          right: 0;
          top: 0;
        }

        .card-topline {
          align-items: center;
          color: color-mix(in srgb, var(--tone), white 10%);
          display: flex;
          font-size: 0.72rem;
          font-weight: 900;
          gap: 0.45rem;
          letter-spacing: 0.08em;
          margin-bottom: 0.85rem;
          text-transform: uppercase;
        }

        .lore-card h3,
        .compact-card h3,
        .theory-card h3,
        .timeline-item h3,
        .board-center h3 {
          font-size: 1.2rem;
          line-height: 1.2;
          margin: 0 0 0.6rem;
          overflow-wrap: anywhere;
        }

        .lore-card p,
        .compact-card p,
        .theory-card p,
        .timeline-item p,
        .board-center p {
          color: rgba(255,255,255,0.62);
          line-height: 1.55;
          margin: 0;
        }

        .fact-list {
          display: grid;
          gap: 0.45rem;
          margin-top: 1rem;
        }

        .fact-list span {
          background: rgba(255,255,255,0.035);
          border: 1px solid var(--line);
          border-radius: 6px;
          color: rgba(255,255,255,0.72);
          font-size: 0.76rem;
          line-height: 1.4;
          padding: 0.45rem 0.55rem;
        }

        .card-footer {
          align-items: center;
          color: rgba(255,255,255,0.42);
          display: flex;
          font-size: 0.78rem;
          justify-content: space-between;
          margin-top: 1rem;
        }

        .compact-card {
          color: #fff;
          padding: 0.95rem;
        }

        .compact-card .card-topline {
          margin-bottom: 0.6rem;
        }

        .npc-network-panel {
          background:
            radial-gradient(circle at 0% 0%, rgba(245,176,65,0.12), transparent 34%),
            rgba(255,255,255,0.018);
          border: 1px solid var(--line);
          border-radius: 8px;
          margin-bottom: 1rem;
          overflow: hidden;
          padding: 1rem;
        }

        .npc-network-header {
          align-items: flex-start;
          border-bottom: 1px solid var(--line);
          display: flex;
          gap: 1rem;
          justify-content: space-between;
          margin-bottom: 1rem;
          padding-bottom: 1rem;
        }

        .npc-network-header span {
          align-items: center;
          color: #fff;
          display: inline-flex;
          flex: 0 0 auto;
          font-weight: 900;
          gap: 0.45rem;
        }

        .npc-network-header p {
          color: rgba(255,255,255,0.58);
          line-height: 1.45;
          margin: 0;
          max-width: 640px;
          text-align: right;
        }

        .npc-network-grid {
          display: grid;
          gap: 0.85rem;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        }

        .npc-region-card {
          background: rgba(0,0,0,0.2);
          border: 1px solid color-mix(in srgb, var(--tone), transparent 74%);
          border-radius: 8px;
          display: grid;
          gap: 0.85rem;
          min-width: 0;
          padding: 0.9rem;
        }

        .npc-region-head {
          border-bottom: 1px solid rgba(255,255,255,0.06);
          padding-bottom: 0.7rem;
        }

        .npc-region-head span,
        .npc-region-head small {
          color: color-mix(in srgb, var(--tone), white 12%);
          font-size: 0.68rem;
          font-weight: 900;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .npc-region-head h3 {
          color: #fff;
          font-size: 1rem;
          line-height: 1.2;
          margin: 0.25rem 0;
          overflow-wrap: anywhere;
        }

        .npc-chip-grid {
          display: grid;
          gap: 0.45rem;
          grid-template-columns: repeat(auto-fit, minmax(125px, 1fr));
        }

        .npc-chip-grid button {
          appearance: none;
          background: rgba(255,255,255,0.035);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 7px;
          color: #fff;
          cursor: pointer;
          display: grid;
          font: inherit;
          gap: 0.1rem;
          min-width: 0;
          padding: 0.55rem 0.65rem;
          text-align: left;
          transition: transform 0.18s ease, border-color 0.18s ease, background 0.18s ease;
        }

        .npc-chip-grid button:hover {
          background: rgba(255,255,255,0.06);
          border-color: color-mix(in srgb, var(--tone), transparent 52%);
          transform: translateY(-2px);
        }

        .npc-chip-grid strong {
          font-size: 0.82rem;
          line-height: 1.2;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .npc-chip-grid em {
          color: rgba(255,255,255,0.46);
          font-size: 0.66rem;
          font-style: normal;
          font-weight: 800;
        }

        .timeline-list {
          display: grid;
          gap: 1rem;
        }

        .timeline-item {
          display: grid;
          gap: 1rem;
          grid-template-columns: 150px minmax(0, 1fr);
          padding: 1.2rem;
        }

        .timeline-era {
          color: #f5b041;
          font-family: var(--font-mono);
          font-size: 0.95rem;
          font-weight: 900;
        }

        .thread-pills {
          margin-top: 1rem;
        }

        .board-controls {
          align-items: center;
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          justify-content: space-between;
          margin-bottom: 1rem;
        }

        .board-controls select {
          background: rgba(0,0,0,0.45);
          border: 1px solid var(--line);
          border-radius: 7px;
          color: #fff;
          font: inherit;
          min-height: 42px;
          min-width: min(360px, 100%);
          padding: 0 0.85rem;
        }

        .mystery-board {
          align-items: start;
          display: grid;
          gap: 1rem;
          grid-template-columns: minmax(250px, 0.75fr) minmax(270px, 0.9fr) minmax(0, 1.2fr);
        }

        .board-center {
          border-color: color-mix(in srgb, var(--tone), transparent 55%);
          padding: 1.2rem;
        }

        .board-center > span {
          color: color-mix(in srgb, var(--tone), white 10%);
          display: inline-flex;
          font-size: 0.72rem;
          font-weight: 900;
          gap: 0.45rem;
          letter-spacing: 0.08em;
          margin-bottom: 0.9rem;
          text-transform: uppercase;
        }

        .board-center button {
          margin-top: 1rem;
        }

        .board-stat-row {
          display: grid;
          gap: 0.5rem;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          margin-top: 1rem;
        }

        .board-stat-row span {
          background: rgba(0,0,0,0.22);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 7px;
          color: rgba(255,255,255,0.6);
          font-size: 0.68rem;
          padding: 0.55rem;
          text-transform: uppercase;
        }

        .board-stat-row strong {
          color: #fff;
          display: block;
          font-size: 1rem;
          margin-bottom: 0.08rem;
        }

        .board-map {
          align-self: start;
          background:
            radial-gradient(circle at 50% 50%, rgba(245,176,65,0.14), transparent 34%),
            repeating-linear-gradient(35deg, rgba(255,255,255,0.035) 0 1px, transparent 1px 20px),
            rgba(255,255,255,0.018);
          border: 1px solid var(--line);
          border-radius: 8px;
          display: grid;
          gap: 0.75rem;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          min-height: 0;
          overflow: hidden;
          padding: 1rem;
          position: relative;
        }

        .board-map::before,
        .board-map::after {
          border: 1px dashed rgba(245,176,65,0.22);
          border-radius: 999px;
          content: "";
          inset: 22%;
          pointer-events: none;
          position: absolute;
        }

        .board-map::after {
          inset: 8%;
          opacity: 0.45;
        }

        .board-map-core {
          align-items: center;
          background: rgba(5,5,6,0.84);
          border: 1px solid rgba(245,176,65,0.36);
          border-radius: 14px;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          grid-column: 1 / -1;
          justify-self: center;
          max-width: min(100%, 280px);
          min-height: 0;
          padding: 1rem;
          position: relative;
          text-align: center;
          width: 100%;
          z-index: 2;
        }

        .board-map-core span,
        .board-node span {
          color: #f8d38d;
          font-size: 0.58rem;
          font-weight: 900;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .board-map-core strong {
          color: #fff;
          font-size: 0.92rem;
          line-height: 1.2;
          overflow-wrap: anywhere;
        }

        .board-node {
          appearance: none;
          background: rgba(5,5,6,0.82);
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 8px;
          color: #fff;
          cursor: pointer;
          display: grid;
          font: inherit;
          gap: 0.2rem;
          max-width: none;
          min-width: 0;
          padding: 0.55rem 0.65rem;
          position: relative;
          text-align: left;
          transition: transform 0.18s ease, border-color 0.18s ease, background 0.18s ease;
          width: 100%;
          z-index: 3;
        }

        .board-node:hover {
          background: rgba(255,255,255,0.055);
          border-color: rgba(245,176,65,0.45);
          transform: translateY(-2px);
        }

        .board-node strong {
          font-size: 0.72rem;
          line-height: 1.18;
          overflow-wrap: anywhere;
        }

        .board-node.canon span { color: #86efac; }
        .board-node.inferred span { color: #7dd3fc; }
        .board-node.theory span { color: #f8d38d; }

        .thread-list {
          display: grid;
          gap: 0.75rem;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
        }

        .thread-card {
          color: #fff;
          display: grid;
          gap: 0.35rem;
          min-width: 0;
          padding: 0.9rem;
        }

        .thread-card small,
        .thread-card em {
          color: rgba(255,255,255,0.55);
          font-style: normal;
          line-height: 1.35;
        }

        .confidence,
        .spec-level {
          border-radius: 999px;
          display: inline-flex;
          font-size: 0.65rem;
          font-weight: 900;
          letter-spacing: 0.08em;
          padding: 0.2rem 0.55rem;
          text-transform: uppercase;
          width: max-content;
        }

        .confidence.canon,
        .level-low {
          background: rgba(74,222,128,0.11);
          color: #86efac;
        }

        .confidence.inferred,
        .level-medium {
          background: rgba(245,176,65,0.12);
          color: #facc15;
        }

        .confidence.theory,
        .level-high {
          background: rgba(248,113,113,0.13);
          color: #fca5a5;
        }

        .empty-thread,
        .lore-empty {
          align-items: center;
          color: rgba(255,255,255,0.55);
          display: flex;
          justify-content: center;
          min-height: 180px;
          padding: 1.5rem;
          text-align: center;
        }

        .theory-card {
          padding: 1.15rem;
        }

        .theory-evidence {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-top: 1rem;
        }

        .theory-evidence strong {
          color: rgba(255,255,255,0.5);
          flex-basis: 100%;
          font-size: 0.72rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .theory-evidence button {
          background: rgba(255,255,255,0.045);
          border: 1px solid var(--line);
          border-radius: 999px;
          color: #fff;
          cursor: pointer;
          font: inherit;
          font-size: 0.78rem;
          padding: 0.35rem 0.65rem;
        }

        .counterpoint {
          align-items: flex-start;
          background: rgba(248,113,113,0.08);
          border: 1px solid rgba(248,113,113,0.16);
          border-radius: 7px;
          color: rgba(255,255,255,0.7);
          display: flex;
          gap: 0.5rem;
          line-height: 1.45;
          margin-top: 1rem;
          padding: 0.7rem;
        }

        .lore-empty {
          border: 1px solid var(--line);
          border-radius: 8px;
          flex-direction: column;
          margin-top: 2rem;
        }

        @media (max-width: 960px) {
          .lore-toolbar,
          .mystery-board,
          .timeline-item {
            grid-template-columns: 1fr;
          }

          .lore-toolbar {
            position: relative;
            top: auto;
          }

          .section-heading {
            align-items: flex-start;
            flex-direction: column;
          }

          .section-heading p {
            text-align: left;
          }

          .npc-network-header {
            flex-direction: column;
          }

          .npc-network-header p {
            text-align: left;
          }
        }

        @media (max-width: 560px) {
          .lore-page {
            max-width: 100vw;
            padding: 1rem;
            width: 100vw;
          }

          .lore-hero,
          .lore-toolbar,
          .category-rail,
          .lore-section,
          .lore-empty {
            margin-inline: 0;
            max-width: min(100%, 358px);
            width: min(100%, 358px);
          }

          .lore-hero {
            padding-top: 1.5rem;
          }

          .lore-hero-stats {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .lore-view-tabs {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .lore-view-tabs button,
          .category-rail button {
            justify-content: center;
            width: 100%;
          }

          .board-map {
            grid-template-columns: 1fr;
          }

          .category-rail {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .atlas-grid,
          .atlas-grid.tight,
          .compact-grid,
          .theory-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  );
}

function SectionHeading({ label, detail }: { label: string; detail: string }) {
  return (
    <div className="section-heading">
      <h2>{label}</h2>
      <p>{detail}</p>
    </div>
  );
}

function LoreCard({ entry, onOpen }: { entry: LoreEntry; onOpen: (entry: LoreEntry) => void }) {
  const meta = CATEGORY_META[entry.category];
  return (
    <button className="lore-card" style={{ "--tone": meta.tone } as CSSProperties} onClick={() => onOpen(entry)} type="button">
      <div className="card-topline">{meta.icon} {meta.label}</div>
      <h3>{entry.title}</h3>
      <p>{entry.summary}</p>
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

function LoreCompactCard({ entry, onOpen }: { entry: LoreEntry; onOpen: (entry: LoreEntry) => void }) {
  const meta = CATEGORY_META[entry.category];
  return (
    <button className="compact-card" style={{ "--tone": meta.tone } as CSSProperties} onClick={() => onOpen(entry)} type="button">
      <div className="card-topline">{meta.icon} {meta.label}</div>
      <h3>{entry.title}</h3>
      <p>{entry.keyFacts[0] || entry.summary}</p>
    </button>
  );
}

function LoreEntryModal({
  entry,
  onClose,
  onOpen,
}: {
  entry: LoreEntry;
  onClose: () => void;
  onOpen: (entry: LoreEntry) => void;
}) {
  const meta = CATEGORY_META[entry.category];
  const related = entry.relatedIds.map((id) => LORE_ENTRY_BY_ID[id]).filter(Boolean).slice(0, 10);
  const itemLinks = LORE_ITEM_LINKS.filter((link) => (link.entryIds as readonly string[]).includes(entry.id)).slice(0, 8);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div className="lore-modal-shell" onClick={onClose}>
      <article className="lore-modal" onClick={(event) => event.stopPropagation()} style={{ "--tone": meta.tone } as CSSProperties}>
        <header>
          <div>
            <span>{meta.icon} {meta.label}</span>
            <h2>{entry.title}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close lore entry"><X size={20} /></button>
        </header>

        <div className="modal-grid">
          <section className="modal-panel span-two">
            <h3>Official Archive Summary</h3>
            <p>{entry.summary}</p>
            <a href={entry.sourceUrl} target="_blank" rel="noreferrer">
              Read official source <ExternalLink size={14} />
            </a>
          </section>

          <section className="modal-panel">
            <h3>Key Facts</h3>
            <div className="modal-list">
              {entry.keyFacts.map((fact) => <span key={fact}>{fact}</span>)}
            </div>
          </section>

          <section className="modal-panel">
            <h3>Thread Connections</h3>
            <div className="related-grid">
              {related.length > 0 ? related.map((rel) => (
                <button key={rel.id} type="button" onClick={() => onOpen(rel)}>
                  {rel.title}
                </button>
              )) : <span className="muted">No direct links preserved.</span>}
            </div>
          </section>

          <section className="modal-panel span-two">
            <h3>Source Sections</h3>
            <div className="section-notes">
              {entry.sections.length > 0 ? entry.sections.map((section) => (
                <div key={section.title}>
                  <strong>{section.title}</strong>
                  <p>{section.body}</p>
                </div>
              )) : <p className="muted">This index page acts mainly as a doorway to related records.</p>}
            </div>
          </section>

          {itemLinks.length > 0 && (
            <section className="modal-panel span-two">
              <h3>Item Lore Hooks</h3>
              <div className="item-link-grid">
                {itemLinks.map((link) => (
                  <span key={`${entry.id}-${link.itemName}`}>
                    <strong>{link.itemName}</strong>
                    <em>{link.confidence}: {link.reason}</em>
                  </span>
                ))}
              </div>
            </section>
          )}
        </div>
      </article>

      <style jsx>{`
        .lore-modal-shell {
          align-items: center;
          background: rgba(0,0,0,0.78);
          backdrop-filter: blur(14px);
          display: flex;
          inset: 0;
          justify-content: center;
          padding: 1.25rem;
          position: fixed;
          z-index: 9999;
        }

        .lore-modal {
          background: #101012;
          border: 1px solid color-mix(in srgb, var(--tone), transparent 62%);
          border-radius: 10px;
          box-shadow: 0 32px 80px rgba(0,0,0,0.58);
          color: #fff;
          max-height: 90vh;
          max-width: 980px;
          overflow: hidden;
          width: 100%;
        }

        header {
          align-items: center;
          border-bottom: 1px solid rgba(255,255,255,0.08);
          display: flex;
          gap: 1rem;
          justify-content: space-between;
          padding: 1.25rem 1.4rem;
        }

        header span {
          color: color-mix(in srgb, var(--tone), white 10%);
          display: inline-flex;
          font-size: 0.72rem;
          font-weight: 900;
          gap: 0.45rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        header h2 {
          font-size: clamp(1.35rem, 4vw, 2rem);
          line-height: 1.1;
          margin: 0.35rem 0 0;
          overflow-wrap: anywhere;
        }

        header button {
          align-items: center;
          background: rgba(255,255,255,0.045);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 7px;
          color: rgba(255,255,255,0.62);
          cursor: pointer;
          display: inline-flex;
          flex: 0 0 auto;
          height: 38px;
          justify-content: center;
          width: 38px;
        }

        .modal-grid {
          display: grid;
          gap: 1rem;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          max-height: calc(90vh - 98px);
          overflow-y: auto;
          padding: 1.2rem;
        }

        .modal-panel {
          background: rgba(255,255,255,0.035);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 8px;
          min-width: 0;
          padding: 1rem;
        }

        .span-two {
          grid-column: 1 / -1;
        }

        .modal-panel h3 {
          color: rgba(255,255,255,0.5);
          font-size: 0.75rem;
          letter-spacing: 0.08em;
          margin: 0 0 0.75rem;
          text-transform: uppercase;
        }

        .modal-panel p {
          color: rgba(255,255,255,0.68);
          line-height: 1.6;
          margin: 0;
        }

        .modal-panel a {
          align-items: center;
          color: color-mix(in srgb, var(--tone), white 18%);
          display: inline-flex;
          font-weight: 800;
          gap: 0.4rem;
          margin-top: 0.9rem;
          text-decoration: none;
        }

        .modal-list,
        .related-grid,
        .section-notes,
        .item-link-grid {
          display: grid;
          gap: 0.6rem;
        }

        .modal-list span,
        .section-notes div,
        .item-link-grid span {
          background: rgba(0,0,0,0.18);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 7px;
          color: rgba(255,255,255,0.72);
          line-height: 1.45;
          padding: 0.65rem;
        }

        .section-notes strong,
        .item-link-grid strong {
          color: #fff;
          display: block;
          margin-bottom: 0.25rem;
        }

        .item-link-grid em {
          color: rgba(255,255,255,0.58);
          display: block;
          font-style: normal;
        }

        .related-grid {
          grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
        }

        .related-grid button {
          background: rgba(255,255,255,0.045);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 7px;
          color: #fff;
          cursor: pointer;
          font: inherit;
          font-size: 0.82rem;
          font-weight: 800;
          min-height: 38px;
          padding: 0.55rem;
          text-align: left;
        }

        .muted {
          color: rgba(255,255,255,0.5);
        }

        @media (max-width: 720px) {
          .lore-modal-shell {
            align-items: stretch;
            padding: 0;
          }

          .lore-modal {
            border-radius: 0;
            max-height: 100dvh;
          }

          header {
            align-items: flex-start;
          }

          .modal-grid {
            grid-template-columns: 1fr;
            max-height: calc(100dvh - 96px);
          }
        }
      `}</style>
    </div>
  );
}

type LoreParticle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  pulse: number;
};

function LoreCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let animationFrame = 0;
    let particles: LoreParticle[] = [];
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * ratio);
      canvas.height = Math.floor(height * ratio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      particles = Array.from({ length: reducedMotion ? 28 : width < 700 ? 42 : 90 }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.18,
        size: Math.random() * 1.8 + 0.5,
        alpha: Math.random() * 0.45 + 0.16,
        pulse: Math.random() * Math.PI * 2,
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.strokeStyle = "rgba(245,176,65,0.08)";
      ctx.lineWidth = 1;

      for (let i = 0; i < particles.length; i += 1) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.pulse += 0.012;
        if (p.x < -20) p.x = width + 20;
        if (p.x > width + 20) p.x = -20;
        if (p.y < -20) p.y = height + 20;
        if (p.y > height + 20) p.y = -20;

        ctx.fillStyle = `rgba(255,255,255,${p.alpha + Math.sin(p.pulse) * 0.08})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        for (let j = i + 1; j < particles.length; j += 1) {
          const other = particles[j];
          const dx = p.x - other.x;
          const dy = p.y - other.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < 120) {
            ctx.globalAlpha = (1 - distance / 120) * 0.45;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(other.x, other.y);
            ctx.stroke();
            ctx.globalAlpha = 1;
          }
        }
      }

      if (!reducedMotion) animationFrame = requestAnimationFrame(draw);
    };

    resize();
    draw();
    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationFrame);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }} />;
}

export default function LorePage() {
  return (
    <Suspense fallback={<main className="container">Loading lore archive...</main>}>
      <LoreContent />
    </Suspense>
  );
}
