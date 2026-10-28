"use client";

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { ChevronDown, Package, Search, X } from "lucide-react";
import type { CharacterProfile, ProfileFieldSource } from "@/lib/profiles";

export function numberFromInput(value: string): number | "" {
  return value === "" ? "" : Number(value);
}

export function formatFieldSourceLabel(source: ProfileFieldSource["source"]): string {
  if (source === "imported") return "Imported";
  if (source === "calculated") return "Calculated";
  return "Manual";
}

export interface FieldSourceChipProps {
  source?: ProfileFieldSource;
}

export function FieldSourceChip({ source }: FieldSourceChipProps) {
  if (!source) return null;
  const timestamp = source.importedAt || source.updatedAt;
  const date = timestamp ? new Date(timestamp) : null;
  const dateLabel = date && Number.isFinite(date.getTime())
    ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date)
    : "";
  const label = formatFieldSourceLabel(source.source);
  const accessibleLabel = dateLabel ? `${label}. Last updated ${dateLabel}` : label;
  return (
    <em className={`profile-source-chip source-${source.source}`} aria-label={accessibleLabel}>
      {label}
    </em>
  );
}

export interface ToastProps {
  message: string;
  onClose: () => void;
}

export function Toast({ message, onClose }: ToastProps) {
  if (!message) return null;
  return (
    <div className="profile-toast" role="status">
      <span>{message}</span>
      <button type="button" onClick={onClose} aria-label="Dismiss notification"><X size={14} /></button>
    </div>
  );
}

export function buildProfileCopySummary(profile: CharacterProfile): string {
  return [
    `${profile.name || "Unnamed Character"} (${profile.kind === "main" ? "main" : "alt"})`,
    `Class: ${profile.className || "Unknown"}`,
    `Total Level: ${Number(profile.levels.totalLevel || 0).toLocaleString()}`,
    `Combat: ${Number(profile.levels.combat || 0).toLocaleString()}`,
    `Location: ${profile.location?.name || "Not imported"}`,
    profile.guild?.tag ? `Guild: ${profile.guild.tag}` : "",
  ].filter(Boolean).join("\n");
}

export interface ProfileNumberFieldProps {
  label: string;
  value: number | "";
  onChange: (value: number | "") => void;
  onBlur?: () => void;
  step?: string;
  min?: number;
  max?: number;
  hint?: ReactNode;
  source?: ProfileFieldSource;
}

export function ProfileNumberField({
  label,
  value,
  onChange,
  onBlur,
  step = "1",
  min,
  max,
  hint,
  source,
}: ProfileNumberFieldProps) {
  return (
    <label className="profile-field">
      <span className="profile-field-labelrow">
        <span>{label}</span>
        <FieldSourceChip source={source} />
      </span>
      <input
        className="control-input"
        type="number"
        step={step}
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(numberFromInput(event.target.value))}
        onBlur={onBlur}
      />
      {hint && <small>{hint}</small>}
    </label>
  );
}

export interface ProfileTextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  source?: ProfileFieldSource;
}

export function ProfileTextField({
  label,
  value,
  onChange,
  placeholder,
  source,
}: ProfileTextFieldProps) {
  return (
    <label className="profile-field">
      <span className="profile-field-labelrow">
        <span>{label}</span>
        <FieldSourceChip source={source} />
      </span>
      <input
        className="control-input"
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

export interface PickerOption<T> {
  id: string;
  title: string;
  subtitle?: ReactNode;
  image?: string;
  badge?: ReactNode;
  searchText: string;
  value: T | null;
  muted?: boolean;
}

export interface ProfilePickerProps<T> {
  label: string;
  placeholder: string;
  selected?: PickerOption<T> | null;
  options: Array<PickerOption<T>>;
  openId: string | null;
  id: string;
  setOpenId: (value: string | null) => void;
  onSelect: (value: T | null) => void;
  disabled?: boolean;
  source?: ProfileFieldSource;
}

export function ProfilePicker<T>({
  label,
  placeholder,
  selected,
  options,
  openId,
  id,
  setOpenId,
  onSelect,
  disabled,
  source,
}: ProfilePickerProps<T>) {
  const [query, setQuery] = useState("");
  const [menuMetrics, setMenuMetrics] = useState({ placement: "down" as "down" | "up", maxHeight: 320 });
  const open = openId === id;
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const selectedImageClass = selected?.title === "Dead Wyrmshadow" ? "profile-image-upside-down" : undefined;
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return options.slice(0, 90);
    return options.filter((option) => option.searchText.toLowerCase().includes(needle)).slice(0, 90);
  }, [options, query]);
  const capped = visible.length < options.length;

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setOpenId(null);
      setQuery("");
      window.requestAnimationFrame(() => triggerRef.current?.focus());
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, setOpenId]);

  useEffect(() => {
    if (!open) return;
    const updateMenuMetrics = () => {
      const trigger = triggerRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      const mobilePicker = window.matchMedia("(max-width: 620px)").matches;
      if (mobilePicker) {
        const next = { placement: "down" as const, maxHeight: Math.max(260, window.innerHeight - 96) };
        setMenuMetrics((current) => current.placement === next.placement && current.maxHeight === next.maxHeight ? current : next);
        return;
      }
      const gap = 10;
      const preferredHeight = 448;
      const minimumUsefulHeight = 280;
      const below = window.innerHeight - rect.bottom - gap;
      const above = rect.top - gap;
      const placement = below < minimumUsefulHeight && above > below ? "up" as const : "down" as const;
      const available = placement === "up" ? above : below;
      const maxHeight = Math.max(220, Math.min(preferredHeight, Math.floor(available)));
      setMenuMetrics((current) => current.placement === placement && current.maxHeight === maxHeight ? current : { placement, maxHeight });
    };

    updateMenuMetrics();
    window.addEventListener("resize", updateMenuMetrics);
    window.addEventListener("scroll", updateMenuMetrics, true);
    return () => {
      window.removeEventListener("resize", updateMenuMetrics);
      window.removeEventListener("scroll", updateMenuMetrics, true);
    };
  }, [open]);

  const pickerMenuStyle = {
    "--profile-picker-menu-max-height": `${menuMetrics.maxHeight}px`,
  } as CSSProperties & Record<"--profile-picker-menu-max-height", string>;

  return (
    <div className={`profile-picker ${open ? "open" : ""}`}>
      <span className="profile-picker-label profile-field-labelrow">
        <span>{label}</span>
        <FieldSourceChip source={source} />
      </span>
      <button
        type="button"
        ref={triggerRef}
        className="profile-picker-button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? `profile-picker-menu-${id}` : undefined}
        aria-label={`${label}: ${selected?.title || placeholder}`}
        onClick={() => {
          if (disabled) return;
          setQuery("");
          setOpenId(open ? null : id);
        }}
        disabled={disabled}
      >
        <span className="profile-picker-image">
          {selected?.image ? <img src={selected.image} alt="" className={selectedImageClass} /> : <Package size={16} />}
        </span>
        <span className="profile-picker-text">
          <strong>{selected?.title || placeholder}</strong>
          <small>{selected?.subtitle || "Select from database"}</small>
        </span>
        {selected?.badge && <em>{selected.badge}</em>}
        <ChevronDown size={16} />
      </button>
      {open && (
        <div
          className={`profile-picker-menu ${menuMetrics.placement === "up" ? "drop-up" : ""}`}
          id={`profile-picker-menu-${id}`}
          role="dialog"
          aria-label={`${label} picker`}
          style={pickerMenuStyle}
        >
          <div className="profile-picker-menu-head">
            <span>Choose {label}</span>
            <button
              type="button"
              onClick={() => {
                setOpenId(null);
                setQuery("");
              }}
              aria-label={`Close ${label.toLowerCase()} picker`}
            >
              <X size={15} />
            </button>
          </div>
          <label className="profile-picker-search">
            <Search size={16} />
            <input value={query} placeholder={`Search ${label.toLowerCase()}...`} aria-label={`Search ${label.toLowerCase()}`} onChange={(event) => setQuery(event.target.value)} autoFocus />
          </label>
          <div className="profile-picker-options custom-scrollbar">
            {capped && (
              <div className="profile-picker-limit-note" role="note">
                Showing first {visible.length.toLocaleString()} of {options.length.toLocaleString()}. Search to narrow.
              </div>
            )}
            {visible.map((option) => (
              <button
                key={option.id}
                type="button"
                className={`profile-picker-option ${option.muted ? "muted" : ""}`}
                onClick={() => {
                  onSelect(option.value);
                  setOpenId(null);
                  setQuery("");
                }}
              >
                <span className="profile-picker-image">
                  {option.image ? <img src={option.image} alt="" className={option.title === "Dead Wyrmshadow" ? "profile-image-upside-down" : undefined} /> : <Package size={16} />}
                </span>
                <span>
                  <strong>{option.title}</strong>
                  {option.subtitle && <small>{option.subtitle}</small>}
                </span>
                {option.badge && <em>{option.badge}</em>}
              </button>
            ))}
            {!visible.length && <div className="profile-picker-empty">No matches</div>}
          </div>
        </div>
      )}
    </div>
  );
}
