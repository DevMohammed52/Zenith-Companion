"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown, X } from "lucide-react";

export function ChoicePicker<T extends string>({
  label,
  value,
  options,
  open,
  setOpen,
  onChange,
  placeholder = "Select",
}: {
  label?: string;
  value: T | "";
  options: Array<{ value: T; label: string; hint?: string }>;
  open: boolean;
  setOpen: (open: boolean) => void;
  onChange: (value: T) => void;
  placeholder?: string;
}) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const listboxId = useId();
  const labelId = useId();
  const valueId = `${listboxId}-value`;
  const selected = options.find((option) => option.value === value);
  const selectedIndex = Math.max(0, options.findIndex((option) => option.value === value));
  const [activeIndex, setActiveIndex] = useState(selectedIndex);

  const focusOption = (index: number) => {
    if (options.length === 0) return;
    const next = Math.max(0, Math.min(options.length - 1, index));
    setActiveIndex(next);
    window.requestAnimationFrame(() => optionRefs.current[next]?.focus());
  };

  const selectOption = (option: { value: T; label: string; hint?: string }) => {
    onChange(option.value);
    setOpen(false);
    window.requestAnimationFrame(() => triggerRef.current?.focus());
  };

  useEffect(() => {
    if (!open) return;
    setActiveIndex(selectedIndex);
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, selectedIndex, setOpen]);

  useEffect(() => {
    if (!open) optionRefs.current = [];
  }, [open]);

  return (
    <div
      className="choice-picker"
      ref={rootRef}
    >
      {label && <span className="choice-label">{label}</span>}
      <button
        ref={triggerRef}
        type="button"
        className="choice-trigger"
        onClick={() => setOpen(!open)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            if (!open) {
              setOpen(true);
              window.requestAnimationFrame(() => focusOption(event.key === "ArrowDown" ? 0 : options.length - 1));
              return;
            }
            focusOption(event.key === "ArrowDown" ? activeIndex + 1 : activeIndex - 1);
          }
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-labelledby={label ? `${labelId} ${valueId}` : undefined}
      >
        {label && <span id={labelId} className="sr-only">{label}</span>}
        <span id={valueId}>{selected?.label || placeholder}</span>
        <ChevronDown size={16} />
      </button>
      {open && (
        <>
          <div className="choice-backdrop" aria-hidden="true" onClick={() => setOpen(false)} />
          <div className="choice-menu custom-scrollbar" role="listbox" id={listboxId} aria-labelledby={label ? labelId : undefined}>
            <div className="choice-menu-head">
              <span>{label || placeholder}</span>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close menu">
                <X size={15} />
              </button>
            </div>
            {options.map((option) => (
              <button
                type="button"
                key={option.value}
                ref={(node) => {
                  optionRefs.current[options.findIndex((candidate) => candidate.value === option.value)] = node;
                }}
                className={option.value === value ? "active" : ""}
                role="option"
                aria-selected={option.value === value}
                tabIndex={options[activeIndex]?.value === option.value ? 0 : -1}
                onKeyDown={(event) => {
                  if (event.key === "ArrowDown") {
                    event.preventDefault();
                    focusOption(activeIndex + 1);
                  } else if (event.key === "ArrowUp") {
                    event.preventDefault();
                    focusOption(activeIndex - 1);
                  } else if (event.key === "Home") {
                    event.preventDefault();
                    focusOption(0);
                  } else if (event.key === "End") {
                    event.preventDefault();
                    focusOption(options.length - 1);
                  } else if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    selectOption(option);
                  } else if (event.key === "Escape") {
                    event.preventDefault();
                    setOpen(false);
                    triggerRef.current?.focus();
                  }
                }}
                onClick={() => {
                  selectOption(option);
                }}
              >
                <strong>{option.label}</strong>
                {option.hint && <small>{option.hint}</small>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
