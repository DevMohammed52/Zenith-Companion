"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  FileClock,
  Filter,
  RotateCcw,
  Search,
  Tag,
} from "lucide-react";
import styles from "./page.module.css";

type PatchContentBlock = {
  type: "heading" | "listItem" | "paragraph" | "image";
  text: string;
};

type PatchSection = {
  heading: string;
  blocks: PatchContentBlock[];
};

type PatchNote = {
  id: number;
  version: string;
  title: string;
  headline: string;
  releasedAt: string | null;
  releaseLabel: string;
  releaseDateLabel: string | null;
  page: number;
  sourceUrl: string;
  categories: string[];
  excerpt: string;
  contentBlocks: PatchContentBlock[];
  sections: PatchSection[];
  bodyText: string;
  searchText: string;
};

type PatchNotesPayload = {
  meta: {
    generatedAt: string;
    source: string;
    mode: string;
    totalAvailable: number;
    totalFetched: number;
    fetchedPages: number[];
    latestPatchId: number | null;
    oldestPatchId: number | null;
    latestVersion: string | null;
    oldestVersion: string | null;
    categoryCounts: Record<string, number>;
  };
  patchNotes: PatchNote[];
};

const CATEGORY_LABELS: Record<string, string> = {
  "public-api": "Public API",
  combat: "Combat",
  hunting: "Hunting",
  dungeons: "Dungeons",
  "world-bosses": "World Bosses",
  pets: "Pets",
  guilds: "Guilds",
  conquest: "Conquest",
  housing: "Housing",
  economy: "Economy",
  alchemy: "Alchemy",
  forge: "Forge",
  skills: "Skills",
  items: "Items",
  weather: "Weather",
  map: "Map",
  tavern: "Tavern",
  translations: "Translations",
  "mobile-ui": "Mobile/UI",
  seasonal: "Seasonal",
  membership: "Membership",
  quests: "Quests",
  "bug-fixes": "Bug Fixes",
};

const ALL_CATEGORIES = "all";
const INITIAL_VISIBLE = 24;

function formatDate(value: string | null, fallback: string | null) {
  if (fallback) return fallback;
  if (!value) return "Unknown date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function getYear(value: string | null) {
  if (!value) return "Unknown";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Unknown" : String(date.getFullYear());
}

function highlightText(text: string, query: string) {
  const trimmed = query.trim();
  if (!trimmed) return text;

  const index = text.toLowerCase().indexOf(trimmed.toLowerCase());
  if (index === -1) return text;

  return (
    <>
      {text.slice(0, index)}
      <mark>{text.slice(index, index + trimmed.length)}</mark>
      {text.slice(index + trimmed.length)}
    </>
  );
}

export default function PatchNotesClient() {
  const [payload, setPayload] = useState<PatchNotesPayload | null>(null);
  const [loadError, setLoadError] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(ALL_CATEGORIES);
  const [year, setYear] = useState(ALL_CATEGORIES);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);

  useEffect(() => {
    let active = true;
    fetch("/idlemmo-patch-notes.json", { cache: "no-cache" })
      .then((response) => {
        if (!response.ok) throw new Error("Patch notes archive is unavailable.");
        return response.json() as Promise<PatchNotesPayload>;
      })
      .then((data) => {
        if (!active) return;
        setPayload(data);
        setLoadError("");
      })
      .catch((error: unknown) => {
        if (!active) return;
        setLoadError(error instanceof Error ? error.message : "Could not load patch notes.");
      });

    return () => {
      active = false;
    };
  }, []);

  const patchNotes = useMemo(() => payload?.patchNotes ?? [], [payload]);

  const years = useMemo(() => {
    return Array.from(new Set(patchNotes.map((note) => getYear(note.releasedAt)))).sort((a, b) => b.localeCompare(a));
  }, [patchNotes]);

  const categories = useMemo(() => {
    const counts = payload?.meta.categoryCounts ?? {};
    return Object.keys(counts).sort((a, b) => {
      const byCount = (counts[b] || 0) - (counts[a] || 0);
      if (byCount !== 0) return byCount;
      return (CATEGORY_LABELS[a] || a).localeCompare(CATEGORY_LABELS[b] || b);
    });
  }, [payload]);

  const filteredNotes = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return patchNotes.filter((note) => {
      if (category !== ALL_CATEGORIES && !note.categories.includes(category)) return false;
      if (year !== ALL_CATEGORIES && getYear(note.releasedAt) !== year) return false;
      if (!normalizedQuery) return true;
      return note.searchText.includes(normalizedQuery);
    });
  }, [category, patchNotes, query, year]);

  const visibleNotes = filteredNotes.slice(0, visibleCount);
  const latestNote = patchNotes[0];
  const hasFilters = query.trim() || category !== ALL_CATEGORIES || year !== ALL_CATEGORIES;
  const isLoading = !payload && !loadError;
  const archiveUpdated = payload?.meta.generatedAt ? formatDate(payload.meta.generatedAt, null) : null;

  const resetFilters = () => {
    setQuery("");
    setCategory(ALL_CATEGORIES);
    setYear(ALL_CATEGORIES);
    setVisibleCount(INITIAL_VISIBLE);
  };

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div>
          <span className={styles.eyebrow}><FileClock size={16} /> IdleMMO Archive</span>
          <h1>IdleMMO Patch Notes</h1>
          <p>
            Search the official IdleMMO patch note history by feature, mechanic, keyword, or version.
          </p>
        </div>

        <div className={styles.heroStats} aria-label="Patch note archive summary">
          <div>
            <span>Total notes</span>
            <strong>{payload?.meta.totalFetched ?? "..."}</strong>
          </div>
          <div>
            <span>Latest</span>
            <strong>{payload?.meta.latestVersion ?? "..."}</strong>
          </div>
          <div>
            <span>Oldest</span>
            <strong>{payload?.meta.oldestVersion ?? "..."}</strong>
          </div>
        </div>
      </section>

      <section className={styles.toolbar} aria-label="Patch note filters">
        <label className={styles.searchBox}>
          <Search size={18} />
          <input
            aria-label="Search patch notes"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setVisibleCount(INITIAL_VISIBLE);
            }}
            placeholder="Search combat, pets, housing, API, market..."
            type="search"
          />
        </label>

        <label className={styles.selectBox}>
          <Filter size={16} />
          <select
            aria-label="Filter patch notes by category"
            value={category}
            onChange={(event) => {
              setCategory(event.target.value);
              setVisibleCount(INITIAL_VISIBLE);
            }}
          >
            <option value={ALL_CATEGORIES}>All categories</option>
            {categories.map((categoryId) => (
              <option key={categoryId} value={categoryId}>
                {CATEGORY_LABELS[categoryId] || categoryId}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.selectBox}>
          <CalendarDays size={16} />
          <select
            aria-label="Filter patch notes by year"
            value={year}
            onChange={(event) => {
              setYear(event.target.value);
              setVisibleCount(INITIAL_VISIBLE);
            }}
          >
            <option value={ALL_CATEGORIES}>All years</option>
            {years.map((yearOption) => (
              <option key={yearOption} value={yearOption}>{yearOption}</option>
            ))}
          </select>
        </label>

        <button className={styles.resetButton} type="button" onClick={resetFilters} disabled={!hasFilters}>
          <RotateCcw size={16} />
          Reset
        </button>
      </section>

      {latestNote && (
        <section className={styles.latestPanel}>
          <div>
            <span className={styles.panelLabel}>Latest official note</span>
            <h2>{latestNote.headline}</h2>
            <div className={styles.latestMeta}>
              <span>{latestNote.version}</span>
              <span>{formatDate(latestNote.releasedAt, latestNote.releaseDateLabel)}</span>
              {latestNote.categories.slice(0, 2).map((categoryId) => (
                <span key={categoryId}>{CATEGORY_LABELS[categoryId] || categoryId}</span>
              ))}
            </div>
            <p>{latestNote.excerpt}</p>
          </div>
          <a href={latestNote.sourceUrl} target="_blank" rel="noreferrer">
            Official note <ExternalLink size={15} />
          </a>
        </section>
      )}

      {categories.length > 0 && (
        <section className={styles.categoryRail} aria-label="Common patch note topics">
          {categories.slice(0, 14).map((categoryId) => (
            <button
              key={categoryId}
              aria-pressed={category === categoryId}
              className={category === categoryId ? styles.activeChip : styles.chip}
              type="button"
              onClick={() => {
                setCategory((current) => current === categoryId ? ALL_CATEGORIES : categoryId);
                setVisibleCount(INITIAL_VISIBLE);
              }}
            >
              <Tag size={14} />
              {CATEGORY_LABELS[categoryId] || categoryId}
              <span>{payload?.meta.categoryCounts[categoryId] ?? 0}</span>
            </button>
          ))}
        </section>
      )}

      {!isLoading && !loadError && (
        <div className={styles.resultLine}>
          <strong>{filteredNotes.length}</strong>
          <span>matching patch notes</span>
          {archiveUpdated && <small>Archive updated {archiveUpdated}</small>}
        </div>
      )}

      {isLoading && (
        <section className={styles.loadingState} aria-label="Loading patch notes" aria-live="polite">
          {Array.from({ length: 4 }, (_, index) => (
            <article key={index} className={styles.loadingCard}>
              <span />
              <strong />
              <p />
              <p />
            </article>
          ))}
        </section>
      )}

      {loadError && (
        <section className={styles.emptyState}>
          <h2>Patch notes could not load</h2>
          <p>{loadError}</p>
        </section>
      )}

      {!isLoading && !loadError && filteredNotes.length === 0 && (
        <section className={styles.emptyState}>
          <h2>No patch notes found</h2>
          <p>Try a broader keyword or remove one of the filters.</p>
          <button type="button" onClick={resetFilters}>Clear filters</button>
        </section>
      )}

      {!isLoading && !loadError && visibleNotes.length > 0 && (
        <section className={styles.timeline} aria-label="Filtered IdleMMO patch notes">
          {visibleNotes.map((note) => {
            const expanded = expandedId === note.id;
            const bodyId = `patch-note-${note.id}-body`;
            const sections = note.sections.length ? note.sections : [{ heading: "Overview", blocks: note.contentBlocks }];
            return (
              <article key={note.id} className={styles.noteCard} data-expanded={expanded}>
                <div className={styles.noteHeader}>
                  <div>
                    <span className={styles.date}>{formatDate(note.releasedAt, note.releaseDateLabel)}</span>
                    <h2>{highlightText(note.headline, query)}</h2>
                  </div>
                  <a href={note.sourceUrl} target="_blank" rel="noreferrer" aria-label={`Open official note for ${note.version}`}>
                    <ExternalLink size={17} />
                  </a>
                </div>

                <div className={styles.noteMeta}>
                  <strong>{note.version}</strong>
                  <span>#{note.id}</span>
                  {note.categories.slice(0, 5).map((categoryId) => (
                    <button
                      key={categoryId}
                      aria-label={`Filter patch notes by ${CATEGORY_LABELS[categoryId] || categoryId}`}
                      type="button"
                      onClick={() => {
                        setCategory(categoryId);
                        setVisibleCount(INITIAL_VISIBLE);
                      }}
                    >
                      {CATEGORY_LABELS[categoryId] || categoryId}
                    </button>
                  ))}
                </div>

                <p className={styles.excerpt}>{highlightText(note.excerpt, query)}</p>

                {expanded && (
                  <div id={bodyId} className={styles.noteBody}>
                    {sections.map((section, sectionIndex) => (
                      <section key={`${note.id}-${section.heading}-${sectionIndex}`}>
                        {section.heading !== "Overview" && <h3>{section.heading}</h3>}
                        {section.blocks.map((block, blockIndex) => {
                          if (block.type === "listItem") {
                            return <p key={blockIndex} className={styles.listItem}>{highlightText(block.text, query)}</p>;
                          }
                          if (block.type === "image") {
                            return <p key={blockIndex} className={styles.imageAlt}>{block.text}</p>;
                          }
                          return <p key={blockIndex}>{highlightText(block.text, query)}</p>;
                        })}
                      </section>
                    ))}
                  </div>
                )}

                <button
                  className={styles.expandButton}
                  aria-controls={bodyId}
                  aria-expanded={expanded}
                  aria-label={`${expanded ? "Collapse" : "Read"} ${note.version} patch note`}
                  type="button"
                  onClick={() => setExpandedId(expanded ? null : note.id)}
                >
                  {expanded ? (
                    <>
                      Show less <ChevronUp size={15} />
                    </>
                  ) : (
                    <>
                      Read patch note <ChevronDown size={15} />
                    </>
                  )}
                </button>
              </article>
            );
          })}
        </section>
      )}

      {visibleNotes.length < filteredNotes.length && (
        <button
          className={styles.showMore}
          type="button"
          onClick={() => setVisibleCount((current) => current + INITIAL_VISIBLE)}
        >
          Show more patch notes
        </button>
      )}
    </main>
  );
}
