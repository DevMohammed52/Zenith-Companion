import { useMemo, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent, type RefObject } from "react";
import type { LoreEntry, LoreRelation } from "@/data/lore";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionHeading } from "./SectionHeading";
import {
  CATEGORY_META,
  cleanLoreCopy,
  type LoreFilter,
  type RelationFilter,
} from "../types";
import styles from "../Lore.module.css";

function getConfidenceBorderClass(confidence: LoreRelation["confidence"]) {
  if (confidence === "canon") return styles.confCanon;
  if (confidence === "inferred") return styles.confInferred;
  return styles.confTheory;
}

function getConfidenceTextClass(confidence: LoreRelation["confidence"]) {
  if (confidence === "canon") return styles.confidenceCanon;
  if (confidence === "inferred") return styles.confidenceInferred;
  return styles.confidenceTheory;
}

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
  const confidenceOptions = useMemo<Array<{ value: RelationFilter; label: string }>>(
    () => [
      { value: "all", label: "All Links" },
      { value: "canon", label: "Canon" },
      { value: "inferred", label: "Inferred" },
      { value: "theory", label: "Theory" },
    ],
    [],
  );

  return (
    <section className={styles.section} aria-label="Interactive mystery board">
      <SectionHeading
        label="Mystery Board"
        detail="Explore connections between relics, civilizations, and historical figures."
      />
      {search.trim() && (
        <p className={styles.boardSearchNote}>
          Page search filters Atlas, Characters, and Artifacts. Use the thread search below to pick a mystery node.
        </p>
      )}
      <div className={styles.boardControls}>
        <div className={styles.boardPicker} ref={boardPickerRef}>
          <button
            type="button"
            className={styles.boardPickerTrigger}
            onClick={toggleBoardPicker}
            aria-expanded={boardPickerOpen}
            aria-controls={boardPickerListId}
            aria-haspopup="listbox"
            ref={boardPickerTriggerRef}
          >
            <span className={styles.boardPickerMark} style={{ "--tone": CATEGORY_META[boardEntry.category].tone } as CSSProperties}>
              {CATEGORY_META[boardEntry.category].icon}
            </span>
            <span className={styles.boardPickerCopy}>
              <small>{CATEGORY_META[boardEntry.category].label} thread</small>
              <strong>{boardEntry.title}</strong>
            </span>
            <Icon
              name="chevronRight"
              size="md"
              className={`${styles.boardPickerChevron} ${boardPickerOpen ? styles.boardPickerChevronOpen : ""}`}
              aria-hidden="true"
            />
          </button>

          {boardPickerOpen && (
            <div className={styles.boardPickerPopover}>
              <label className={styles.boardPickerSearch}>
                <Icon name="search" size="sm" aria-hidden="true" />
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
              <div className={styles.boardPickerCategories} role="group" aria-label="Board thread categories">
                <button
                  type="button"
                  className={boardPickerCategory === "all" ? styles.boardPickerCategoryActive : ""}
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
                    className={boardPickerCategory === category ? styles.boardPickerCategoryActive : ""}
                    aria-pressed={boardPickerCategory === category}
                    onClick={() => {
                      setBoardPickerCategory(category);
                      setActiveBoardOptionIndex(0);
                    }}
                  >
                    {CATEGORY_META[category].label}
                  </button>
                ))}
              </div>
              <div id={boardPickerListId} className={styles.boardOptionList} role="listbox" aria-label="Lore board threads">
                {filteredBoardOptions.length > 0 ? filteredBoardOptions.map((entry, index) => {
                  const meta = CATEGORY_META[entry.category];
                  const isActive = index === activeBoardOptionIndex;
                  const isSelected = entry.id === boardEntry.id;
                  return (
                    <button
                      key={entry.id}
                      id={getBoardOptionId(entry.id)}
                      type="button"
                      className={`${isActive ? styles.boardOptionActive : ""} ${isSelected ? styles.boardOptionSelected : ""}`.trim()}
                      role="option"
                      aria-selected={isActive}
                      onClick={() => selectBoardEntry(entry.id)}
                      tabIndex={-1}
                    >
                      <span>{meta.icon}</span>
                      <strong>{entry.title}</strong>
                      <small>{meta.label}</small>
                    </button>
                  );
                }) : (
                  <div className={styles.boardPickerEmpty}>No matching lore thread.</div>
                )}
              </div>
            </div>
          )}
        </div>

        <SegmentedControl
          options={confidenceOptions}
          value={relationFilter}
          onChange={setRelationFilter}
          ariaLabel="Filter connections by confidence"
          size="sm"
        />
      </div>

      <div className={styles.mysteryBoard}>
        <article className={styles.boardCenter} style={{ "--tone": CATEGORY_META[boardEntry.category].tone } as CSSProperties}>
          <span className={styles.boardCenterBadge}>
            {CATEGORY_META[boardEntry.category].icon}
            <span>{CATEGORY_META[boardEntry.category].label}</span>
          </span>
          <h3 className={styles.boardCenterTitle}>{boardEntry.title}</h3>
          <p className={styles.boardCenterSummary}>{cleanLoreCopy(boardEntry.summary)}</p>
          <div className={styles.boardStatStrip}>
            <span className={styles.boardStatCell}><strong>{boardStats.total}</strong> total</span>
            <span className={styles.boardStatCell}><strong>{boardStats.canon}</strong> canon</span>
            <span className={styles.boardStatCell}><strong>{boardStats.inferred}</strong> inferred</span>
            <span className={styles.boardStatCell}><strong>{boardStats.theory}</strong> theory</span>
          </div>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => openEntry(boardEntry)}
            className={styles.boardOpenBtn}
          >
            Open dossier
          </Button>
        </article>

        <div className={styles.boardMap} aria-label={`Connection map for ${boardEntry.title}`}>
          <div className={styles.boardMapCore}>
            <span>{CATEGORY_META[boardEntry.category].label}</span>
            <strong>{boardEntry.title}</strong>
          </div>
          {boardGraphRelations.map((relation) => {
            const otherId = relation.source === boardEntry.id ? relation.target : relation.source;
            const other = entryById[otherId];
            if (!other) return null;
            return (
              <button
                key={`node-${relation.source}-${relation.target}`}
                type="button"
                className={`${styles.boardNode} ${getConfidenceBorderClass(relation.confidence)}`}
                onClick={() => setBoardEntryId(other.id)}
                aria-label={`Switch focus to ${other.title} (${relation.confidence})`}
              >
                <span>{relation.confidence}</span>
                <strong>{other.title}</strong>
              </button>
            );
          })}
        </div>

        <div className={styles.threadList}>
          {boardRelations.length > 0 ? boardRelations.map((relation) => {
            const otherId = relation.source === boardEntry.id ? relation.target : relation.source;
            const other = entryById[otherId];
            if (!other) return null;
            return (
              <button
                key={`${relation.source}-${relation.target}`}
                type="button"
                className={styles.threadCard}
                onClick={() => setBoardEntryId(other.id)}
                aria-label={`View thread with ${other.title}`}
              >
                <span className={`${styles.confidenceLabel} ${getConfidenceTextClass(relation.confidence)}`}>
                  {relation.confidence}
                </span>
                <strong>{other.title}</strong>
                <small>{relation.type}</small>
                <em>{relation.evidence}</em>
              </button>
            );
          }) : (
            <EmptyState
              size="sm"
              variant="search-empty"
              title="No matching connections"
              description="Try switching back to All Links to view every recorded thread."
            />
          )}
        </div>
      </div>
    </section>
  );
}
