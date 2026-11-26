"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { GameImage } from "@/components/GameImage";
import QualityText from "@/components/QualityText";
import { Icon, TableHead } from "@/components/ui";
import { formatGold } from "@/lib/format";
import { formatEssenceBuff, type getEssenceOptionsForSkill } from "@/lib/essences";
import { SKILL_TOOLS, type SkillProfitSortKey, type ToolSkill } from "@/lib/skill-profit";
import styles from "../page.module.css";
import { SORT_LABELS, formatType, stringifyDetail } from "../types";

export function usePickerOpen(onOpenChange?: (open: boolean) => void) {
  const [open, setOpenState] = useState(false);
  const setOpen = useCallback(
    (next: boolean) => {
      setOpenState(next);
      onOpenChange?.(next);
    },
    [onOpenChange],
  );

  useEffect(() => () => onOpenChange?.(false), [onOpenChange]);

  return [open, setOpen] as const;
}

function usePickerDismiss(
  open: boolean,
  setOpen: (next: boolean) => void,
  pickerRef: RefObject<HTMLDivElement | null>,
) {
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const handlePointerDown = (event: PointerEvent) => {
      if (pickerRef.current?.contains(event.target as Node)) return;
      close();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        close();
      } else if (event.key === "Tab") {
        close();
      }
    };
    window.addEventListener("zenith-tool-picker-close", close);
    window.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown, true);
    return () => {
      window.removeEventListener("zenith-tool-picker-close", close);
      window.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [open, pickerRef, setOpen]);
}

export function SortableTh({
  sortKey,
  label,
  activeKey,
  sortDesc,
  onSort,
  align = "right",
}: {
  sortKey: SkillProfitSortKey;
  label?: string;
  activeKey: SkillProfitSortKey;
  sortDesc: boolean;
  onSort: (key: SkillProfitSortKey) => void;
  align?: "left" | "right";
}) {
  const active = sortKey === activeKey;
  const heading = label || SORT_LABELS[sortKey];
  const directionLabel = active ? (sortDesc ? "descending" : "ascending") : "not sorted";
  return (
    <TableHead
      align={align}
      aria-sort={active ? (sortDesc ? "descending" : "ascending") : "none"}
      className={align === "left" ? styles.sortHeaderLeft : undefined}
    >
      <button
        aria-label={`Sort by ${heading}, currently ${directionLabel}`}
        className={styles.sortButton}
        onClick={() => onSort(sortKey)}
        type="button"
      >
        <span>{heading}</span>
        <span aria-hidden="true" className={styles.sortIndicator}>
          <Icon
            name={!active ? "sort" : sortDesc ? "sortDesc" : "sortAsc"}
            size="xs"
            aria-hidden="true"
          />
        </span>
        <span className={styles.srOnly}>{directionLabel}</span>
      </button>
    </TableHead>
  );
}

export function OptionPicker<T extends string>({
  options,
  value,
  onChange,
  onOpenChange,
  ariaLabel = "Guild Conquest rank",
}: {
  options: Array<{ value: T; label: string; hint?: string }>;
  value: T;
  onChange: (value: T) => void;
  onOpenChange?: (open: boolean) => void;
  ariaLabel?: string;
}) {
  const [open, setOpen] = usePickerOpen(onOpenChange);
  const pickerRef = useRef<HTMLDivElement | null>(null);
  const selected = options.find((option) => option.value === value) || options[0] || null;

  usePickerDismiss(open, setOpen, pickerRef);

  return (
    <div className={`${styles.compactPicker} ${open ? styles.toolPickerOpen : ""}`} ref={pickerRef}>
      <button
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
        className={styles.compactTrigger}
        onClick={() => {
          if (!open) window.dispatchEvent(new Event("zenith-tool-picker-close"));
          setOpen(!open);
        }}
        type="button"
      >
        <span className={styles.triggerText}>
          <strong>{selected?.label || "Select"}</strong>
          <small>{selected?.hint || "Profile buff"}</small>
        </span>
        <Icon name={open ? "chevronUp" : "chevronDown"} size="sm" aria-hidden="true" />
      </button>
      {open && (
        <div className={`${styles.toolMenu} ${styles.compactMenu}`} role="listbox" aria-label={ariaLabel}>
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
              <span className={styles.optionText}>
                <strong>{option.label}</strong>
                <small>{option.hint || "Conquest buff"}</small>
              </span>
              {option.value === value && <Icon name="check" size="sm" aria-hidden="true" />}
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
  allItemsDb,
  ariaLabel = "Equipped tool",
}: {
  options: typeof SKILL_TOOLS[ToolSkill];
  value: string;
  onChange: (value: string) => void;
  onOpenChange?: (open: boolean) => void;
  allItemsDb?: Record<string, any> | null;
  ariaLabel?: string;
}) {
  const [open, setOpen] = usePickerOpen(onOpenChange);
  const pickerRef = useRef<HTMLDivElement | null>(null);
  const selected =
    options.find((option) => option.name.toLowerCase() === value.trim().toLowerCase()) || null;

  usePickerDismiss(open, setOpen, pickerRef);

  const selectedImg = selected ? allItemsDb?.[selected.name]?.image_url : undefined;

  return (
    <div className={`${styles.toolPicker} ${open ? styles.toolPickerOpen : ""}`} ref={pickerRef}>
      <button
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
        className={styles.toolTrigger}
        onClick={() => {
          if (!open) window.dispatchEvent(new Event("zenith-tool-picker-close"));
          setOpen(!open);
        }}
        type="button"
      >
        <span className={styles.triggerMedia}>
          <span className={styles.triggerThumb} aria-hidden="true">
            <GameImage
              src={selectedImg}
              alt=""
              width={22}
              height={22}
              sizes="22px"
              fallback={<Icon name="craftTool" size="xs" />}
            />
          </span>
          <span className={styles.triggerText}>
            <strong>{selected?.name || "No tool selected"}</strong>
            <small>{selected ? `+${selected.efficiency}% efficiency` : "No tool bonus"}</small>
          </span>
        </span>
        <Icon name={open ? "chevronUp" : "chevronDown"} size="sm" aria-hidden="true" />
      </button>
      {open && (
        <div className={styles.toolMenu} role="listbox" aria-label={ariaLabel}>
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
            <span className={styles.optionText}>
              <strong>No tool selected</strong>
              <small>Use no tool bonus for this profile</small>
            </span>
            <em className={styles.optionMetric}>+0%</em>
            {!value && <Icon name="check" size="sm" aria-hidden="true" />}
          </button>
          {options.map((option) => {
            const isSelected = option.name.toLowerCase() === value.trim().toLowerCase();
            const img = allItemsDb?.[option.name]?.image_url;
            return (
              <button
                aria-selected={isSelected}
                className={`${styles.toolOption} ${isSelected ? styles.toolOptionActive : ""}`}
                key={option.name}
                onClick={() => {
                  onChange(option.name);
                  setOpen(false);
                }}
                role="option"
                type="button"
              >
                <span className={styles.optionMain}>
                  <span className={styles.triggerThumb} aria-hidden="true">
                    <GameImage
                      src={img}
                      alt=""
                      width={22}
                      height={22}
                      sizes="22px"
                      fallback={<Icon name="craftTool" size="xs" />}
                    />
                  </span>
                  <span className={styles.optionText}>
                    <strong>{option.name}</strong>
                    <small>
                      Lv {option.level} • <QualityText value={option.quality}>{option.quality}</QualityText>
                    </small>
                  </span>
                </span>
                <em className={styles.optionMetric}>+{option.efficiency}%</em>
                {isSelected && <Icon name="check" size="sm" aria-hidden="true" />}
              </button>
            );
          })}
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
  allItemsDb,
}: {
  label: string;
  options: ReturnType<typeof getEssenceOptionsForSkill>;
  value: string;
  onChange: (value: string) => void;
  onOpenChange?: (open: boolean) => void;
  allItemsDb?: Record<string, any> | null;
}) {
  const [open, setOpen] = usePickerOpen(onOpenChange);
  const pickerRef = useRef<HTMLDivElement | null>(null);
  const selected = options.find((option) => option.value === value) || null;

  usePickerDismiss(open, setOpen, pickerRef);

  const selectedImg = selected ? allItemsDb?.[selected.value]?.image_url : undefined;

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
        <span className={styles.triggerMedia}>
          <span className={styles.triggerThumb} aria-hidden="true">
            <GameImage
              src={selectedImg}
              alt=""
              width={22}
              height={22}
              sizes="22px"
              fallback={<Icon name="xp" size="xs" />}
            />
          </span>
          <span className={styles.triggerText}>
            <strong>{selected?.label || "No essence"}</strong>
            <small>{selected ? formatEssenceBuff(selected.buff) : "No crystal cost or boost"}</small>
          </span>
        </span>
        <Icon name={open ? "chevronUp" : "chevronDown"} size="sm" aria-hidden="true" />
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
            <span className={styles.optionText}>
              <strong>No essence</strong>
              <small>No crystal cost or boost</small>
            </span>
            <em className={styles.optionMetric}>0g</em>
            {!value && <Icon name="check" size="sm" aria-hidden="true" />}
          </button>
          {options.map((option) => {
            const img = allItemsDb?.[option.value]?.image_url;
            const buffSummary = formatEssenceBuff(option.buff);
            const cleanMeta = [option.level !== null ? `Lv ${option.level}` : "", buffSummary]
              .filter(Boolean)
              .join(" • ");
            const sourceTag =
              option.price.value > 0
                ? option.price.source === "custom"
                  ? "Custom"
                  : option.price.source === "vendor"
                    ? "Vendor"
                    : "Market"
                : "No data";
            return (
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
                <span className={styles.optionMain}>
                  <span className={styles.triggerThumb} aria-hidden="true">
                    <GameImage
                      src={img}
                      alt=""
                      width={22}
                      height={22}
                      sizes="22px"
                      fallback={<Icon name="xp" size="xs" />}
                    />
                  </span>
                  <span className={styles.optionText}>
                    <strong>
                      <QualityText value={option.quality}>{option.label}</QualityText>
                    </strong>
                    <small>{cleanMeta}</small>
                  </span>
                </span>
                <span className={styles.essenceOptionRight}>
                  <em className={styles.optionMetric}>
                    {option.price.value > 0 ? `${formatGold(option.price.value)}g` : "Needs price"}
                  </em>
                  <small className={styles.essencePriceSource}>{sourceTag}</small>
                </span>
                {option.value === value && <Icon name="check" size="sm" aria-hidden="true" />}
              </button>
            );
          })}
          {options.length === 0 && <div className={styles.toolEmpty}>No supported essence data yet</div>}
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
      <strong
        className={
          tone === "good" ? styles.positive : tone === "bad" ? styles.negative : muted ? styles.mutedValue : ""
        }
      >
        {value}
      </strong>
    </div>
  );
}

export function Metric({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
  tone?: "profit";
}) {
  return (
    <div className={styles.statCell} title={`${label}: ${value} (${sub})`}>
      <span className={styles.statLabel}>{label}</span>
      <strong className={styles.statValue}>{value}</strong>
      <span className={styles.statHint}>{sub}</span>
    </div>
  );
}
