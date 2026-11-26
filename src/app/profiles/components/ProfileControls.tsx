"use client";

import React, { useId, useMemo, useRef, useState, type ReactNode } from "react";
import type { CharacterProfile, ProfileFieldSource } from "@/lib/profiles";
import { GameImage } from "@/components/GameImage";
import { Icon } from "@/components/ui/Icon";
import { ModalSheet } from "@/components/ui/ModalSheet";
import { TextInput } from "@/components/ui/TextInput";
import styles from "../Profiles.module.css";

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
  const dateLabel =
    date && Number.isFinite(date.getTime())
      ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date)
      : "";
  const label = formatFieldSourceLabel(source.source);
  const accessibleLabel = dateLabel ? `${label}. Last updated ${dateLabel}` : label;
  return (
    <span className={styles.sourceChip} data-source={source.source} aria-label={accessibleLabel}>
      {label}
    </span>
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
      <button type="button" onClick={onClose} aria-label="Dismiss notification">
        <Icon name="close" size="xs" aria-hidden="true" />
      </button>
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
  ]
    .filter(Boolean)
    .join("\n");
}

export interface ProfileNumberFieldProps {
  label: string;
  value: number | "";
  onChange: (value: number | "") => void;
  onBlur?: () => void;
  step?: string;
  min?: number;
  max?: number;
  badge?: string;
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
  badge,
  hint,
  source,
}: ProfileNumberFieldProps) {
  const inputId = useId();
  const isDecimal = step !== "1" && step.includes(".");

  return (
    <div className={styles.field}>
      <div className={styles.labelRow}>
        <label htmlFor={inputId} className={styles.labelText} title={label}>
          {label}
        </label>
        <span className={styles.labelMetaGroup}>
          {badge && <span className={styles.ascChip}>{badge}</span>}
          <FieldSourceChip source={source} />
        </span>
      </div>
      <input
        id={inputId}
        className={styles.numberInput}
        type="number"
        inputMode={isDecimal ? "decimal" : "numeric"}
        step={step}
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(numberFromInput(event.target.value))}
        onBlur={onBlur}
      />
      {hint && <p className={styles.fieldHint}>{hint}</p>}
    </div>
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
    <div className={styles.field}>
      <div className={styles.labelRow}>
        <span className={styles.labelText}>{label}</span>
        <span className={styles.labelMetaGroup}>
          <FieldSourceChip source={source} />
        </span>
      </div>
      <TextInput
        aria-label={label}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
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
  const open = openId === id;
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const hasVisualAssets = useMemo(
    () => Boolean(selected?.image || options.some((option) => Boolean(option.image))),
    [options, selected?.image],
  );
  const selectedImageClass =
    selected?.title === "Dead Wyrmshadow" ? styles.imageUpsideDown : undefined;

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return options.slice(0, 90);
    return options.filter((option) => option.searchText.toLowerCase().includes(needle)).slice(0, 90);
  }, [options, query]);
  const capped = visible.length < options.length;

  const handleClose = () => {
    setOpenId(null);
    setQuery("");
  };

  return (
    <div className={`${styles.field} profile-picker`}>
      <div className={styles.labelRow}>
        <span className={styles.labelText} title={label}>
          {label}
        </span>
        <span className={styles.labelMetaGroup}>
          <FieldSourceChip source={source} />
        </span>
      </div>

      <button
        type="button"
        ref={triggerRef}
        className={styles.pickerTrigger}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`${label}: ${selected?.title || placeholder}`}
        onClick={() => {
          if (disabled) return;
          setQuery("");
          setOpenId(open ? null : id);
        }}
        disabled={disabled}
      >
        <span className={styles.pickerTriggerMain}>
          {hasVisualAssets && (
            <span className={styles.pickerThumb}>
              {selected?.image ? (
                <GameImage
                  src={selected.image}
                  alt=""
                  width={36}
                  height={36}
                  className={selectedImageClass}
                />
              ) : (
                <Icon name="items" size="sm" aria-hidden="true" />
              )}
            </span>
          )}

          <span className={styles.pickerCopy}>
            <strong>{selected?.title || placeholder}</strong>
            <small>{selected?.subtitle || "Select option"}</small>
          </span>
        </span>

        <span className={styles.pickerRight} aria-hidden="true">
          {selected?.badge ? (
            <span className={styles.pickerOptionMeta}>{selected.badge}</span>
          ) : (
            <span className={styles.pickerOptionMeta}>{selected?.value ? "Change" : "Choose"}</span>
          )}
          <Icon name="chevronDown" size="sm" />
        </span>
      </button>

      <ModalSheet
        isOpen={open}
        onClose={handleClose}
        title={`Choose ${label}`}
        maxWidth="md"
      >
        <div className={styles.pickerModalBody}>
          <TextInput
            value={query}
            placeholder={`Search ${label.toLowerCase()}...`}
            aria-label={`Search ${label.toLowerCase()}`}
            leftIcon={<Icon name="search" size="sm" aria-hidden="true" />}
            onChange={(event) => setQuery(event.target.value)}
            autoFocus
          />

          <div className={`${styles.pickerOptions} custom-scrollbar`}>
            {capped && (
              <div className={styles.pickerLimitNote} role="note">
                Showing first {visible.length.toLocaleString()} of {options.length.toLocaleString()}. Type to filter.
              </div>
            )}

            {visible.map((option) => {
              const isSelected = selected?.id === option.id && option.value !== null;
              return (
                <button
                  key={option.id}
                  type="button"
                  className={`${styles.pickerOption} ${!hasVisualAssets ? styles.pickerOptionTextOnly : ""} ${
                    option.muted ? styles.pickerOptionMuted : ""
                  } ${isSelected ? styles.pickerOptionSelected : ""}`}
                  onClick={() => {
                    onSelect(option.value);
                    handleClose();
                  }}
                >
                  {hasVisualAssets && (
                    <span className={styles.pickerThumb}>
                      {option.image ? (
                        <GameImage
                          src={option.image}
                          alt=""
                          width={36}
                          height={36}
                          className={option.title === "Dead Wyrmshadow" ? styles.imageUpsideDown : undefined}
                        />
                      ) : (
                        <Icon name="items" size="sm" aria-hidden="true" />
                      )}
                    </span>
                  )}
                  <span className={styles.pickerOptionText}>
                    <strong>{option.title}</strong>
                    {option.subtitle && <small>{option.subtitle}</small>}
                  </span>
                  {option.badge && <em className={styles.pickerOptionMeta}>{option.badge}</em>}
                </button>
              );
            })}

            {!visible.length && <div className={styles.pickerEmpty}>No matching options found</div>}
          </div>
        </div>
      </ModalSheet>
    </div>
  );
}
