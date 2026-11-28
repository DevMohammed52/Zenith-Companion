"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { GameImage } from "@/components/GameImage";
import QualityText from "@/components/QualityText";
import { Icon } from "@/components/ui";
import {
  type DungeonItemModifier,
  getDungeonItemModifierSummary,
} from "../types";
import styles from "../Dungeons.module.css";

export interface DungeonItemEffectPickerProps {
  ariaLabel: string;
  emptyLabel: string;
  label: string;
  onChange: (value: string) => void;
  options: DungeonItemModifier[];
  value: string;
}

export function DungeonItemEffectPicker({
  ariaLabel,
  emptyLabel,
  label,
  onChange,
  options,
  value,
}: DungeonItemEffectPickerProps) {
  const listboxId = useId();
  const [open, setOpen] = useState(false);
  const [menuPlacement, setMenuPlacement] = useState<"down" | "up">("down");
  const pickerRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const selected = options.find((option) => option.name === value) || null;

  const focusOption = (index: number) => {
    window.requestAnimationFrame(() => {
      optionRefs.current[index]?.focus();
    });
  };

  const selectOption = (nextValue: string) => {
    onChange(nextValue);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const selectedIndex = Math.max(0, options.findIndex((option) => option.name === value) + 1);

  const handleTriggerKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (!["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) return;
    event.preventDefault();
    setOpen(true);
    focusOption(event.key === "ArrowUp" ? options.length : selectedIndex);
  };

  const handleOptionKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>, index: number) => {
    const optionCount = options.length + 1;
    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
      return;
    }
    if (event.key === "Tab") {
      setOpen(false);
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      focusOption((index + 1) % optionCount);
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      focusOption((index - 1 + optionCount) % optionCount);
      return;
    }
    if (event.key === "Home") {
      event.preventDefault();
      focusOption(0);
      return;
    }
    if (event.key === "End") {
      event.preventDefault();
      focusOption(optionCount - 1);
    }
  };

  useEffect(() => {
    if (!open) return;
    const updatePlacement = () => {
      const triggerRect = triggerRef.current?.getBoundingClientRect();
      if (!triggerRect) return;
      const stackedAdvancedPanels = window.matchMedia("(max-width: 1100px)").matches;
      const spaceBelow = window.innerHeight - triggerRect.bottom;
      const spaceAbove = triggerRect.top;
      setMenuPlacement(stackedAdvancedPanels || (spaceBelow < 280 && spaceAbove > spaceBelow) ? "up" : "down");
    };
    updatePlacement();
    const handlePointer = (event: PointerEvent) => {
      if (pickerRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("resize", updatePlacement);
    window.addEventListener("scroll", updatePlacement, true);
    document.addEventListener("pointerdown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("resize", updatePlacement);
      window.removeEventListener("scroll", updatePlacement, true);
      document.removeEventListener("pointerdown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <div className={styles.controlField} ref={pickerRef}>
      <span className={styles.fieldLabel}>
        <span>{label}</span>
        <span className={styles.fieldMeta}>
          {selected ? getDungeonItemModifierSummary(selected) : `${options.length} available`}
        </span>
      </span>

      <div className={styles.pickerWrap}>
        <button
          type="button"
          ref={triggerRef}
          className={styles.pickerTrigger}
          aria-label={ariaLabel}
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-controls={open ? listboxId : undefined}
          onClick={() => setOpen((current) => !current)}
          onKeyDown={handleTriggerKeyDown}
        >
          <span className={styles.pickerTriggerContent}>
            <span className={styles.pickerIcon} aria-hidden="true">
              {selected?.imageUrl ? (
                <GameImage
                  src={selected.imageUrl}
                  alt=""
                  width={24}
                  height={24}
                  sizes="24px"
                  fallback={<Icon name="magic" size="xs" />}
                />
              ) : (
                <Icon name="magic" size="xs" />
              )}
            </span>
            <span className={styles.pickerText}>
              <span className={styles.pickerPrimary}>{selected?.name || emptyLabel}</span>
              <span className={styles.pickerSecondary}>
                {selected ? getDungeonItemModifierSummary(selected) : "Profile / manual only"}
              </span>
            </span>
          </span>
          <Icon name="chevronDown" size="sm" aria-hidden="true" />
        </button>

        {open && (
          <div
            id={listboxId}
            className={`${styles.pickerMenu} ${menuPlacement === "up" ? styles.pickerMenuUp : ""}`.trim()}
            role="listbox"
            aria-label={ariaLabel}
          >
            <button
              type="button"
              ref={(node) => { optionRefs.current[0] = node; }}
              className={`${styles.pickerOption} ${!value ? styles.pickerOptionActive : ""}`.trim()}
              role="option"
              aria-selected={!value}
              onKeyDown={(event) => handleOptionKeyDown(event, 0)}
              onClick={() => selectOption("")}
            >
              <span className={styles.pickerOptionMain}>
                <span className={styles.pickerIcon} aria-hidden="true">
                  <Icon name="minus" size="xs" />
                </span>
                <span className={styles.pickerText}>
                  <span className={styles.pickerPrimary}>{emptyLabel}</span>
                  <span className={styles.pickerOptionMeta}>Profile / manual only</span>
                </span>
              </span>
              {!value && <Icon name="check" size="xs" aria-hidden="true" />}
            </button>

            {options.map((option, index) => {
              const active = option.name === value;
              return (
                <button
                  type="button"
                  ref={(node) => { optionRefs.current[index + 1] = node; }}
                  className={`${styles.pickerOption} ${active ? styles.pickerOptionActive : ""}`.trim()}
                  key={option.name}
                  role="option"
                  aria-selected={active}
                  onKeyDown={(event) => handleOptionKeyDown(event, index + 1)}
                  onClick={() => selectOption(option.name)}
                >
                  <span className={styles.pickerOptionMain}>
                    <span className={styles.pickerIcon} aria-hidden="true">
                      <GameImage
                        src={option.imageUrl}
                        alt=""
                        width={24}
                        height={24}
                        sizes="24px"
                        fallback={<Icon name="magic" size="xs" />}
                      />
                    </span>
                    <span className={styles.pickerText}>
                      <span className={styles.pickerPrimary}>{option.name}</span>
                      <span className={styles.pickerOptionMeta}>
                        <QualityText value={option.quality}>{option.quality}</QualityText> | {getDungeonItemModifierSummary(option)}
                      </span>
                    </span>
                  </span>
                  {active && <Icon name="check" size="xs" aria-hidden="true" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default DungeonItemEffectPicker;
