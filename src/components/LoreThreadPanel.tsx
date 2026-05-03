"use client";

import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import type { LoreHint } from "@/lib/lore-links";

type LoreThreadPanelProps = {
  hints: LoreHint[];
  title?: string;
  compact?: boolean;
  onOpenThread?: (entryId: string) => void;
};

export default function LoreThreadPanel({
  hints,
  title = "Lore Thread",
  compact = false,
  onOpenThread,
}: LoreThreadPanelProps) {
  if (hints.length === 0) return null;

  return (
    <section className={`lore-thread-panel ${compact ? "compact" : ""}`}>
      <div className="lore-thread-panel-header">
        <div>
          <span><BookOpen size={15} /> {title}</span>
          <p>Canon and clearly labeled inferred links from the Valaron archive.</p>
        </div>
        <Link href={`/lore?thread=${hints[0].entry.id}`} className="lore-thread-link">
          Open atlas <ArrowRight size={13} />
        </Link>
      </div>

      <div className="lore-thread-list-mini">
        {hints.map((hint) => {
          const content = (
            <>
              <span className={`lore-confidence ${hint.confidence}`}>{hint.confidence}</span>
              <strong>{hint.entry.title}</strong>
              <small>{hint.entry.category} from {hint.source}</small>
              <em>{hint.reason}</em>
            </>
          );

          if (onOpenThread) {
            return (
              <button
                key={`${hint.id}-${hint.source}-${hint.matchedName}`}
                type="button"
                className="lore-thread-mini-card"
                onClick={() => onOpenThread(hint.entry.id)}
              >
                {content}
              </button>
            );
          }

          return (
            <Link
              key={`${hint.id}-${hint.source}-${hint.matchedName}`}
              href={`/lore?thread=${hint.entry.id}`}
              className="lore-thread-mini-card"
            >
              {content}
            </Link>
          );
        })}
      </div>

      <style jsx global>{`
        .lore-thread-panel {
          background:
            linear-gradient(135deg, color-mix(in srgb, var(--text-accent), transparent 91%), rgba(255,255,255,0.015)),
            rgba(255,255,255,0.018);
          border: 1px solid color-mix(in srgb, var(--text-accent), transparent 72%);
          border-radius: 8px;
          display: grid;
          flex: 0 0 auto;
          gap: 0.85rem;
          margin: 0 0 1.35rem;
          overflow: hidden;
          padding: 1rem;
          position: relative;
        }

        .lore-thread-panel::before {
          background: radial-gradient(circle, color-mix(in srgb, var(--text-accent), transparent 40%), transparent 60%);
          content: "";
          height: 160px;
          opacity: 0.12;
          pointer-events: none;
          position: absolute;
          right: -55px;
          top: -80px;
          width: 160px;
        }

        .lore-thread-panel-header {
          align-items: flex-start;
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          justify-content: space-between;
          margin-bottom: 0;
          min-width: 0;
          position: relative;
          z-index: 1;
        }

        .lore-thread-panel-header > div {
          flex: 1 1 260px;
          min-width: min(100%, 220px);
        }

        .lore-thread-panel-header span {
          align-items: center;
          color: #fff;
          display: inline-flex;
          font-weight: 900;
          gap: 0.45rem;
        }

        .lore-thread-panel-header p {
          color: var(--text-muted);
          font-size: 0.78rem;
          line-height: 1.45;
          margin: 0.25rem 0 0;
        }

        .lore-thread-link {
          align-items: center;
          background: rgba(0,0,0,0.2);
          border: 1px solid var(--border-subtle);
          border-radius: 7px;
          color: var(--text-accent) !important;
          display: inline-flex;
          flex: 0 0 auto;
          font-size: 0.68rem;
          font-weight: 900;
          gap: 0.4rem;
          min-height: 38px;
          padding: 0.45rem 0.65rem;
          text-decoration: none !important;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .lore-thread-list-mini {
          display: grid;
          gap: 0.65rem;
          grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr));
          position: relative;
          z-index: 1;
        }

        .lore-thread-mini-card {
          appearance: none;
          background: rgba(0,0,0,0.22);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 8px;
          color: #fff !important;
          cursor: pointer;
          display: grid;
          font: inherit;
          gap: 0.25rem;
          min-width: 0;
          padding: 0.75rem;
          text-align: left;
          text-decoration: none !important;
          transition: transform 0.18s ease, border-color 0.18s ease, background 0.18s ease;
        }

        .lore-thread-mini-card:hover {
          background: rgba(255,255,255,0.045);
          border-color: color-mix(in srgb, var(--text-accent), transparent 55%);
          transform: translateY(-2px);
        }

        .lore-thread-mini-card strong {
          overflow-wrap: anywhere;
        }

        .lore-thread-mini-card small,
        .lore-thread-mini-card em {
          color: rgba(255,255,255,0.58);
          font-size: 0.72rem;
          font-style: normal;
          line-height: 1.35;
        }

        .lore-confidence {
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 999px;
          color: rgba(255,255,255,0.72);
          font-size: 0.58rem;
          font-weight: 900;
          letter-spacing: 0.08em;
          padding: 0.16rem 0.42rem;
          text-transform: uppercase;
          width: fit-content;
        }

        .lore-confidence.canon {
          background: rgba(74,222,128,0.13);
          color: #86efac;
        }

        .lore-confidence.inferred {
          background: rgba(56,189,248,0.13);
          color: #7dd3fc;
        }

        .lore-confidence.theory {
          background: rgba(245,176,65,0.14);
          color: #f8d38d;
        }

        .lore-thread-panel.compact {
          padding: 0.85rem;
        }

        .modal-content .lore-thread-panel {
          margin-top: 1.25rem;
          padding: 1.1rem;
        }

        .modal-content .lore-thread-panel-header {
          align-items: center;
        }

        .lore-thread-panel.compact .lore-thread-panel-header p {
          display: none;
        }

        @media (max-width: 560px) {
          .lore-thread-panel-header {
            flex-direction: column;
          }

          .lore-thread-link {
            justify-content: center;
            width: 100%;
          }
        }
      `}</style>
    </section>
  );
}
