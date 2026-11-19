"use client";

import React, { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { Check, ChevronDown } from "lucide-react";
import type { GuildSortKey } from "@/lib/guilds";
import styles from "../page.module.css";
import { SORT_OPTIONS } from "../types";

export interface SortPickerProps {
  value: GuildSortKey;
  onChange: (value: GuildSortKey) => void;
}

export function SortPicker({
  value,
  onChange,
}: SortPickerProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const selected = SORT_OPTIONS.find((option) => option.id === value) || SORT_OPTIONS[0];
  const selectedIndex = Math.max(0, SORT_OPTIONS.findIndex((option) => option.id === value));

  const closeMenu = useCallback((returnFocus = false) => {
    setOpen(false);
    if (returnFocus) {
      window.requestAnimationFrame(() => triggerRef.current?.focus());
    }
  }, []);

  const chooseOption = useCallback((index: number) => {
    const option = SORT_OPTIONS[index];
    if (!option) return;
    onChange(option.id);
    closeMenu(true);
  }, [closeMenu, onChange]);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) closeMenu();
    };
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [closeMenu]);

  useEffect(() => {
    if (!open) return;
    setActiveIndex(selectedIndex);
    window.requestAnimationFrame(() => optionRefs.current[selectedIndex]?.focus());
  }, [open, selectedIndex]);

  const handleTriggerKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setActiveIndex(event.key === "ArrowUp" ? SORT_OPTIONS.length - 1 : selectedIndex);
      setOpen(true);
    }
  };

  const handleOptionKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeMenu(true);
      return;
    }

    if (event.key === "ArrowDown" || event.key === "ArrowUp" || event.key === "Home" || event.key === "End") {
      event.preventDefault();
      const nextIndex =
        event.key === "Home"
          ? 0
          : event.key === "End"
            ? SORT_OPTIONS.length - 1
            : event.key === "ArrowDown"
              ? (index + 1) % SORT_OPTIONS.length
              : (index - 1 + SORT_OPTIONS.length) % SORT_OPTIONS.length;
      setActiveIndex(nextIndex);
      optionRefs.current[nextIndex]?.focus();
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      chooseOption(index);
    }
  };

  return (
    <div className={styles.sortPicker} ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        className={styles.sortButton}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={() => {
          setActiveIndex(selectedIndex);
          setOpen((current) => !current);
        }}
        onKeyDown={handleTriggerKeyDown}
      >
        <span>Sort: {selected.label}</span>
        <ChevronDown size={16} aria-hidden="true" />
      </button>
      {open && (
        <div id={listboxId} className={styles.sortMenu} role="listbox" aria-label="Sort guilds">
          {SORT_OPTIONS.map((option, index) => (
            <button
              key={option.id}
              ref={(element) => {
                optionRefs.current[index] = element;
              }}
              type="button"
              role="option"
              aria-selected={value === option.id}
              tabIndex={activeIndex === index ? 0 : -1}
              onClick={() => {
                chooseOption(index);
              }}
              onKeyDown={(event) => handleOptionKeyDown(event, index)}
            >
              <span>{option.label}</span>
              {value === option.id && <Check size={15} aria-hidden="true" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
