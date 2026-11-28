"use client";

import type { ReactNode } from "react";
import { Badge, Icon, Pagination, Timeline, type TimelineItem } from "@/components/ui";
import {
  ALL_FILTER,
  CATEGORY_LABELS,
  formatPatchDate,
  getPatchTitleText,
  NOTES_PER_PAGE,
  sanitizeDisplayText,
  type PatchNote,
} from "../types";
import styles from "../PatchNotes.module.css";

function renderHighlightedSegments(text: string, query: string): ReactNode {
  const clean = sanitizeDisplayText(text);
  const trimmed = query.trim();
  if (!trimmed) return clean;

  const lowerClean = clean.toLowerCase();
  const lowerQuery = trimmed.toLowerCase();
  const idx = lowerClean.indexOf(lowerQuery);
  if (idx === -1) return clean;

  return (
    <>
      {clean.slice(0, idx)}
      <mark className={styles.highlightMark}>{clean.slice(idx, idx + trimmed.length)}</mark>
      {clean.slice(idx + trimmed.length)}
    </>
  );
}

function renderRichTextWithLinks(text: string, query: string): ReactNode {
  const clean = sanitizeDisplayText(text);
  const parts = clean.split(/(https?:\/\/[^\s)]+)/g);
  return parts.map((part, index) => {
    if (/^https?:\/\//i.test(part)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.inlineLink}
        >
          {part}
        </a>
      );
    }
    return <span key={index}>{renderHighlightedSegments(part, query)}</span>;
  });
}

type PatchNotesListProps = {
  notes: PatchNote[];
  totalFilteredCount: number;
  latestId: number | null;
  query: string;
  activeCategory: string;
  expandedIds: Set<number>;
  currentPage: number;
  totalPages: number;
  onToggleExpand: (id: number) => void;
  onCategorySelect: (categoryId: string) => void;
  onPageChange: (page: number) => void;
};

export function PatchNotesList({
  notes,
  totalFilteredCount,
  latestId,
  query,
  activeCategory,
  expandedIds,
  currentPage,
  totalPages,
  onToggleExpand,
  onCategorySelect,
  onPageChange,
}: PatchNotesListProps) {
  const timelineItems: TimelineItem[] = notes.map((note) => {
    const isLatest = latestId !== null && note.id === latestId;
    const isExpanded = Boolean(query.trim()) || expandedIds.has(note.id);
    const panelId = `patch-note-panel-${note.id}`;
    const sections =
      note.sections.length > 0
        ? note.sections
        : [{ heading: "Overview", blocks: note.contentBlocks }];
    const displayTitle = getPatchTitleText(note);
    const cleanExcerpt = sanitizeDisplayText(note.excerpt || note.bodyText);

    return {
      id: note.id,
      htmlId: `patch-${note.id}`,
      timestamp: note.releasedAt || note.releaseDateLabel || note.version,
      formattedTime: formatPatchDate(note.releasedAt, note.releaseDateLabel),
      variant: isLatest ? "success" : "default",
      status: isLatest ? "Latest patch" : `#${note.id}`,
      title: (
        <div className={styles.noteCardHeader}>
          <button
            type="button"
            className={styles.noteTrigger}
            onClick={() => onToggleExpand(note.id)}
            aria-expanded={isExpanded}
            aria-controls={panelId}
          >
            <span className={styles.noteTriggerMain}>
              <span className={styles.noteTitleLine}>
                <Badge size="sm" variant={isLatest ? "success" : "neutral"}>
                  {note.version}
                </Badge>
                <span className={styles.noteTitle}>
                  {renderHighlightedSegments(displayTitle, query)}
                </span>
              </span>
              {!isExpanded && cleanExcerpt && (
                <p className={styles.noteExcerpt}>
                  {renderHighlightedSegments(cleanExcerpt, query)}
                </p>
              )}
            </span>

            <span className={styles.chevronWrap} aria-hidden="true">
              <Icon
                name="chevronDown"
                size="md"
                className={`${styles.chevronIcon} ${isExpanded ? styles.chevronIconOpen : ""}`.trim()}
              />
            </span>
          </button>

          <a
            href={note.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.officialIconLink}
            aria-label={`Open official IdleMMO post for ${note.version}`}
            title="Open official note"
          >
            <Icon name="externalLink" size="sm" aria-hidden="true" />
          </a>
        </div>
      ),
      children: (
        <div>
          {note.categories.length > 0 && (
            <div className={styles.noteTagsRow}>
              {note.categories.slice(0, 6).map((catId) => {
                const isSelected = activeCategory === catId;
                return (
                  <button
                    key={catId}
                    type="button"
                    aria-pressed={isSelected}
                    aria-label={`Filter patch notes by ${CATEGORY_LABELS[catId] || catId}`}
                    className={`${styles.noteTopicBtn} ${isSelected ? styles.noteTopicBtnActive : ""}`.trim()}
                    onClick={() => onCategorySelect(isSelected ? ALL_FILTER : catId)}
                  >
                    {CATEGORY_LABELS[catId] || catId}
                  </button>
                );
              })}
            </div>
          )}

          <div
            id={panelId}
            className={`${styles.drawer} ${isExpanded ? styles.drawerOpen : ""}`.trim()}
            aria-hidden={!isExpanded}
          >
            <div className={styles.drawerInner}>
              {isExpanded && (
                <div className={styles.drawerBody}>
                  {sections.map((section, sectionIdx) => (
                    <section key={`${note.id}-${section.heading}-${sectionIdx}`} className={styles.noteSection}>
                      {section.heading && section.heading !== "Overview" && (
                        <h4 className={styles.sectionHeading}>{section.heading}</h4>
                      )}
                      {(() => {
                        const listItems = section.blocks.filter((b) => b.type === "listItem");
                        const otherBlocks = section.blocks.filter((b) => b.type !== "listItem");
                        return (
                          <>
                            {otherBlocks.map((block, idx) =>
                              block.type === "image" ? (
                                <p key={`p-${idx}`} className={styles.blockImageCaption}>
                                  {sanitizeDisplayText(block.text)}
                                </p>
                              ) : (
                                <p key={`p-${idx}`} className={styles.blockParagraph}>
                                  {renderRichTextWithLinks(block.text, query)}
                                </p>
                              ),
                            )}
                            {listItems.length > 0 && (
                              <ul className={styles.blockList}>
                                {listItems.map((block, idx) => (
                                  <li key={`li-${idx}`} className={styles.blockListItem}>
                                    <span className={styles.bulletDot} aria-hidden="true" />
                                    <span>{renderRichTextWithLinks(block.text, query)}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </>
                        );
                      })()}
                    </section>
                  ))}

                  <div className={styles.drawerFooter}>
                    <span>Archive entry #{note.id}</span>
                    <a
                      href={note.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.inlineLink}
                    >
                      Read official IdleMMO announcement
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ),
    };
  });

  return (
    <>
      <Timeline
        items={timelineItems}
        aria-label="Filtered IdleMMO patch notes"
        directionNotice="Order: Newest patches first | Official IdleMMO UTC release dates"
      />

      {totalPages > 1 && (
        <div className={styles.paginationWrap}>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
            totalItems={totalFilteredCount}
            pageSize={NOTES_PER_PAGE}
            showSummary={false}
            scrollToTop
          />
        </div>
      )}
    </>
  );
}
