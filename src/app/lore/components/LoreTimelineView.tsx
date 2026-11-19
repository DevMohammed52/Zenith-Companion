import React from "react";
import type { LoreEntry, LoreTimelineEvent } from "@/data/lore";
import { SectionHeading } from "./SectionHeading";

export function LoreTimelineView({
  timeline,
  entryById,
  openEntry,
}: {
  timeline: LoreTimelineEvent[];
  entryById: Record<string, LoreEntry>;
  openEntry: (entry: LoreEntry) => void;
}) {
  return (
    <section className="lore-section">
      <SectionHeading label="Chronology" detail="The clean version of history, with enough gaps to make anyone nervous." />
      <div className="timeline-list">
        {timeline.map((event) => (
          <article key={event.id} className="timeline-item">
            <div className="timeline-era">{event.era}</div>
            <div className="timeline-body">
              <h3>{event.title}</h3>
              <p>{event.summary}</p>
              <div className="thread-pills">
                {event.entryIds.map((id) => {
                  const entry = entryById[id];
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
  );
}
