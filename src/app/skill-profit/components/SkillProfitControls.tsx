"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowDown, ArrowDownUp, ArrowUp, Check, ChevronDown } from "lucide-react";
import { formatGold } from "@/lib/format";
import QualityText from "@/components/QualityText";
import {
  formatEssenceBuff,
  type getEssenceOptionsForSkill,
} from "@/lib/essences";
import {
  SKILL_TOOLS,
  type SkillProfitSortKey,
  type ToolSkill,
} from "@/lib/skill-profit";
import styles from "../page.module.css";
import { SORT_LABELS, formatType, stringifyDetail } from "../types";

export function usePickerOpen(onOpenChange?: (open: boolean) => void) {
  const [open, setOpenState] = useState(false);
  const setOpen = useCallback((next: boolean) => {
    setOpenState(next);
    onOpenChange?.(next);
  }, [onOpenChange]);

  useEffect(() => () => onOpenChange?.(false), [onOpenChange]);

  return [open, setOpen] as const;
}

export function SortableTh({
  sortKey,
  activeKey,
  sortDesc,
  onSort,
  align,
}: {
  sortKey: SkillProfitSortKey;
  activeKey: SkillProfitSortKey;
  sortDesc: boolean;
  onSort: (key: SkillProfitSortKey) => void;
  align?: "left" | "right";
}) {
  const active = sortKey === activeKey;
  const directionLabel = active ? (sortDesc ? "descending" : "ascending") : "not sorted";
  return (
    <th
      scope="col"
      aria-sort={sortKey === activeKey ? (sortDesc ? "descending" : "ascending") : "none"}
      className={align === "left" ? styles.sortHeaderLeft : undefined}
    >
      <button
        aria-label={`Sort by ${SORT_LABELS[sortKey]}, currently ${directionLabel}`}
        className={styles.sortButton}
        onClick={() => onSort(sortKey)}
        type="button"
      >
        {SORT_LABELS[sortKey]}
        <span aria-hidden="true" className={styles.sortIndicator}>
          {active ? (sortDesc ? <ArrowDown size={13} /> : <ArrowUp size={13} />) : <ArrowDownUp size={13} />}
        </span>
        <span className={styles.srOnly}>{directionLabel}</span>
      </button>
    </th>
  );
}

export function OptionPicker<T extends string>({
  options,
  value,
  onChange,
  onOpenChange,
}: {
  options: Array<{ value: T; label: string; hint?: string }>;
  value: T;
  onChange: (value: T) => void;
  onOpenChange?: (open: boolean) => void;
}) {
  const [open, setOpen] = usePickerOpen(onOpenChange);
  const pickerRef = useRef<HTMLDivElement | null>(null);
  const selected = options.find((option) => option.value === value) || options[0] || null;

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const handlePointerDown = (event: PointerEvent) => {
      if (pickerRef.current?.contains(event.target as Node)) return;
      close();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("zenith-tool-picker-close", close);
    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("zenith-tool-picker-close", close);
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, setOpen]);

  return (
    <div className={`${styles.compactPicker} ${open ? styles.toolPickerOpen : ""}`} ref={pickerRef}>
      <button
        aria-expanded={open}
        aria-haspopup="listbox"
        className={styles.compactTrigger}
        onClick={() => {
          if (!open) window.dispatchEvent(new Event("zenith-tool-picker-close"));
          setOpen(!open);
        }}
        type="button"
      >
        <span>
          <strong>{selected?.label || "Select"}</strong>
          <small>{selected?.hint || "Profile buff"}</small>
        </span>
        <ChevronDown size={16} />
      </button>
      {open && (
        <div className={`${styles.toolMenu} ${styles.compactMenu}`} role="listbox">
          {options.map((option) => (
            <button
              aria-selected={option.value === value}
              className={`${styles.compactOption} ${option.value === value ? styles.toolOptionActive : ""}`}
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              role="option"
              type="button"
            >
              <span>
                <strong>{option.label}</strong>
                <small>{option.hint || "Conquest buff"}</small>
              </span>
              {option.value === value && <Check size={15} />}
            </button>
          ))}
          <button className={styles.toolClose} onClick={() => setOpen(false)} type="button">
            Close
          </button>
        </div>
      )}
    </div>
  );
}

export function ToolPicker({
  options,
  value,
  onChange,
  onOpenChange,
}: {
  options: typeof SKILL_TOOLS[ToolSkill];
  value: string;
  onChange: (value: string) => void;
  onOpenChange?: (open: boolean) => void;
}) {
  const [open, setOpen] = usePickerOpen(onOpenChange);
  const pickerRef = useRef<HTMLDivElement | null>(null);
  const selected = options.find((option) => option.name === value) || null;

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const handlePointerDown = (event: PointerEvent) => {
      if (pickerRef.current?.contains(event.target as Node)) return;
      close();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("zenith-tool-picker-close", close);
    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("zenith-tool-picker-close", close);
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, setOpen]);

  return (
    <div className={`${styles.toolPicker} ${open ? styles.toolPickerOpen : ""}`} ref={pickerRef}>
      <button
        aria-expanded={open}
        aria-haspopup="listbox"
        className={styles.toolTrigger}
        onClick={() => {
          if (!open) window.dispatchEvent(new Event("zenith-tool-picker-close"));
          setOpen(!open);
        }}
        type="button"
      >
        <span>
          <strong>{selected?.name || "No tool selected"}</strong>
          <small>{selected ? `+${selected.efficiency}% efficiency` : "No tool bonus"}</small>
        </span>
        <ChevronDown size={16} />
      </button>
      {open && (
        <div className={styles.toolMenu} role="listbox">
          <button
            aria-selected={!value}
            className={`${styles.toolOption} ${!value ? styles.toolOptionActive : ""}`}
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
            role="option"
            type="button"
          >
            <span>
              <strong>No tool selected</strong>
              <small>Use no tool bonus for this profile</small>
            </span>
            <em>+0%</em>
            {!value && <Check size={15} />}
          </button>
          {options.map((option) => (
            <button
              aria-selected={option.name === value}
              className={`${styles.toolOption} ${option.name === value ? styles.toolOptionActive : ""}`}
              key={option.name}
              onClick={() => {
                onChange(option.name);
                setOpen(false);
              }}
              role="option"
              type="button"
            >
              <span>
                <strong>{option.name}</strong>
                <small>Lvl {option.level} - <QualityText value={option.quality}>{option.quality}</QualityText></small>
              </span>
              <em>+{option.efficiency}%</em>
              {option.name === value && <Check size={15} />}
            </button>
          ))}
          <button className={styles.toolClose} onClick={() => setOpen(false)} type="button">
            Close
          </button>
        </div>
      )}
    </div>
  );
}

export function EssencePicker({
  label,
  options,
  value,
  onChange,
  onOpenChange,
}: {
  label: string;
  options: ReturnType<typeof getEssenceOptionsForSkill>;
  value: string;
  onChange: (value: string) => void;
  onOpenChange?: (open: boolean) => void;
}) {
  const [open, setOpen] = usePickerOpen(onOpenChange);
  const pickerRef = useRef<HTMLDivElement | null>(null);
  const selected = options.find((option) => option.value === value) || null;

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const handlePointerDown = (event: PointerEvent) => {
      if (pickerRef.current?.contains(event.target as Node)) return;
      close();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("zenith-tool-picker-close", close);
    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("zenith-tool-picker-close", close);
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, setOpen]);

  return (
    <div className={`${styles.toolPicker} ${open ? styles.toolPickerOpen : ""}`} ref={pickerRef}>
      <button
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={label}
        className={styles.toolTrigger}
        onClick={() => {
          if (!open) window.dispatchEvent(new Event("zenith-tool-picker-close"));
          setOpen(!open);
        }}
        type="button"
      >
        <span>
          <strong>{selected?.label || "No essence"}</strong>
          <small>{selected ? formatEssenceBuff(selected.buff) : "No crystal cost or boost"}</small>
        </span>
        <ChevronDown size={16} />
      </button>
      {open && (
        <div className={styles.toolMenu} role="listbox" aria-label={label}>
          <button
            aria-selected={!value}
            className={`${styles.toolOption} ${!value ? styles.toolOptionActive : ""}`}
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
            role="option"
            type="button"
          >
            <span>
              <strong>No essence</strong>
              <small>No crystal cost or boost</small>
            </span>
            <em>0g</em>
            {!value && <Check size={15} />}
          </button>
          {options.map((option) => (
            <button
              aria-selected={option.value === value}
              className={`${styles.toolOption} ${option.value === value ? styles.toolOptionActive : ""}`}
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              role="option"
              type="button"
            >
              <span>
                <strong>{option.label}</strong>
                <small>{option.hint}</small>
              </span>
              <em>{option.price.value > 0 ? `${formatGold(option.price.value)}g` : "Data"}</em>
              {option.value === value && <Check size={15} />}
            </button>
          ))}
          {options.length === 0 && (
            <div className={styles.toolEmpty}>No supported essence data yet</div>
          )}
          <button className={styles.toolClose} onClick={() => setOpen(false)} type="button">
            Close
          </button>
        </div>
      )}
    </div>
  );
}

export function DetailPill({
  label,
  value,
  muted,
  children,
}: {
  label: string;
  value: string;
  muted?: boolean;
  children?: ReactNode;
}) {
  return (
    <div className={styles.detailPill}>
      <span>{label}</span>
      <strong className={muted ? styles.mutedValue : ""}>{children ?? value}</strong>
    </div>
  );
}

export function DetailList({ title, entries }: { title: string; entries: Array<[string, any]> }) {
  return (
    <div className={styles.detailList}>
      <strong>{title}</strong>
      {entries.map(([label, value]) => (
        <div key={`${title}-${label}`}>
          <span>{formatType(label)}</span>
          <em>{stringifyDetail(value)}</em>
        </div>
      ))}
    </div>
  );
}

export function CalcRow({
  label,
  value,
  tone,
  muted,
}: {
  label: string;
  value: string;
  tone?: "good" | "bad";
  muted?: boolean;
}) {
  return (
    <div className={styles.calcRow}>
      <span>{label}</span>
      <strong className={tone === "good" ? styles.positive : tone === "bad" ? styles.negative : muted ? styles.mutedValue : ""}>{value}</strong>
    </div>
  );
}

export function Metric({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub: string;
  tone?: "profit";
}) {
  return (
    <div className={styles.metric} title={`${label}: ${value} (${sub})`}>
      <span>{label}</span>
      <strong className={tone === "profit" ? styles.metricProfit : ""}>{value}</strong>
      <small>{sub}</small>
    </div>
  );
}
