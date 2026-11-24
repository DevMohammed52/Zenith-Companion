"use client";

import React, {
  useState,
  useRef,
  useImperativeHandle,
  forwardRef,
  useCallback,
  useEffect,
} from "react";
import styles from "./SearchInput.module.css";

export interface SearchInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  onClear?: () => void;
  placeholder?: string;
  ariaLabel?: string;
  showShortcutHint?: boolean;
  shortcutHint?: string;
  className?: string;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  function SearchInput(
    {
      value: controlledValue,
      defaultValue = "",
      onChange,
      onClear,
      placeholder = "Search items, enemies, or recipes...",
      ariaLabel = "Search catalog",
      showShortcutHint = true,
      shortcutHint,
      className = "",
      onKeyDown,
      ...restProps
    },
    ref
  ) {
    const isControlled = controlledValue !== undefined;
    const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
    const value = isControlled ? controlledValue : uncontrolledValue;

    const inputRef = useRef<HTMLInputElement>(null);
    useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

    const [isMac, setIsMac] = useState(false);

    useEffect(() => {
      if (typeof window !== "undefined" && typeof navigator !== "undefined") {
        setIsMac(/(Mac|iPhone|iPod|iPad)/i.test(navigator.platform || ""));
      }
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const next = e.target.value;
      if (!isControlled) {
        setUncontrolledValue(next);
      }
      onChange?.(next);
    };

    const handleClear = useCallback(() => {
      if (!isControlled) {
        setUncontrolledValue("");
      }
      onChange?.("");
      onClear?.();
      inputRef.current?.focus();
    }, [isControlled, onChange, onClear]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Escape" && value) {
        e.preventDefault();
        e.stopPropagation();
        handleClear();
      }
      onKeyDown?.(e);
    };

    const displayShortcut = shortcutHint || (isMac ? "⌘K" : "Ctrl K");

    return (
      <search
        role="search"
        aria-label={ariaLabel}
        className={`${styles.searchWrapper} ${className}`.trim()}
      >
        <div className={styles.inputWrapper}>
          <span className={styles.leadingIcon} aria-hidden="true">
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
          </span>

          <input
            ref={inputRef}
            type="search"
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            aria-label={ariaLabel}
            aria-keyshortcuts="Control+K Meta+K"
            className={styles.input}
            {...restProps}
          />

          <div className={styles.trailingAffordance}>
            {value ? (
              <button
                type="button"
                onClick={handleClear}
                aria-label="Clear search query"
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
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            ) : showShortcutHint ? (
              <kbd className={styles.kbdHint} aria-hidden="true">
                {displayShortcut}
              </kbd>
            ) : null}
          </div>
        </div>
      </search>
    );
  }
);
