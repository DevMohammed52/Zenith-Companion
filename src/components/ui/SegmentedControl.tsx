"use client";

import React, { useRef } from "react";
import styles from "./SegmentedControl.module.css";

export interface SegmentedControlOption<T extends string | number> {
  value: T;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
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
      targetIndex = (index + 1) % options.length;
    } else if (e.key === "ArrowLeft") {
      targetIndex = (index - 1 + options.length) % options.length;
    } else if (e.key === "Home") {
      targetIndex = 0;
    } else if (e.key === "End") {
      targetIndex = options.length - 1;
    }

    if (targetIndex !== -1) {
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
            tabIndex={isActive ? 0 : -1}
            className={tabClasses}
            onClick={() => onChange(opt.value)}
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
