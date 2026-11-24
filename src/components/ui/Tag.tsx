"use client";

import React, { ReactNode } from "react";
import styles from "./Tag.module.css";

export type TagRarity = "common" | "uncommon" | "rare" | "epic" | "legendary" | "mythic";

export interface TagProps {
  label: string;
  selected?: boolean;
  onSelect?: () => void;
  onRemove?: () => void;
  removeAriaLabel?: string;
  icon?: ReactNode;
  count?: number | string;
  rarity?: TagRarity;
  className?: string;
}

export function Tag({
  label,
  selected = false,
  onSelect,
  onRemove,
  removeAriaLabel,
  icon,
  count,
  rarity,
  className = "",
}: TagProps) {
  const isInteractive = Boolean(onSelect);
  const rarityClass = rarity ? styles[`rarity_${rarity}`] : "";

  const content = (
    <>
      {selected && !icon && (
        <span className={styles.checkIcon} aria-hidden="true">
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </span>
      )}
      {icon && <span className={styles.iconSlot} aria-hidden="true">{icon}</span>}
      <span>{label}</span>
      {count !== undefined && <span className={styles.countBadge}>{count}</span>}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          aria-label={removeAriaLabel || `Remove ${label}`}
          className={styles.removeButton}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      )}
    </>
  );

  if (isInteractive) {
    return (
      <button
        type="button"
        aria-pressed={selected}
        onClick={onSelect}
        className={`${styles.tag} ${styles.isInteractive} ${selected ? styles.isSelected : ""} ${rarityClass} ${className}`.trim()}
      >
        {content}
      </button>
    );
  }

  return (
    <span
      className={`${styles.tag} ${rarityClass} ${className}`.trim()}
    >
      {content}
    </span>
  );
}
