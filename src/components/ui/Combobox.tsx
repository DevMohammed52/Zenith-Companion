"use client";

import React, { useState, useRef, useId, useEffect } from "react";
import styles from "./Combobox.module.css";

export interface ComboboxOption {
  id: string | number;
  label: string;
  description?: string;
  meta?: string;
  rarity?: string;
  icon?: React.ReactNode;
}

export interface ComboboxProps {
  options: ComboboxOption[];
  value?: string;
  onChange?: (query: string) => void;
  onSelect: (option: ComboboxOption) => void;
  placeholder?: string;
  "aria-label"?: string;
  name?: string;
  emptyMessage?: string;
  className?: string;
  disabled?: boolean;
}

export function Combobox({
  options,
  value: controlledValue,
  onChange,
  onSelect,
  placeholder = "Search...",
  "aria-label": ariaLabel = "Search and select",
  name,
  emptyMessage = "No matching items found",
  className = "",
  disabled = false,
}: ComboboxProps) {
  const [internalValue, setInternalValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const [isFocused, setIsFocused] = useState(false);

  const query = controlledValue !== undefined ? controlledValue : internalValue;
  const listboxId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);

  // Filter options based on query
  const filteredOptions = query.trim()
    ? options.filter((opt) =>
        opt.label.toLowerCase().includes(query.toLowerCase()) ||
        (opt.description && opt.description.toLowerCase().includes(query.toLowerCase()))
      )
    : options;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value;
    if (controlledValue === undefined) {
      setInternalValue(next);
    }
    onChange?.(next);
    setIsOpen(true);
    setActiveIndex(0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        setActiveIndex(0);
      } else {
        setActiveIndex((prev) => (prev < filteredOptions.length - 1 ? prev + 1 : 0));
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        setActiveIndex(filteredOptions.length - 1);
      } else {
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : filteredOptions.length - 1));
      }
    } else if (e.key === "Enter") {
      if (isOpen && activeIndex >= 0 && activeIndex < filteredOptions.length) {
        e.preventDefault();
        const selected = filteredOptions[activeIndex];
        onSelect(selected);
        if (controlledValue === undefined) {
          setInternalValue(selected.label);
        }
        setIsOpen(false);
      }
    } else if (e.key === "Escape") {
      if (isOpen) {
        e.preventDefault();
        setIsOpen(false);
      } else if (query) {
        e.preventDefault();
        if (controlledValue === undefined) {
          setInternalValue("");
        }
        onChange?.("");
      }
    }
  };

  const handleSelectOption = (opt: ComboboxOption) => {
    onSelect(opt);
    if (controlledValue === undefined) {
      setInternalValue(opt.label);
    }
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleClear = () => {
    if (controlledValue === undefined) {
      setInternalValue("");
    }
    onChange?.("");
    inputRef.current?.focus();
  };

  // Scroll active item into view
  useEffect(() => {
    if (isOpen && activeIndex >= 0 && listboxRef.current) {
      const activeEl = listboxRef.current.children[activeIndex] as HTMLElement | undefined;
      activeEl?.scrollIntoView({ block: "nearest" });
    }
  }, [isOpen, activeIndex]);

  // Click outside listener
  useEffect(() => {
    const handlePointerDownOutside = (e: MouseEvent) => {
      if (
        listboxRef.current &&
        !listboxRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handlePointerDownOutside);
    return () => document.removeEventListener("mousedown", handlePointerDownOutside);
  }, []);

  const activeOption = activeIndex >= 0 && activeIndex < filteredOptions.length ? filteredOptions[activeIndex] : null;
  const activeDescendantId = activeOption ? `${listboxId}-opt-${activeOption.id}` : undefined;

  return (
    <div className={`${styles.combobox} ${className}`.trim()}>
      <div className={`${styles.inputWrap} ${isFocused ? styles.isFocused : ""}`}>
        <div className={styles.iconSlot} aria-hidden="true">
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
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </div>

        <input
          ref={inputRef}
          type="text"
          role="combobox"
          name={name}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-activedescendant={isOpen ? activeDescendantId : undefined}
          aria-label={ariaLabel}
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            setIsFocused(true);
            setIsOpen(true);
          }}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          spellCheck="false"
          className={styles.input}
        />

        {query && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear input"
            className={styles.clearButton}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        )}
      </div>

      {isOpen && (
        <ul
          ref={listboxRef}
          id={listboxId}
          role="listbox"
          aria-label={ariaLabel}
          className={styles.dropdown}
        >
          {filteredOptions.length === 0 ? (
            <li className={styles.emptyNotice} role="status">
              {emptyMessage}
            </li>
          ) : (
            filteredOptions.map((opt, idx) => {
              const optId = `${listboxId}-opt-${opt.id}`;
              const isActive = idx === activeIndex;

              return (
                <li
                  key={opt.id}
                  id={optId}
                  role="option"
                  aria-selected={isActive}
                  onClick={() => handleSelectOption(opt)}
                  className={`${styles.option} ${isActive ? styles.isActive : ""}`}
                >
                  <div className={styles.optionLabel}>
                    {opt.icon && <span aria-hidden="true">{opt.icon}</span>}
                    <span>{opt.label}</span>
                  </div>
                  {opt.meta && <span className={styles.optionMeta}>{opt.meta}</span>}
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}
