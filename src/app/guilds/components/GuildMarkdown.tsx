"use client";

import React from "react";
import styles from "../page.module.css";
import { getSafeExternalHref } from "../types";

export function InlineMarkdown({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|https?:\/\/[^\s)]+|\[[^\]]+\]\([^)]+\))/g).filter(Boolean);
  return (
    <>
      {parts.map((part, index) => {
        const markdownLink = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (markdownLink) {
          const href = getSafeExternalHref(markdownLink[2]);
          return href ? (
            <a key={`${part}-${index}`} href={href} target="_blank" rel="noopener noreferrer">
              {markdownLink[1]}
            </a>
          ) : (
            <span key={`${part}-${index}`}>{markdownLink[1]}</span>
          );
        }
        if (part.startsWith("**") && part.endsWith("**")) {
          const inner = part.slice(2, -2);
          const href = getSafeExternalHref(inner);
          if (href) {
            return (
              <strong key={`${part}-${index}`}>
                <a href={href} target="_blank" rel="noopener noreferrer">
                  {inner}
                </a>
              </strong>
            );
          }
          return <strong key={`${part}-${index}`}>{inner}</strong>;
        }
        const href = getSafeExternalHref(part);
        if (href) {
          return (
            <a key={`${part}-${index}`} href={href} target="_blank" rel="noopener noreferrer">
              {part}
            </a>
          );
        }
        return <span key={`${part}-${index}`}>{part}</span>;
      })}
    </>
  );
}

export function GuildMarkdown({ text }: { text: string | null }) {
  if (!text?.trim()) return <p className={styles.mutedText}>No public guild bio was returned by the API.</p>;

  const lines = text.split(/\r?\n/);
  const blocks: React.ReactNode[] = [];
  let listItems: string[] = [];

  const flushList = () => {
    if (!listItems.length) return;
    blocks.push(
      <ul key={`list-${blocks.length}`}>
        {listItems.map((item, index) => (
          <li key={`${item}-${index}`}>
            <InlineMarkdown text={item} />
          </li>
        ))}
      </ul>,
    );
    listItems = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      flushList();
      continue;
    }

    const listMatch = line.match(/^[-*]\s+(.+)$/);
    if (listMatch) {
      listItems.push(listMatch[1]);
      continue;
    }

    flushList();
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = Math.min(headingMatch[1].length + 2, 5);
      const Heading = `h${level}` as "h3" | "h4" | "h5";
      blocks.push(
        <Heading key={`heading-${blocks.length}`}>
          <InlineMarkdown text={headingMatch[2]} />
        </Heading>,
      );
      continue;
    }

    blocks.push(
      <p key={`paragraph-${blocks.length}`}>
        <InlineMarkdown text={line} />
      </p>,
    );
  }

  flushList();
  return <div className={styles.markdown}>{blocks}</div>;
}
