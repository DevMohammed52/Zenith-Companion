"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import Image from "next/image";
import { Check, ChevronDown } from "lucide-react";
import QualityText from "@/components/QualityText";
import {
  type DungeonItemModifier,
  getDungeonItemModifierSummary,
} from "../types";

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
    <div className={`dungeon-effect-picker ${open ? "open" : ""} ${menuPlacement === "up" ? "drop-up" : ""}`} ref={pickerRef}>
      <button
        type="button"
        ref={triggerRef}
        className="dungeon-effect-trigger"
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={open ? listboxId : undefined}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={handleTriggerKeyDown}
      >
        <span>
          <small>{label}</small>
          <strong>{selected?.name || emptyLabel}</strong>
          <em>{selected ? getDungeonItemModifierSummary(selected) : "No item effect applied."}</em>
        </span>
        <ChevronDown size={16} />
      </button>
      {open && (
        <div id={listboxId} className="dungeon-effect-menu" role="listbox" aria-label={ariaLabel}>
          <button
            type="button"
            ref={(node) => { optionRefs.current[0] = node; }}
            className={`dungeon-effect-option ${!value ? "active" : ""}`}
            role="option"
            aria-selected={!value}
            onKeyDown={(event) => handleOptionKeyDown(event, 0)}
            onClick={() => selectOption("")}
          >
            <span className="dungeon-effect-icon-placeholder" aria-hidden="true" />
            <span>
              <strong>{emptyLabel}</strong>
              <small>Use only the profile/manual field.</small>
            </span>
            {!value && <Check size={14} />}
          </button>
          {options.map((option, index) => {
            const active = option.name === value;
            return (
              <button
                type="button"
                ref={(node) => { optionRefs.current[index + 1] = node; }}
                className={`dungeon-effect-option ${active ? "active" : ""}`}
                key={option.name}
                role="option"
                aria-selected={active}
                onKeyDown={(event) => handleOptionKeyDown(event, index + 1)}
                onClick={() => selectOption(option.name)}
              >
                {option.imageUrl ? <Image src={option.imageUrl} alt="" width={30} height={30} unoptimized /> : <span className="dungeon-effect-icon-placeholder" aria-hidden="true" />}
                <span>
                  <strong>{option.name}</strong>
                  <small><QualityText value={option.quality}>{option.quality}</QualityText> {option.type}</small>
                </span>
                <em>{getDungeonItemModifierSummary(option)}</em>
                {active && <Check size={14} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default DungeonItemEffectPicker;
