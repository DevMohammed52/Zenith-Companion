"use client";

import { useEffect, useId, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { getQualityTextStyle } from "@/lib/quality";

export function Metric({ label, value, tone }: { label: string; value: string; tone?: "good" | "warn" }) {
  return (
    <div className={`metric ${tone || ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export function NumberField({
  label,
  ariaLabel,
  value,
  onChange,
}: {
  label: string;
  ariaLabel?: string;
  value: number | "";
  onChange: (value: string) => void;
}) {
  const inputId = useId();
  return (
    <div className="number-field">
      <label htmlFor={inputId}>{label}</label>
      <input
        id={inputId}
        type="text"
        aria-label={ariaLabel || label}
        value={value}
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="off"
        onChange={(event) => onChange(event.target.value)}
        placeholder="0"
      />
    </div>
  );
}

export function CustomPicker({
  label,
  options,
  value,
  onChange,
  pickerKey,
  openPicker,
  setOpenPicker,
  onPointerToggle,
}: {
  label: string;
  options: Array<{ id: string; label: string; qualityTone?: string }>;
  value: string;
  onChange: (value: string) => void;
  pickerKey: "quality" | "sort";
  openPicker: "quality" | "sort" | "";
  setOpenPicker: (value: "quality" | "sort" | "") => void;
  onPointerToggle?: () => void;
}) {
  const pickerId = useId();
  const open = openPicker === pickerKey;
  const listboxId = `${pickerId}-listbox`;
  const [activeIndex, setActiveIndex] = useState(() => Math.max(0, options.findIndex((option) => option.id === value)));
  const selected = options.find((option) => option.id === value) || options[0] || { id: "", label: "Choose" };
  const renderOptionLabel = (option: { id: string; label: string; qualityTone?: string } | undefined) => {
    if (!option) return "Choose";
    if (option.qualityTone) {
      return <span style={getQualityTextStyle(option.qualityTone)}>{option.label}</span>;
    }
    return option.label;
  };

  useEffect(() => {
    setActiveIndex(Math.max(0, options.findIndex((option) => option.id === value)));
  }, [options, value]);

  const choose = (option: { id: string; label: string; qualityTone?: string }) => {
    onChange(option.id);
    setOpenPicker("");
  };

  return (
    <div
      className="filter-picker"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setOpenPicker("");
        }
      }}
    >
      <span className="segmented-label" id={`${pickerId}-label`}>{label}</span>
      <button
        type="button"
        className={`filter-picker-button ${open ? "open" : ""}`}
        id={`${pickerId}-button`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-labelledby={`${pickerId}-label ${pickerId}-button`}
        aria-activedescendant={open && options[activeIndex] ? `${pickerId}-option-${options[activeIndex].id}` : undefined}
        onClick={(event) => {
          onPointerToggle?.();
          if (!open && typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(max-width: 820px)").matches) {
            event.currentTarget.scrollIntoView?.({ block: "center", inline: "nearest" });
          }
          setOpenPicker(open ? "" : pickerKey);
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setOpenPicker("");
            return;
          }
          if (options.length === 0) return;
          if (event.key === "Home") {
            event.preventDefault();
            setOpenPicker(pickerKey);
            setActiveIndex(0);
            return;
          }
          if (event.key === "End") {
            event.preventDefault();
            setOpenPicker(pickerKey);
            setActiveIndex(Math.max(0, options.length - 1));
            return;
          }
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            setOpenPicker(pickerKey);
            setActiveIndex((current) => {
              const delta = event.key === "ArrowDown" ? 1 : -1;
              return (current + delta + options.length) % options.length;
            });
            return;
          }
          if ((event.key === "Enter" || event.key === " ") && open) {
            event.preventDefault();
            const optionToChoose = options[activeIndex] || selected;
            if (optionToChoose && typeof optionToChoose.id === "string") {
              choose(optionToChoose);
            }
          }
        }}
      >
        <span>{renderOptionLabel(selected)}</span>
        <ChevronDown size={16} aria-hidden="true" />
      </button>
      {open && (
        <div className="filter-picker-menu" id={listboxId} role="listbox" aria-labelledby={`${pickerId}-label`}>
          {options.map((option) => (
            <button
              type="button"
              key={option.id}
              id={`${pickerId}-option-${option.id}`}
              role="option"
              aria-selected={value === option.id}
              className={`${value === option.id ? "selected" : ""} ${options[activeIndex]?.id === option.id ? "active" : ""}`}
              onMouseDown={(event) => event.preventDefault()}
              onMouseEnter={() => setActiveIndex(options.findIndex((item) => item.id === option.id))}
              onClick={() => choose(option)}
            >
              <span>{renderOptionLabel(option)}</span>
              {value === option.id ? <Check size={15} aria-hidden="true" /> : null}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
