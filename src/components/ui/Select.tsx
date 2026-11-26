"use client";

import React, { useState, useRef, useEffect, useId, useCallback } from "react";
import styles from "./Select.module.css";

export type ItemRarity =
  | "standard"
  | "refined"
  | "premium"
  | "epic"
  | "legendary"
  | "mythic"
  | "unique"
  | "common"
  | "uncommon"
  | "rare";

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
  icon?: React.ReactNode;
  badge?: string;
  rarity?: ItemRarity;
}

export interface SelectProps {
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  ariaLabel?: string;
  ariaLabelledBy?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  id?: string;
  className?: string;
  name?: string;
}

export function Select({
  options,
  value,
  defaultValue,
  onChange,
  placeholder = "Select an option...",
  disabled = false,
  ariaLabel,
  ariaLabelledBy,
  "aria-label": ariaLabelProp,
  "aria-labelledby": ariaLabelledByProp,
  id: externalId,
  className = "",
  name,
}: SelectProps) {
  const resolvedAriaLabel = ariaLabel ?? ariaLabelProp;
  const resolvedAriaLabelledBy = ariaLabelledBy ?? ariaLabelledByProp;
  const generatedId = useId();
  const baseId = externalId || generatedId;
  const triggerId = `${baseId}-trigger`;
  const listboxId = `${baseId}-listbox`;

  const [uncontrolledValue, setUncontrolledValue] = useState<string | undefined>(
    defaultValue
  );
  const isControlled = value !== undefined;
  const selectedValue = isControlled ? value : uncontrolledValue;

  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);
  const typeaheadTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const typeaheadBufferRef = useRef<string>("");

  const selectedOption = options.find((opt) => opt.value === selectedValue);

  const handleSelect = useCallback(
    (optValue: string) => {
      const option = options.find((o) => o.value === optValue);
      if (option?.disabled) return;

      if (!isControlled) {
        setUncontrolledValue(optValue);
      }
      onChange?.(optValue);
      setIsOpen(false);
      triggerRef.current?.focus();
    },
    [isControlled, onChange, options]
  );

  // Synchronize highlightedIndex when opened
  useEffect(() => {
    if (isOpen) {
      const idx = options.findIndex((opt) => opt.value === selectedValue);
      setHighlightedIndex(idx >= 0 ? idx : 0);
    }
  }, [isOpen, selectedValue, options]);

  // Click outside listener
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && listboxRef.current) {
      const itemEl = listboxRef.current.children[highlightedIndex] as HTMLElement;
      if (itemEl) {
        itemEl.scrollIntoView({ block: "nearest" });
      }
    }
  }, [isOpen, highlightedIndex]);

  const findNextValidIndex = useCallback(
    (current: number, direction: 1 | -1): number => {
      let next = current + direction;
      while (next >= 0 && next < options.length) {
        if (!options[next].disabled) return next;
        next += direction;
      }
      return current;
    },
    [options]
  );

  // Unified keyboard navigation on trigger button (W3C ARIA APG Combobox Select-Only)
  const handleTriggerKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else {
        setHighlightedIndex((prev) => findNextValidIndex(prev, 1));
      }
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else {
        setHighlightedIndex((prev) => findNextValidIndex(prev, -1));
      }
      return;
    }

    if (e.key === "Home" && isOpen) {
      e.preventDefault();
      const first = options.findIndex((opt) => !opt.disabled);
      if (first >= 0) setHighlightedIndex(first);
      return;
    }

    if (e.key === "End" && isOpen) {
      e.preventDefault();
      for (let i = options.length - 1; i >= 0; i--) {
        if (!options[i].disabled) {
          setHighlightedIndex(i);
          break;
        }
      }
      return;
    }

    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else {
        if (highlightedIndex >= 0 && highlightedIndex < options.length) {
          handleSelect(options[highlightedIndex].value);
        }
      }
      return;
    }

    if (e.key === "Escape" && isOpen) {
      e.preventDefault();
      e.stopPropagation();
      setIsOpen(false);
      return;
    }

    if (e.key === "Tab" && isOpen) {
      setIsOpen(false);
      return;
    }

    // Typeahead search
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      if (typeaheadTimeoutRef.current) {
        clearTimeout(typeaheadTimeoutRef.current);
      }

      typeaheadBufferRef.current += e.key.toLowerCase();
      typeaheadTimeoutRef.current = setTimeout(() => {
        typeaheadBufferRef.current = "";
      }, 500);

      const query = typeaheadBufferRef.current;
      const matchIndex = options.findIndex(
        (opt) => !opt.disabled && opt.label.toLowerCase().startsWith(query)
      );

      if (matchIndex >= 0) {
        if (!isOpen) {
          setIsOpen(true);
        }
        setHighlightedIndex(matchIndex);
      }
    }
  };

  const highlightedOptionId =
    isOpen && highlightedIndex >= 0
      ? `${baseId}-option-${highlightedIndex}`
      : undefined;

  return (
    <div
      ref={containerRef}
      className={`${styles.container} ${isOpen ? styles.containerOpen : ""} ${className}`.trim()}
    >
      {/* Hidden input for form submission integration */}
      {name && (
        <input
          type="hidden"
          name={name}
          value={selectedValue || ""}
          disabled={disabled}
        />
      )}

      <button
        ref={triggerRef}
        id={triggerId}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-activedescendant={highlightedOptionId}
        aria-label={resolvedAriaLabel}
        aria-labelledby={resolvedAriaLabelledBy}
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        onKeyDown={handleTriggerKeyDown}
        className={`${styles.trigger} ${disabled ? styles.triggerDisabled : ""}`}
      >
        <span
          className={`${styles.value} ${
            !selectedOption ? styles.placeholder : ""
          }`}
        >
          {selectedOption ? (
            <span className={styles.selectedContent}>
              {selectedOption.rarity && (
                <span
                  className={`${styles.rarityPip} ${
                    styles[`rarity_${selectedOption.rarity}`] || ""
                  }`}
                  aria-hidden="true"
                />
              )}
              {selectedOption.icon && (
                <span className={styles.optionIcon}>{selectedOption.icon}</span>
              )}
              <span className={styles.optionLabelText}>{selectedOption.label}</span>
              {selectedOption.badge && (
                <span className={styles.badge}>{selectedOption.badge}</span>
              )}
            </span>
          ) : (
            placeholder
          )}
        </span>
        <span
          className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ""}`}
          aria-hidden="true"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </span>
      </button>

      {isOpen && (
        <ul
          ref={listboxRef}
          id={listboxId}
          role="listbox"
          tabIndex={-1}
          aria-label={resolvedAriaLabel}
          aria-labelledby={resolvedAriaLabel ? undefined : (resolvedAriaLabelledBy ?? triggerId)}
          aria-activedescendant={highlightedOptionId}
          className={styles.listbox}
        >
          {options.map((option, idx) => {
            const isSelected = option.value === selectedValue;
            const isHighlighted = idx === highlightedIndex;
            const optionId = `${baseId}-option-${idx}`;

            return (
              <li
                key={option.value}
                id={optionId}
                role="option"
                aria-selected={isSelected}
                aria-disabled={option.disabled}
                onClick={() => handleSelect(option.value)}
                onMouseEnter={() => {
                  if (!option.disabled) setHighlightedIndex(idx);
                }}
                className={`${styles.option} ${
                  isHighlighted ? styles.optionHighlighted : ""
                } ${isSelected ? styles.optionSelected : ""} ${
                  option.disabled ? styles.optionDisabled : ""
                }`}
              >
                <div className={styles.optionContent}>
                  <div className={styles.optionMainRow}>
                    {option.rarity && (
                      <span
                        className={`${styles.rarityPip} ${
                          styles[`rarity_${option.rarity}`] || ""
                        }`}
                        aria-hidden="true"
                      />
                    )}
                    {option.icon && (
                      <span className={styles.optionIcon}>{option.icon}</span>
                    )}
                    <span className={styles.optionLabel}>{option.label}</span>
                    {option.badge && (
                      <span className={styles.badge}>{option.badge}</span>
                    )}
                  </div>
                  {option.description && (
                    <span className={styles.optionDescription}>
                      {option.description}
                    </span>
                  )}
                </div>
                {isSelected && (
                  <span className={styles.checkIcon} aria-hidden="true">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
