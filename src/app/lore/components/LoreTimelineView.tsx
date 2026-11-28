"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import type { LoreEntry, LoreTimelineEvent } from "@/data/lore";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import type { IconConcept } from "@/lib/icons";
import { CATEGORY_META, cleanLoreCopy } from "../types";
import { SectionHeading } from "./SectionHeading";
import styles from "../Lore.module.css";

type EpochFilter = "all" | "br" | "early-ar" | "modern-ar";

interface EventMeta {
  icon: IconConcept;
  epochGroup: "br" | "early-ar" | "modern-ar";
  epochTitle: string;
  epochTag: string;
  tone: "gold" | "sky" | "ruby";
}

const EVENT_METADATA: Record<string, EventMeta> = {
  "age-ancients": {
    icon: "xp",
    epochGroup: "br",
    epochTitle: "Epoch I: The Mythic Age (Before Ruin)",
    epochTag: "Mythic Origin",
    tone: "gold",
  },
  "age-splendor": {
    icon: "crown",
    epochGroup: "br",
    epochTitle: "Epoch I: The Mythic Age (Before Ruin)",
    epochTag: "First Civilizations",
    tone: "gold",
  },
  "great-fragmentation": {
    icon: "cataclysm",
    epochGroup: "br",
    epochTitle: "Epoch I: The Mythic Age (Before Ruin)",
    epochTag: "Cataclysm",
    tone: "gold",
  },
  "oakenra-roots": {
    icon: "forest",
    epochGroup: "br",
    epochTitle: "Epoch I: The Mythic Age (Before Ruin)",
    epochTag: "Forest Awakening",
    tone: "gold",
  },
  "arvendor-foundation": {
    icon: "museum",
    epochGroup: "br",
    epochTitle: "Epoch I: The Mythic Age (Before Ruin)",
    epochTag: "Imperial Rise",
    tone: "gold",
  },
  "recorded-history": {
    icon: "lore",
    epochGroup: "early-ar",
    epochTitle: "Epoch II: Rebuilding & Discovery (0–4.5k AR)",
    epochTag: "Cataclysm Aftermath",
    tone: "sky",
  },
  "citadel-discovery": {
    icon: "map",
    epochGroup: "early-ar",
    epochTitle: "Epoch II: Rebuilding & Discovery (0–4.5k AR)",
    epochTag: "Monument Discovery",
    tone: "sky",
  },
  "ombric-break": {
    icon: "guilds",
    epochGroup: "early-ar",
    epochTitle: "Epoch II: Rebuilding & Discovery (0–4.5k AR)",
    epochTag: "Civilization Schism",
    tone: "sky",
  },
  "eldoria-founding": {
    icon: "conquest",
    epochGroup: "early-ar",
    epochTitle: "Epoch II: Rebuilding & Discovery (0–4.5k AR)",
    epochTag: "Maritime Founding",
    tone: "sky",
  },
  "mokthar-marker": {
    icon: "scroll",
    epochGroup: "modern-ar",
    epochTitle: "Epoch III: Great Wars & Modern Valaron (5k+ AR)",
    epochTag: "Nomadic Migration",
    tone: "sky",
  },
  "great-war-arvendor-ombric": {
    icon: "combat",
    epochGroup: "modern-ar",
    epochTitle: "Epoch III: Great Wars & Modern Valaron (5k+ AR)",
    epochTag: "World War",
    tone: "ruby",
  },
  "dark-chapter-eldoria": {
    icon: "warning",
    epochGroup: "modern-ar",
    epochTitle: "Epoch III: Great Wars & Modern Valaron (5k+ AR)",
    epochTag: "Occult Crisis",
    tone: "ruby",
  },
  "great-fire-eldoria": {
    icon: "critDamage",
    epochGroup: "modern-ar",
    epochTitle: "Epoch III: Great Wars & Modern Valaron (5k+ AR)",
    epochTag: "City Inferno",
    tone: "ruby",
  },
  "present-archive": {
    icon: "timer",
    epochGroup: "modern-ar",
    epochTitle: "Epoch III: Great Wars & Modern Valaron (5k+ AR)",
    epochTag: "Current Day",
    tone: "sky",
  },
};

function getToneClass(tone: EventMeta["tone"]) {
  if (tone === "gold") return styles.toneGold;
  if (tone === "ruby") return styles.toneRuby;
  return styles.toneSky;
}

export function LoreTimelineView({
  timeline,
  entryById,
  openEntry,
}: {
  timeline: LoreTimelineEvent[];
  entryById: Record<string, LoreEntry>;
  openEntry: (entry: LoreEntry) => void;
}) {
  const [activeEpoch, setActiveEpoch] = useState<EpochFilter>("all");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const trackRef = useRef<HTMLDivElement | null>(null);
  const firstNodeRef = useRef<HTMLDivElement | null>(null);
  const lastNodeRef = useRef<HTMLDivElement | null>(null);
  const [railBounds, setRailBounds] = useState<{ top: number; height: number } | null>(null);

  const toggleExcerpt = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const isBr = (era: string) => era.includes("BR");
  const isEarlyAr = (era: string) => {
    if (!era.includes("AR")) return false;
    const year = parseInt(era.replace(/[^0-9]/g, ""), 10);
    return year <= 4500;
  };
  const isModernAr = (era: string) => {
    if (!era.includes("AR")) return false;
    const year = parseInt(era.replace(/[^0-9]/g, ""), 10);
    return year > 4500;
  };

  const epochCounts = useMemo(() => {
    let br = 0;
    let early = 0;
    let modern = 0;
    for (const ev of timeline) {
      if (isBr(ev.era)) br += 1;
      else if (isEarlyAr(ev.era)) early += 1;
      else modern += 1;
    }
    return { all: timeline.length, br, early, modern };
  }, [timeline]);

  const filteredEvents = useMemo(() => {
    let result = timeline.filter((event) => {
      if (activeEpoch === "br") return isBr(event.era);
      if (activeEpoch === "early-ar") return isEarlyAr(event.era);
      if (activeEpoch === "modern-ar") return isModernAr(event.era);
      return true;
    });

    if (sortOrder === "desc") {
      result = [...result].reverse();
    }
    return result;
  }, [activeEpoch, sortOrder, timeline]);

  useEffect(() => {
    const updateRail = () => {
      if (!trackRef.current || !firstNodeRef.current || !lastNodeRef.current) return;
      const trackRect = trackRef.current.getBoundingClientRect();
      const firstRect = firstNodeRef.current.getBoundingClientRect();
      const lastRect = lastNodeRef.current.getBoundingClientRect();

      const top = firstRect.top + firstRect.height / 2 - trackRect.top;
      const bottom = lastRect.top + lastRect.height / 2 - trackRect.top;
      const height = Math.max(0, bottom - top);

      setRailBounds({ top, height });
    };

    updateRail();

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined" && trackRef.current) {
      observer = new ResizeObserver(() => {
        updateRail();
      });
      observer.observe(trackRef.current);
    }

    window.addEventListener("resize", updateRail);
    return () => {
      window.removeEventListener("resize", updateRail);
      if (observer) observer.disconnect();
    };
  }, [filteredEvents, expandedIds]);

  return (
    <section className={styles.section} aria-label="Chronological history of Valaron">
      <SectionHeading
        label="Chronology of Valaron"
        detail="14 historical milestones tracking civilizations, cataclysms, and wars across the ages."
      />

      <div className={styles.timelineControls} role="toolbar" aria-label="Timeline navigation controls">
        <div className={styles.timelineEpochPills} role="group" aria-label="Filter by historical epoch">
          <button
            type="button"
            className={`${styles.timelineEpochBtn} ${activeEpoch === "all" ? styles.timelineEpochBtnActive : ""}`}
            aria-pressed={activeEpoch === "all"}
            onClick={() => setActiveEpoch("all")}
          >
            <Icon name="timer" size="sm" aria-hidden="true" />
            <span>All Eras</span>
            <span className={styles.timelineEpochCount}>{epochCounts.all}</span>
          </button>
          <button
            type="button"
            className={`${styles.timelineEpochBtn} ${activeEpoch === "br" ? styles.timelineEpochBtnActive : ""}`}
            aria-pressed={activeEpoch === "br"}
            onClick={() => setActiveEpoch("br")}
          >
            <Icon name="history" size="sm" aria-hidden="true" />
            <span>Before Ruin (BR)</span>
            <span className={styles.timelineEpochCount}>{epochCounts.br}</span>
          </button>
          <button
            type="button"
            className={`${styles.timelineEpochBtn} ${activeEpoch === "early-ar" ? styles.timelineEpochBtnActive : ""}`}
            aria-pressed={activeEpoch === "early-ar"}
            onClick={() => setActiveEpoch("early-ar")}
          >
            <span>Rebuilding (0–4.5k AR)</span>
            <span className={styles.timelineEpochCount}>{epochCounts.early}</span>
          </button>
          <button
            type="button"
            className={`${styles.timelineEpochBtn} ${activeEpoch === "modern-ar" ? styles.timelineEpochBtnActive : ""}`}
            aria-pressed={activeEpoch === "modern-ar"}
            onClick={() => setActiveEpoch("modern-ar")}
          >
            <span>Modern Valaron (5k+ AR)</span>
            <span className={styles.timelineEpochCount}>{epochCounts.modern}</span>
          </button>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          icon={<Icon name="sort" size="sm" aria-hidden="true" />}
          onClick={() => setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))}
          aria-label={`Toggle timeline sort order: currently ${sortOrder === "asc" ? "Oldest First" : "Newest First"}`}
          className={styles.timelineSortBtn}
        >
          {sortOrder === "asc" ? "Oldest First" : "Newest First"}
        </Button>
      </div>

      <div ref={trackRef} className={styles.timelineTrack}>
        <div
          className={styles.timelineSpineRail}
          style={
            railBounds
              ? {
                  top: `${railBounds.top}px`,
                  height: `${railBounds.height}px`,
                  bottom: "auto",
                }
              : undefined
          }
          aria-hidden="true"
        />

        {filteredEvents.map((event, index) => {
          const isFirst = index === 0;
          const isLast = index === filteredEvents.length - 1;

          const meta: EventMeta = EVENT_METADATA[event.id] || {
            icon: "timer",
            epochGroup: isBr(event.era) ? "br" : isEarlyAr(event.era) ? "early-ar" : "modern-ar",
            epochTitle: isBr(event.era)
              ? "Epoch I: The Mythic Age (Before Ruin)"
              : isEarlyAr(event.era)
              ? "Epoch II: Rebuilding & Discovery (0–4.5k AR)"
              : "Epoch III: Great Wars & Modern Valaron (5k+ AR)",
            epochTag: "Historical Event",
            tone: isBr(event.era) ? "gold" : "sky",
          };

          const toneClass = getToneClass(meta.tone);
          const prevEvent = filteredEvents[index - 1];
          const prevMeta = prevEvent ? EVENT_METADATA[prevEvent.id] : null;
          const showEpochGate = !prevMeta || prevMeta.epochTitle !== meta.epochTitle;

          const firstEntry = event.entryIds.length > 0 ? entryById[event.entryIds[0]] : null;
          const previewSnippet = firstEntry?.summary ? cleanLoreCopy(firstEntry.summary) : null;
          const isExpanded = expandedIds.has(event.id);

          return (
            <div key={event.id} className={styles.timelineSegment}>
              {showEpochGate && (
                <div className={`${styles.timelineEpochGate} ${toneClass}`}>
                  <div className={styles.timelineEpochGateBadge}>
                    <span>{meta.epochTitle}</span>
                  </div>
                </div>
              )}

              <div className={`${styles.timelineRow} ${toneClass}`}>
                <div className={styles.timelineNodeCol}>
                  <div
                    ref={(el) => {
                      if (isFirst) firstNodeRef.current = el;
                      if (isLast) lastNodeRef.current = el;
                    }}
                    className={styles.timelineNodeCapsule}
                    title={`${event.era}: ${event.title}`}
                  >
                    <Icon name={meta.icon} size="md" aria-hidden="true" />
                  </div>
                </div>

                <article className={styles.timelineCard}>
                  <header className={styles.timelineCardHeader}>
                    <div className={styles.timelineCardBadges}>
                      <span className={styles.timelineEraBadge}>{event.era}</span>
                      <span className={styles.timelineTagBadge}>{meta.epochTag}</span>
                    </div>

                    {previewSnippet && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className={styles.timelineExcerptToggle}
                        onClick={() => toggleExcerpt(event.id)}
                        aria-expanded={isExpanded}
                        aria-label={`${isExpanded ? "Hide" : "Show"} quick archive excerpt for ${event.title}`}
                      >
                        {isExpanded ? "Hide Excerpt" : "Quick Excerpt"}
                      </Button>
                    )}
                  </header>

                  <h3 className={styles.timelineTitle}>{event.title}</h3>
                  <p className={styles.timelineSummary}>{cleanLoreCopy(event.summary)}</p>

                  {isExpanded && previewSnippet && (
                    <div className={styles.timelineQuickRead} role="region" aria-label={`Archive excerpt from ${firstEntry?.title}`}>
                      <span className={styles.timelineQuickReadLabel}>Archive Excerpt: {firstEntry?.title}</span>
                      <p>&ldquo;{previewSnippet}&rdquo;</p>
                    </div>
                  )}

                  {event.entryIds.length > 0 && (
                    <div className={styles.timelineRecords} role="group" aria-label={`Connected records for ${event.title}`}>
                      <span className={styles.timelineRecordsHeading}>Connected Records:</span>
                      <div className={styles.timelineRecordPills}>
                        {event.entryIds.map((id) => {
                          const entry = entryById[id];
                          if (!entry) return null;
                          const catMeta = CATEGORY_META[entry.category];
                          return (
                            <button
                              key={id}
                              type="button"
                              className={styles.timelineRecordPill}
                              style={{ "--tone": catMeta?.tone || "var(--lore-gold)" } as CSSProperties}
                              onClick={() => openEntry(entry)}
                              aria-label={`Open dossier for ${entry.title} (${catMeta?.label || entry.category})`}
                            >
                              <span className={styles.timelinePillGlyph} aria-hidden="true">{catMeta?.icon}</span>
                              <span>{entry.title}</span>
                              <span className={styles.timelinePillCat}>{catMeta?.label || entry.category}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </article>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
