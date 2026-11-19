import type { CSSProperties, KeyboardEvent as ReactKeyboardEvent, RefObject } from "react";
import { ChevronRight, Search } from "lucide-react";
import type { LoreEntry, LoreRelation } from "@/data/lore";
import { SectionHeading } from "./SectionHeading";
import {
  CATEGORY_META,
  cleanLoreCopy,
  type LoreFilter,
  type RelationFilter,
} from "../types";

export function LoreMysteryBoardView({
  search,
  boardPickerRef,
  boardPickerTriggerRef,
  boardPickerOpen,
  toggleBoardPicker,
  boardPickerListId,
  boardEntry,
  boardPickerSearch,
  setBoardPickerSearch,
  setActiveBoardOptionIndex,
  handleBoardPickerSearchKeyDown,
  boardPickerCategory,
  setBoardPickerCategory,
  filteredBoardOptions,
  activeBoardOptionIndex,
  activeBoardOptionId,
  getBoardOptionId,
  selectBoardEntry,
  relationFilter,
  setRelationFilter,
  boardStats,
  boardGraphRelations,
  boardRelations,
  entryById,
  openEntry,
  setBoardEntryId,
}: {
  search: string;
  boardPickerRef: RefObject<HTMLDivElement | null>;
  boardPickerTriggerRef: RefObject<HTMLButtonElement | null>;
  boardPickerOpen: boolean;
  toggleBoardPicker: () => void;
  boardPickerListId: string;
  boardEntry: LoreEntry;
  boardPickerSearch: string;
  setBoardPickerSearch: (value: string) => void;
  setActiveBoardOptionIndex: (val: number | ((prev: number) => number)) => void;
  handleBoardPickerSearchKeyDown: (event: ReactKeyboardEvent<HTMLInputElement>) => void;
  boardPickerCategory: LoreFilter;
  setBoardPickerCategory: (cat: LoreFilter) => void;
  filteredBoardOptions: LoreEntry[];
  activeBoardOptionIndex: number;
  activeBoardOptionId?: string;
  getBoardOptionId: (id: string) => string;
  selectBoardEntry: (id: string) => void;
  relationFilter: RelationFilter;
  setRelationFilter: (rel: RelationFilter) => void;
  boardStats: { total: number; canon: number; inferred: number; theory: number };
  boardGraphRelations: LoreRelation[];
  boardRelations: LoreRelation[];
  entryById: Record<string, LoreEntry>;
  openEntry: (entry: LoreEntry) => void;
  setBoardEntryId: (id: string) => void;
}) {
  return (
    <section className="lore-section">
      <SectionHeading label="Mystery Board" detail="Official links first. The red-string energy is optional, but encouraged." />
      {search.trim() && (
        <p className="board-search-note">Page search filters Atlas, Characters, and Artifacts views. Use the thread search inside this board to change the selected mystery thread.</p>
      )}
      <div className="board-controls">
        <div className="board-picker" ref={boardPickerRef}>
          <button
            type="button"
            className="board-picker-trigger"
            onClick={toggleBoardPicker}
            aria-expanded={boardPickerOpen}
            aria-controls={boardPickerListId}
            aria-haspopup="listbox"
            ref={boardPickerTriggerRef}
          >
            <span className="board-picker-mark" style={{ "--tone": CATEGORY_META[boardEntry.category].tone } as CSSProperties}>
              {CATEGORY_META[boardEntry.category].icon}
            </span>
            <span className="board-picker-copy">
              <small>{CATEGORY_META[boardEntry.category].label} thread</small>
              <strong>{boardEntry.title}</strong>
            </span>
            <ChevronRight className={boardPickerOpen ? "open" : ""} size={17} />
          </button>

          {boardPickerOpen && (
            <div className="board-picker-popover">
              <label className="board-picker-search">
                <Search size={15} />
                <input
                  aria-activedescendant={activeBoardOptionId}
                  aria-autocomplete="list"
                  aria-controls={boardPickerListId}
                  aria-expanded={boardPickerOpen}
                  aria-label="Search lore board threads"
                  role="combobox"
                  value={boardPickerSearch}
                  onChange={(event) => {
                    setBoardPickerSearch(event.target.value);
                    setActiveBoardOptionIndex(0);
                  }}
                  onKeyDown={handleBoardPickerSearchKeyDown}
                  placeholder="Search threads..."
                  autoFocus
                />
              </label>
              <div className="board-picker-categories" role="group" aria-label="Board thread categories">
                <button
                  type="button"
                  className={boardPickerCategory === "all" ? "active" : ""}
                  aria-pressed={boardPickerCategory === "all"}
                  onClick={() => {
                    setBoardPickerCategory("all");
                    setActiveBoardOptionIndex(0);
                  }}
                >
                  All
                </button>
                {(Object.keys(CATEGORY_META) as LoreEntry["category"][]).map((category) => (
                  <button
                    key={category}
                    type="button"
                    className={boardPickerCategory === category ? "active" : ""}
                    aria-pressed={boardPickerCategory === category}
                    onClick={() => {
                      setBoardPickerCategory(category);
                      setActiveBoardOptionIndex(0);
                    }}
                    style={{ "--tone": CATEGORY_META[category].tone } as CSSProperties}
                  >
                    {CATEGORY_META[category].label}
                  </button>
                ))}
              </div>
              <div id={boardPickerListId} className="board-option-list custom-scrollbar" role="listbox" aria-label="Lore board threads">
                {filteredBoardOptions.length > 0 ? filteredBoardOptions.map((entry, index) => {
                  const meta = CATEGORY_META[entry.category];
                  const isActive = index === activeBoardOptionIndex;
                  const isSelected = entry.id === boardEntry.id;
                  return (
                    <button
                      key={entry.id}
                      id={getBoardOptionId(entry.id)}
                      type="button"
                      className={`${isActive ? "active" : ""} ${isSelected ? "selected" : ""}`.trim()}
                      role="option"
                      aria-selected={isActive}
                      onClick={() => selectBoardEntry(entry.id)}
                      tabIndex={-1}
                      style={{ "--tone": meta.tone } as CSSProperties}
                    >
                      <span>{meta.icon}</span>
                      <strong>{entry.title}</strong>
                      <small>{meta.label}</small>
                    </button>
                  );
                }) : (
                  <div className="board-picker-empty">No matching lore thread.</div>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="confidence-tabs">
          {(["all", "canon", "inferred", "theory"] as RelationFilter[]).map((filter) => (
            <button
              key={filter}
              className={relationFilter === filter ? "active" : ""}
              aria-pressed={relationFilter === filter}
              onClick={() => setRelationFilter(filter)}
              type="button"
            >
              {filter}
            </button>
          ))}
        </div>
      </div>
      <div className="mystery-board">
        <article className="board-center" style={{ "--tone": CATEGORY_META[boardEntry.category].tone } as CSSProperties}>
          <span>{CATEGORY_META[boardEntry.category].icon} {CATEGORY_META[boardEntry.category].label}</span>
          <h3>{boardEntry.title}</h3>
          <p>{cleanLoreCopy(boardEntry.summary)}</p>
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
            const other = entryById[otherId];
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
            const other = entryById[otherId];
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
  );
}
