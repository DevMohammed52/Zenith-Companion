"use client";

import React from "react";
import { ModalSheet } from "@/components/ui/ModalSheet";
import { Icon } from "@/components/ui/Icon";
import {
  getDescriptionLoreForEntry,
  type LoreEntry,
  type LoreItemLink,
} from "@/data/lore";
import { CATEGORY_META, cleanLoreCopy } from "../types";
import styles from "../Lore.module.css";

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

  return (
    <ModalSheet
      isOpen={true}
      onClose={onClose}
      title={entry.title}
      description={meta.label}
      maxWidth="lg"
    >
      <div className={styles.modalGrid}>
        <section className={`${styles.modalSection} ${styles.modalSectionFirst} ${styles.modalSpanTwo}`}>
          <h3>Official Archive Summary</h3>
          <p>{cleanLoreCopy(entry.summary)}</p>
          <a href={entry.sourceUrl} target="_blank" rel="noreferrer" className={styles.modalSourceLink}>
            <span>Read official source</span>
            <Icon name="externalLink" size="sm" aria-hidden="true" />
          </a>
        </section>

        <section className={styles.modalSection}>
          <h3>Key Facts</h3>
          <div className={styles.modalList}>
            {entry.keyFacts.map((fact) => (
              <span key={fact} className={styles.modalListItem}>{fact}</span>
            ))}
          </div>
        </section>

        <section className={styles.modalSection}>
          <h3>Thread Connections</h3>
          <div className={styles.relatedGrid}>
            {related.length > 0 ? related.map((rel) => (
              <button
                key={rel.id}
                type="button"
                className={styles.relatedBtn}
                onClick={() => onOpen(rel)}
              >
                {rel.title}
              </button>
            )) : <span className={styles.modalMuted}>No direct links preserved.</span>}
          </div>
        </section>

        <section className={`${styles.modalSection} ${styles.modalSpanTwo}`}>
          <h3>Source Section Index</h3>
          <div className={styles.sectionNotes}>
            {entry.sections.length > 0 ? entry.sections.map((section) => (
              <div key={section.title} className={styles.sectionNoteItem}>
                <strong>{section.title}</strong>
                <p>{section.body}</p>
              </div>
            )) : <p className={styles.modalMuted}>This index page acts mainly as a doorway to related records.</p>}
          </div>
        </section>

        {matchedItemLinks.length > 0 && (
          <section className={`${styles.modalSection} ${styles.modalSpanTwo}`}>
            <h3>Item Lore Hooks</h3>
            <div className={styles.itemLinkGrid}>
              {matchedItemLinks.map((link) => (
                <span key={`${entry.id}-${link.itemName}`} className={styles.itemLinkItem}>
                  <strong>{link.itemName}</strong>
                  <em>{link.confidence}: {link.reason}</em>
                </span>
              ))}
            </div>
          </section>
        )}

        {descriptionItemLinks.length > 0 && (
          <section className={`${styles.modalSection} ${styles.modalSpanTwo}`}>
            <h3>Item Description Signals</h3>
            <div className={styles.itemLinkGrid}>
              {descriptionItemLinks.map((link) => (
                <span key={`${entry.id}-${link.itemName}-description`} className={styles.itemLinkItem}>
                  <strong>{link.itemName}</strong>
                  <em>{link.confidence}: {link.reason}</em>
                  <em>&quot;{link.evidence}&quot;</em>
                </span>
              ))}
            </div>
          </section>
        )}
      </div>
    </ModalSheet>
  );
}
