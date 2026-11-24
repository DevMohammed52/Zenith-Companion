"use client";

import React, { useRef } from "react";
import styles from "./SegmentedControl.module.css";

export interface SegmentedControlOption<T extends string | number> {
  value: T;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
  disabled?: boolean;
}

export interface SegmentedControlProps<T extends string | number> {
  options: SegmentedControlOption<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
  size?: "sm" | "md";
  fullWidth?: boolean;
  className?: string;
}

export function SegmentedControl<T extends string | number>({
  options,
  value,
  onChange,
  ariaLabel,
  size = "md",
  fullWidth = false,
  className = "",
}: SegmentedControlProps<T>) {
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    let targetIndex = -1;

    if (e.key === "ArrowRight") {
      let next = (index + 1) % options.length;
      let count = 0;
      while (options[next]?.disabled && count < options.length) {
        next = (next + 1) % options.length;
        count++;
      }
      if (count < options.length && !options[next]?.disabled) {
        targetIndex = next;
      }
    } else if (e.key === "ArrowLeft") {
      let prev = (index - 1 + options.length) % options.length;
      let count = 0;
      while (options[prev]?.disabled && count < options.length) {
        prev = (prev - 1 + options.length) % options.length;
        count++;
      }
      if (count < options.length && !options[prev]?.disabled) {
        targetIndex = prev;
      }
    } else if (e.key === "Home") {
      targetIndex = options.findIndex((o) => !o.disabled);
    } else if (e.key === "End") {
      for (let i = options.length - 1; i >= 0; i--) {
        if (!options[i]?.disabled) {
          targetIndex = i;
          break;
        }
      }
    }

    if (targetIndex !== -1 && !options[targetIndex]?.disabled) {
      e.preventDefault();
      const targetOption = options[targetIndex];
      onChange(targetOption.value);
      tabRefs.current[targetIndex]?.focus();
    }
  };

  const trackClasses = [
    styles.track,
    styles[size],
    fullWidth ? styles.fullWidth : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={trackClasses}
    >
      {options.map((opt, idx) => {
        const isActive = opt.value === value;
        const tabClasses = [
          styles.tab,
          isActive ? styles.active : "",
          opt.disabled ? styles.disabled : "",
        ]
          .filter(Boolean)
          .join(" ");

        return (
          <button
            key={String(opt.value)}
            ref={(el) => {
              tabRefs.current[idx] = el;
            }}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-disabled={opt.disabled ? "true" : undefined}
            disabled={opt.disabled}
            tabIndex={isActive && !opt.disabled ? 0 : -1}
            className={tabClasses}
            onClick={() => {
              if (!opt.disabled) onChange(opt.value);
            }}
            onKeyDown={(e) => handleKeyDown(e, idx)}
          >
            {opt.icon && <span aria-hidden="true">{opt.icon}</span>}
            <span>{opt.label}</span>
            {opt.badge !== undefined && (
              <span className={styles.badge}>{opt.badge}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
