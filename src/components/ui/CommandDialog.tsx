"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useId,
  useCallback,
  useMemo,
} from "react";
import { createPortal } from "react-dom";
import styles from "./CommandDialog.module.css";

export interface CommandItemData {
  id: string;
  title: string;
  description?: string;
  keywords?: string[];
  icon?: React.ReactNode;
  shortcut?: string;
  disabled?: boolean;
  onSelect: () => void;
}

export interface CommandGroupData {
  heading: string;
  items: CommandItemData[];
}

export interface CommandDialogProps {
  isOpen: boolean;
  onClose: () => void;
  groups: CommandGroupData[];
  placeholder?: string;
  emptyText?: string;
  ariaLabel?: string;
}

export function CommandDialog({
  isOpen,
  onClose,
  groups,
  placeholder = "Type a command or search...",
  emptyText = "No matching commands found.",
  ariaLabel = "Command Palette",
}: CommandDialogProps) {
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const dialogId = useId();
  const inputId = `${dialogId}-input`;
  const listboxId = `${dialogId}-listbox`;

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Filter items across groups
  const filteredGroups = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return groups;

    return groups
      .map((group) => {
        const matchingItems = group.items.filter((item) => {
          if (item.title.toLowerCase().includes(trimmed)) return true;
          if (item.description && item.description.toLowerCase().includes(trimmed))
            return true;
          if (
            item.keywords &&
            item.keywords.some((kw) => kw.toLowerCase().includes(trimmed))
          )
            return true;
          return false;
        });

        return {
          ...group,
          items: matchingItems,
        };
      })
      .filter((group) => group.items.length > 0);
  }, [groups, query]);

  // Flattened active items for arrow navigation
  const flatItems = useMemo(() => {
    return filteredGroups.flatMap((group) => group.items);
  }, [filteredGroups]);

  // Reset highlight on query change or open
  useEffect(() => {
    setHighlightedIndex(0);
  }, [query, isOpen]);

  // Focus management & scroll lock
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement | null;
      document.body.style.overflow = "hidden";
      // Auto-focus input
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      document.body.style.overflow = "";
      setQuery("");
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Scroll active item into view
  useEffect(() => {
    if (isOpen && listRef.current && flatItems.length > 0) {
      const activeEl = listRef.current.querySelector(
        `[data-index="${highlightedIndex}"]`
      ) as HTMLElement | null;
      if (activeEl) {
        activeEl.scrollIntoView({ block: "nearest" });
      }
    }
  }, [isOpen, highlightedIndex, flatItems.length]);

  const handleSelectHighlighted = useCallback(() => {
    const item = flatItems[highlightedIndex];
    if (item && !item.disabled) {
      onClose();
      item.onSelect();
    }
  }, [flatItems, highlightedIndex, onClose]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      if (query.trim()) {
        setQuery("");
      } else {
        onClose();
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (flatItems.length === 0) return;
      setHighlightedIndex((prev) => {
        let next = (prev + 1) % flatItems.length;
        let count = 0;
        while (flatItems[next]?.disabled && count < flatItems.length) {
          next = (next + 1) % flatItems.length;
          count++;
        }
        return next;
      });
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (flatItems.length === 0) return;
      setHighlightedIndex((prev) => {
        let next = (prev - 1 + flatItems.length) % flatItems.length;
        let count = 0;
        while (flatItems[next]?.disabled && count < flatItems.length) {
          next = (next - 1 + flatItems.length) % flatItems.length;
          count++;
        }
        return next;
      });
      return;
    }

    if (e.key === "Home") {
      e.preventDefault();
      const first = flatItems.findIndex((item) => !item.disabled);
      if (first >= 0) setHighlightedIndex(first);
      return;
    }

    if (e.key === "End") {
      e.preventDefault();
      for (let i = flatItems.length - 1; i >= 0; i--) {
        if (!flatItems[i]?.disabled) {
          setHighlightedIndex(i);
          break;
        }
      }
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      handleSelectHighlighted();
    }
  };

  if (!isOpen || !mounted) return null;

  const highlightedItemId =
    flatItems.length > 0 && flatItems[highlightedIndex]
      ? `${dialogId}-item-${flatItems[highlightedIndex].id}`
      : undefined;

  let globalIndexCounter = 0;

  return createPortal(
    <div
      className={styles.overlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      role="presentation"
    >
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        onKeyDown={handleKeyDown}
      >
        <div className={styles.header}>
          <span className={styles.searchIcon} aria-hidden="true">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </span>
          <input
            ref={inputRef}
            id={inputId}
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-haspopup="listbox"
            aria-controls={listboxId}
            aria-activedescendant={highlightedItemId}
            aria-autocomplete="list"
            className={styles.input}
            placeholder={placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          {query && (
            <button
              type="button"
              className={styles.clearBtn}
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              aria-label="Clear search"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
          <button
            type="button"
            className={styles.escBadge}
            onClick={onClose}
            aria-label="Close command palette"
          >
            ESC
          </button>
        </div>

        {/* Offscreen live region for screen reader polite updates */}
        <div className={styles.srOnly} role="status" aria-live="polite">
          {flatItems.length === 0
            ? "No results found"
            : `${flatItems.length} commands available`}
        </div>

        {flatItems.length === 0 ? (
          <div className={styles.empty}>{emptyText}</div>
        ) : (
          <ul
            ref={listRef}
            id={listboxId}
            role="listbox"
            aria-label="Commands"
            className={styles.list}
          >
            {filteredGroups.map((group) => {
              return (
                <li key={group.heading} className={styles.group} role="presentation">
                  <div className={styles.groupHeading} aria-hidden="true">
                    {group.heading}
                  </div>
                  <ul role="presentation" className={styles.groupList}>
                    {group.items.map((item) => {
                      const itemIndex = globalIndexCounter++;
                      const isHighlighted = itemIndex === highlightedIndex;
                      const itemId = `${dialogId}-item-${item.id}`;

                      return (
                        <li
                          key={item.id}
                          id={itemId}
                          role="option"
                          aria-selected={isHighlighted}
                          aria-disabled={item.disabled}
                          data-index={itemIndex}
                          className={`${styles.item} ${
                            isHighlighted ? styles.itemHighlighted : ""
                          } ${item.disabled ? styles.itemDisabled : ""}`}
                          onClick={() => {
                            if (!item.disabled) {
                              onClose();
                              item.onSelect();
                            }
                          }}
                          onMouseEnter={() => {
                            if (!item.disabled) {
                              setHighlightedIndex(itemIndex);
                            }
                          }}
                        >
                          {item.icon && (
                            <span className={styles.itemIcon} aria-hidden="true">
                              {item.icon}
                            </span>
                          )}
                          <div className={styles.itemContent}>
                            <span className={styles.itemTitle}>{item.title}</span>
                            {item.description && (
                              <span className={styles.itemDescription}>
                                {item.description}
                              </span>
                            )}
                          </div>
                          {item.shortcut && (
                            <span className={styles.itemShortcut}>
                              {item.shortcut}
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </li>
              );
            })}
          </ul>
        )}

        <div className={styles.footer}>
          <div className={styles.footerHints}>
            <span className={styles.hint}>
              <kbd className={styles.kbd}>↑</kbd>
              <kbd className={styles.kbd}>↓</kbd> to navigate
            </span>
            <span className={styles.hint}>
              <kbd className={styles.kbd}>↵</kbd> to select
            </span>
          </div>
          <span className={styles.hint}>
            <kbd className={styles.kbd}>ESC</kbd> to close
          </span>
        </div>
      </div>
    </div>,
    document.body
  );
}
