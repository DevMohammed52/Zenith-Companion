"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { ChevronDown, Search, X } from "lucide-react";
import { QUALITY_COLORS, qualityLabel } from "@/lib/pets";
import type { PetOption } from "../types";
import { PetImage } from "./PetImage";
import styles from "../page.module.css";

export function PetPicker({
  slotIndex,
  value,
  options,
  open,
  onOpen,
  onSelect,
  onClear,
}: {
  slotIndex: number;
  value: string | null;
  options: PetOption[];
  open: boolean;
  onOpen: (open: boolean) => void;
  onSelect: (id: string) => void;
  onClear: () => void;
}) {
  const [query, setQuery] = useState("");
  const reactId = useId();
  const panelId = `pet-compare-picker-${reactId}`;
  const listboxId = `${panelId}-options`;
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const selected = options.find((option) => option.id === value) || null;
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return options
      .filter((option) => !needle || option.searchText.includes(needle))
      .slice(0, 32);
  }, [options, query]);
  const selectedFilteredIndex = Math.max(
    0,
    filtered.findIndex((option) => option.id === value),
  );
  const [activeIndex, setActiveIndex] = useState(selectedFilteredIndex);

  const closePicker = () => {
    setQuery("");
    onOpen(false);
    window.requestAnimationFrame(() => triggerRef.current?.focus());
  };

  const moveToOption = (index: number) => {
    if (!filtered.length) return;
    const nextIndex = Math.min(filtered.length - 1, Math.max(0, index));
    setActiveIndex(nextIndex);
    window.requestAnimationFrame(() => optionRefs.current[nextIndex]?.focus());
  };

  useEffect(() => {
    if (!open) return;
    const compact = window.matchMedia("(max-width: 560px)").matches;
    if (compact) {
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      triggerRef.current?.scrollIntoView({
        block: "center",
        behavior: reduceMotion ? "auto" : "smooth",
      });
    }
    window.requestAnimationFrame(() => searchRef.current?.focus());
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setActiveIndex(selectedFilteredIndex);
  }, [open, selectedFilteredIndex]);

  const handleSearchKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      closePicker();
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      moveToOption(activeIndex);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      moveToOption(filtered.length - 1);
    }
  };

  const handleOptionKeyDown = (
    event: ReactKeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    if (event.key === "Escape") {
      event.preventDefault();
      closePicker();
      return;
    }

    if (
      event.key === "ArrowDown" ||
      event.key === "ArrowUp" ||
      event.key === "Home" ||
      event.key === "End"
    ) {
      event.preventDefault();
      const nextIndex =
        event.key === "Home"
          ? 0
          : event.key === "End"
            ? filtered.length - 1
            : event.key === "ArrowDown"
              ? (index + 1) % filtered.length
              : (index - 1 + filtered.length) % filtered.length;
      moveToOption(nextIndex);
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      const option = filtered[index];
      if (!option) return;
      onSelect(option.id);
      closePicker();
    }
  };

  return (
    <div className={styles.picker} data-menu-root>
      <button
        ref={triggerRef}
        type="button"
        className={styles.pickerTrigger}
        style={
          selected
            ? ({ "--accent": QUALITY_COLORS[selected.pet.quality] } as CSSProperties)
            : undefined
        }
        data-filled={selected ? "true" : undefined}
        aria-controls={open ? panelId : undefined}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={
          selected
            ? `Change comparison slot ${slotIndex + 1}, currently ${selected.title}`
            : `Choose pet for comparison slot ${slotIndex + 1}`
        }
        onClick={() => onOpen(!open)}
      >
        {selected ? (
          <PetImage pet={selected.pet} />
        ) : (
          <div className={styles.emptyAvatar}>{slotIndex + 1}</div>
        )}
        <span className={styles.pickerBody}>
          <strong>{selected?.title || `Choose pet ${slotIndex + 1}`}</strong>
          <small>
            {selected
              ? `${selected.subtitle}${selected.kind === "owned" ? " / Snapshot stats" : ""}`
              : "Search pet database or owned snapshots"}
          </small>
          {selected && (
            <em className={styles.slotSource}>
              {selected.kind === "owned"
                ? "Owned snapshot"
                : qualityLabel(selected.pet.quality)}
            </em>
          )}
        </span>
        <span className={styles.triggerChevron} aria-hidden="true">
          <ChevronDown size={17} />
        </span>
      </button>
      {selected && (
        <button
          type="button"
          className={styles.clearSlot}
          onClick={(e) => {
            e.stopPropagation();
            if (open) closePicker();
            onClear();
          }}
          aria-label={`Clear ${selected.title} from comparison`}
          title="Clear pet slot"
        >
          <X size={15} />
        </button>
      )}
      {open && (
        <div
          className={styles.pickerPanel}
          id={panelId}
          role="dialog"
          aria-label={`Choose pet for comparison slot ${slotIndex + 1}`}
        >
          <div className={styles.pickerPanelHeader}>
            <span>Choose pet</span>
            <button
              type="button"
              onClick={closePicker}
              aria-label="Close pet picker"
            >
              <X size={16} />
            </button>
          </div>
          <label className={styles.searchBox}>
            <Search size={16} />
            <input
              ref={searchRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search pet, boss, source..."
              aria-label={`Search pets for comparison slot ${slotIndex + 1}`}
              aria-controls={listboxId}
              onKeyDown={handleSearchKeyDown}
            />
          </label>
          <div
            className={styles.petOptions}
            id={listboxId}
            role="listbox"
            aria-label={`Pet options for comparison slot ${slotIndex + 1}`}
          >
            {filtered.map((option, index) => (
              <button
                ref={(node) => {
                  optionRefs.current[index] = node;
                }}
                type="button"
                key={option.id}
                className={option.id === value ? styles.petOptionSelected : ""}
                role="option"
                aria-selected={option.id === value}
                tabIndex={index === activeIndex ? 0 : -1}
                onClick={() => {
                  onSelect(option.id);
                  closePicker();
                }}
                onFocus={() => setActiveIndex(index)}
                onKeyDown={(event) => handleOptionKeyDown(event, index)}
              >
                <PetImage pet={option.pet} />
                <span>
                  <strong>{option.title}</strong>
                  <small>{option.subtitle}</small>
                </span>
                <em
                  className={
                    option.kind === "owned" ? styles.ownedOptionMeta : undefined
                  }
                >
                  {option.meta}
                </em>
              </button>
            ))}
            {!filtered.length && (
              <div className={styles.emptyList}>No pets match that search.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
