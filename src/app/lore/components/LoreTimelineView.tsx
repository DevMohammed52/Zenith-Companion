"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties, type ComponentType } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowDownUp,
  BookOpen,
  Clock,
  Compass,
  Crown,
  Flame,
  History,
  Landmark,
  Scroll,
  Shield,
  Sparkles,
  Swords,
  TreePine,
  Users,
} from "lucide-react";
import type { LoreEntry, LoreTimelineEvent } from "@/data/lore";
import { CATEGORY_META, cleanLoreCopy } from "../types";
import { SectionHeading } from "./SectionHeading";
import { Button } from "@/components/ui/Button";

type EpochFilter = "all" | "br" | "early-ar" | "modern-ar";

interface EventMeta {
  icon: ComponentType<{ size?: number; className?: string; "aria-hidden"?: boolean | "true" | "false" }>;
  epochGroup: "br" | "early-ar" | "modern-ar";
  epochTitle: string;
  epochTag: string;
  tone: "gold" | "cyan" | "ruby";
}

const EVENT_METADATA: Record<string, EventMeta> = {
  "age-ancients": {
    icon: Sparkles,
    epochGroup: "br",
    epochTitle: "Epoch I: The Mythic Age (Before Ruin)",
    epochTag: "Mythic Origin",
    tone: "gold",
  },
  "age-splendor": {
    icon: Crown,
    epochGroup: "br",
    epochTitle: "Epoch I: The Mythic Age (Before Ruin)",
    epochTag: "First Civilizations",
    tone: "gold",
  },
  "great-fragmentation": {
    icon: Activity,
    epochGroup: "br",
    epochTitle: "Epoch I: The Mythic Age (Before Ruin)",
    epochTag: "Cataclysm",
    tone: "gold",
  },
  "oakenra-roots": {
    icon: TreePine,
    epochGroup: "br",
    epochTitle: "Epoch I: The Mythic Age (Before Ruin)",
    epochTag: "Forest Awakening",
    tone: "gold",
  },
  "arvendor-foundation": {
    icon: Landmark,
    epochGroup: "br",
    epochTitle: "Epoch I: The Mythic Age (Before Ruin)",
    epochTag: "Imperial Rise",
    tone: "gold",
  },
  "recorded-history": {
    icon: BookOpen,
    epochGroup: "early-ar",
    epochTitle: "Epoch II: Rebuilding & Discovery (0–4.5k AR)",
    epochTag: "Cataclysm Aftermath",
    tone: "cyan",
  },
  "citadel-discovery": {
    icon: Compass,
    epochGroup: "early-ar",
    epochTitle: "Epoch II: Rebuilding & Discovery (0–4.5k AR)",
    epochTag: "Monument Discovery",
    tone: "cyan",
  },
  "ombric-break": {
    icon: Users,
    epochGroup: "early-ar",
    epochTitle: "Epoch II: Rebuilding & Discovery (0–4.5k AR)",
    epochTag: "Civilization Schism",
    tone: "cyan",
  },
  "eldoria-founding": {
    icon: Shield,
    epochGroup: "early-ar",
    epochTitle: "Epoch II: Rebuilding & Discovery (0–4.5k AR)",
    epochTag: "Maritime Founding",
    tone: "cyan",
  },
  "mokthar-marker": {
    icon: Scroll,
    epochGroup: "modern-ar",
    epochTitle: "Epoch III: Great Wars & Modern Valaron (5k+ AR)",
    epochTag: "Nomadic Migration",
    tone: "cyan",
  },
  "great-war-arvendor-ombric": {
    icon: Swords,
    epochGroup: "modern-ar",
    epochTitle: "Epoch III: Great Wars & Modern Valaron (5k+ AR)",
    epochTag: "World War",
    tone: "ruby",
  },
  "dark-chapter-eldoria": {
    icon: AlertTriangle,
    epochGroup: "modern-ar",
    epochTitle: "Epoch III: Great Wars & Modern Valaron (5k+ AR)",
    epochTag: "Occult Crisis",
    tone: "ruby",
  },
  "great-fire-eldoria": {
    icon: Flame,
    epochGroup: "modern-ar",
    epochTitle: "Epoch III: Great Wars & Modern Valaron (5k+ AR)",
    epochTag: "City Inferno",
    tone: "ruby",
  },
  "present-archive": {
    icon: Clock,
    epochGroup: "modern-ar",
    epochTitle: "Epoch III: Great Wars & Modern Valaron (5k+ AR)",
    epochTag: "Current Day",
    tone: "cyan",
  },
};

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
    <section className="lore-section" aria-label="Chronological history of Valaron">
      <SectionHeading
        label="Chronology of Valaron"
        detail="14 historical milestones tracking civilizations, cataclysms, and wars across the ages."
      />

      {/* Interactive Epoch Controls */}
      <div className="timeline-controls" role="toolbar" aria-label="Timeline navigation controls">
        <div className="timeline-epoch-pills" role="group" aria-label="Filter by historical epoch">
          <button
            type="button"
            className={`timeline-epoch-btn ${activeEpoch === "all" ? "active" : ""}`}
            aria-pressed={activeEpoch === "all"}
            onClick={() => setActiveEpoch("all")}
          >
            <Clock size={14} aria-hidden="true" />
            <span>All Eras</span>
            <span className="timeline-epoch-count">{epochCounts.all}</span>
          </button>
          <button
            type="button"
            className={`timeline-epoch-btn ${activeEpoch === "br" ? "active" : ""}`}
            aria-pressed={activeEpoch === "br"}
            onClick={() => setActiveEpoch("br")}
          >
            <History size={14} aria-hidden="true" />
            <span>Before Ruin (BR)</span>
            <span className="timeline-epoch-count">{epochCounts.br}</span>
          </button>
          <button
            type="button"
            className={`timeline-epoch-btn ${activeEpoch === "early-ar" ? "active" : ""}`}
            aria-pressed={activeEpoch === "early-ar"}
            onClick={() => setActiveEpoch("early-ar")}
          >
            <span>Rebuilding (0–4.5k AR)</span>
            <span className="timeline-epoch-count">{epochCounts.early}</span>
          </button>
          <button
            type="button"
            className={`timeline-epoch-btn ${activeEpoch === "modern-ar" ? "active" : ""}`}
            aria-pressed={activeEpoch === "modern-ar"}
            onClick={() => setActiveEpoch("modern-ar")}
          >
            <span>Modern Valaron (5k+ AR)</span>
            <span className="timeline-epoch-count">{epochCounts.modern}</span>
          </button>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          icon={<ArrowDownUp size={14} aria-hidden="true" />}
          onClick={() => setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))}
          aria-label={`Toggle timeline sort order: currently ${sortOrder === "asc" ? "Oldest First" : "Newest First"}`}
          className="timeline-sort-btn"
        >
          {sortOrder === "asc" ? "Oldest First" : "Newest First"}
        </Button>
      </div>

      {/* Interactive Chronology Track */}
      <div ref={trackRef} className="timeline-track">
        <div
          className="timeline-spine-rail"
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

          const meta = EVENT_METADATA[event.id] || {
            icon: Clock,
            epochGroup: isBr(event.era) ? "br" : isEarlyAr(event.era) ? "early-ar" : "modern-ar",
            epochTitle: isBr(event.era)
              ? "Epoch I: The Mythic Age (Before Ruin)"
              : isEarlyAr(event.era)
              ? "Epoch II: Rebuilding & Discovery (0–4.5k AR)"
              : "Epoch III: Great Wars & Modern Valaron (5k+ AR)",
            epochTag: "Historical Event",
            tone: isBr(event.era) ? "gold" : "cyan",
          };

          const MetaIcon = meta.icon;
          const prevEvent = filteredEvents[index - 1];
          const prevMeta = prevEvent ? EVENT_METADATA[prevEvent.id] : null;
          const showEpochGate = !prevMeta || prevMeta.epochTitle !== meta.epochTitle;

          // Find first connected entry for inline quick excerpt
          const firstEntry = event.entryIds.length > 0 ? entryById[event.entryIds[0]] : null;
          const previewSnippet = firstEntry?.summary ? cleanLoreCopy(firstEntry.summary) : null;
          const isExpanded = expandedIds.has(event.id);

          return (
            <div key={event.id} className="timeline-segment">
              {showEpochGate && (
                <div className={`timeline-epoch-gate tone-${meta.tone}`}>
                  <div className="timeline-epoch-gate-badge">
                    <span className="timeline-epoch-gate-icon">
                      {meta.tone === "gold" ? "✦" : meta.tone === "ruby" ? "⚔" : "◆"}
                    </span>
                    <span className="timeline-epoch-gate-title">{meta.epochTitle}</span>
                  </div>
                </div>
              )}

              <div className={`timeline-row tone-${meta.tone}`}>
                {/* Node column on the chronology rail */}
                <div className="timeline-node-col">
                  <div
                    ref={(el) => {
                      if (isFirst) firstNodeRef.current = el;
                      if (isLast) lastNodeRef.current = el;
                    }}
                    className="timeline-node-capsule"
                    title={`${event.era}: ${event.title}`}
                  >
                    <MetaIcon size={16} aria-hidden="true" />
                  </div>
                  <div className="timeline-connector-beam" aria-hidden="true" />
                </div>

                {/* Event Card */}
                <article className="timeline-card">
                  <header className="timeline-card-header">
                    <div className="timeline-card-badges">
                      <span className="timeline-era-badge">{event.era}</span>
                      <span className="timeline-tag-badge">{meta.epochTag}</span>
                    </div>

                    {previewSnippet && (
                      <button
                        type="button"
                        className="timeline-excerpt-toggle"
                        onClick={() => toggleExcerpt(event.id)}
                        aria-expanded={isExpanded}
                        aria-label={`${isExpanded ? "Hide" : "Show"} quick archive excerpt for ${event.title}`}
                      >
                        {isExpanded ? "Hide Excerpt" : "Quick Excerpt"}
                      </button>
                    )}
                  </header>

                  <h3 className="timeline-title">{event.title}</h3>
                  <p className="timeline-summary">{cleanLoreCopy(event.summary)}</p>

                  {isExpanded && previewSnippet && (
                    <div className="timeline-quick-read" role="region" aria-label={`Archive excerpt from ${firstEntry?.title}`}>
                      <span className="timeline-quick-read-label">Archive Excerpt &middot; {firstEntry?.title}:</span>
                      <p>&ldquo;{previewSnippet}&rdquo;</p>
                    </div>
                  )}

                  {event.entryIds.length > 0 && (
                    <div className="timeline-records" role="group" aria-label={`Connected records for ${event.title}`}>
                      <span className="timeline-records-heading">Connected Records:</span>
                      <div className="timeline-record-pills">
                        {event.entryIds.map((id) => {
                          const entry = entryById[id];
                          if (!entry) return null;
                          const catMeta = CATEGORY_META[entry.category];
                          return (
                            <button
                              key={id}
                              type="button"
                              className="timeline-record-pill"
                              style={{ "--tone": catMeta?.tone || "var(--lore-gold)" } as CSSProperties}
                              onClick={() => openEntry(entry)}
                              aria-label={`Open dossier for ${entry.title} (${catMeta?.label || entry.category})`}
                            >
                              <span className="timeline-pill-glyph" aria-hidden="true">{catMeta?.icon}</span>
                              <span className="timeline-pill-title">{entry.title}</span>
                              <span className="timeline-pill-cat">{catMeta?.label || entry.category}</span>
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
