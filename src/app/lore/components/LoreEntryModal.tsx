"use client";

import type { CSSProperties } from "react";
import { useEffect, useRef } from "react";
import { ExternalLink, X } from "lucide-react";
import {
  getDescriptionLoreForEntry,
  type LoreEntry,
  type LoreItemLink,
} from "@/data/lore";
import { CATEGORY_META, cleanLoreCopy } from "../types";

export function LoreEntryModal({
  entry,
  onClose,
  onOpen,
  entryById = {},
  itemLinks = [],
}: {
  entry: LoreEntry;
  onClose: () => void;
  onOpen: (entry: LoreEntry) => void;
  entryById?: Record<string, LoreEntry>;
  itemLinks?: LoreItemLink[];
}) {
  const meta = CATEGORY_META[entry.category];
  const related = entry.relatedIds.map((id) => entryById[id]).filter(Boolean).slice(0, 10);
  const matchedItemLinks = itemLinks.filter((link) => (link.entryIds as readonly string[]).includes(entry.id)).slice(0, 8);
  const descriptionItemLinks = getDescriptionLoreForEntry(entry.id, 10);
  const modalRef = useRef<HTMLElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const pointerStartedOnBackdrop = useRef(false);

  useEffect(() => {
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeButtonRef.current?.focus();

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key !== "Tab" || !modalRef.current) return;
      const focusable = Array.from(
        modalRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => element.offsetParent !== null || element === document.activeElement);
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKey);
      previousFocusRef.current?.focus();
    };
  }, [onClose]);

  return (
    <div
      className="lore-modal-shell"
      onPointerDown={(event) => {
        pointerStartedOnBackdrop.current = event.target === event.currentTarget;
      }}
      onPointerUp={(event) => {
        if (pointerStartedOnBackdrop.current && event.target === event.currentTarget) onClose();
        pointerStartedOnBackdrop.current = false;
      }}
    >
      <section
        ref={modalRef}
        aria-labelledby="lore-modal-title"
        aria-modal="true"
        className="lore-modal"
        role="dialog"
        style={{ "--tone": meta.tone } as CSSProperties}
        tabIndex={-1}
      >
        <header>
          <div>
            <span>{meta.icon} {meta.label}</span>
            <h2 id="lore-modal-title">{entry.title}</h2>
          </div>
          <button ref={closeButtonRef} type="button" onClick={onClose} aria-label="Close lore entry"><X size={20} /></button>
        </header>

        <div className="modal-grid">
          <section className="modal-panel span-two">
            <h3>Official Archive Summary</h3>
            <p>{cleanLoreCopy(entry.summary)}</p>
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
            <h3>Source Section Index</h3>
            <div className="section-notes">
              {entry.sections.length > 0 ? entry.sections.map((section) => (
                <div key={section.title}>
                  <strong>{section.title}</strong>
                  <p>{section.body}</p>
                </div>
              )) : <p className="muted">This index page acts mainly as a doorway to related records.</p>}
            </div>
          </section>

          {matchedItemLinks.length > 0 && (
            <section className="modal-panel span-two">
              <h3>Item Lore Hooks</h3>
              <div className="item-link-grid">
                {matchedItemLinks.map((link) => (
                  <span key={`${entry.id}-${link.itemName}`}>
                    <strong>{link.itemName}</strong>
                    <em>{link.confidence}: {link.reason}</em>
                  </span>
                ))}
              </div>
            </section>
          )}

          {descriptionItemLinks.length > 0 && (
            <section className="modal-panel span-two">
              <h3>Item Description Signals</h3>
              <div className="item-link-grid">
                {descriptionItemLinks.map((link) => (
                  <span key={`${entry.id}-${link.itemName}-description`}>
                    <strong>{link.itemName}</strong>
                    <em>{link.confidence}: {link.reason}</em>
                    <em>&quot;{link.evidence}&quot;</em>
                  </span>
                ))}
              </div>
            </section>
          )}
        </div>
      </section>

      <style jsx>{`
        .lore-modal-shell {
          align-items: flex-start;
          background: rgba(0,0,0,0.78);
          backdrop-filter: blur(14px);
          display: flex;
          inset: 0;
          justify-content: center;
          overflow-y: auto;
          padding: 1.25rem;
          position: fixed;
          z-index: 9999;
          animation: loreModalBackdrop 0.18s ease both;
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
          animation: loreModalIn 0.22s cubic-bezier(0.2, 0.8, 0.2, 1) both;
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
          color: #fff;
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
          transition: border-color 0.18s ease, background 0.18s ease, color 0.18s ease, transform 0.16s ease;
          width: 38px;
        }

        header button:hover {
          background: rgba(255,255,255,0.08);
          border-color: color-mix(in srgb, var(--tone), transparent 50%);
          color: #fff;
        }

        header button:active {
          transform: scale(0.94);
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
          transition: border-color 0.18s ease, background 0.18s ease;
        }

        .modal-panel:hover {
          border-color: color-mix(in srgb, var(--tone), transparent 76%);
          background: rgba(255,255,255,0.045);
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
          transition: color 0.18s ease, transform 0.16s ease;
        }

        .modal-panel a:hover {
          color: color-mix(in srgb, var(--tone), white 34%);
        }

        .modal-panel a:active {
          transform: scale(0.985);
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
          min-height: 44px;
          padding: 0.55rem;
          text-align: left;
          transition: border-color 0.18s ease, background 0.18s ease, transform 0.16s ease;
        }

        .related-grid button:hover {
          background: rgba(255,255,255,0.07);
          border-color: color-mix(in srgb, var(--tone), transparent 55%);
        }

        .related-grid button:active {
          transform: scale(0.985);
        }

        .muted {
          color: rgba(255,255,255,0.5);
        }

        header button:focus-visible,
        .modal-panel a:focus-visible,
        .related-grid button:focus-visible {
          outline: 2px solid color-mix(in srgb, var(--tone), white 12%);
          outline-offset: 2px;
        }

        @keyframes loreModalBackdrop {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes loreModalIn {
          from { opacity: 0; transform: translateY(10px) scale(0.985); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        @media (max-width: 720px) {
          .lore-modal-shell {
            align-items: stretch;
            overflow-y: hidden;
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

        @media (prefers-reduced-motion: reduce) {
          .lore-modal-shell,
          .lore-modal {
            animation: none;
          }

          header button,
          .modal-panel,
          .modal-panel a,
          .related-grid button {
            transition: none;
          }
        }
      `}</style>
    </div>
  );
}
