"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useId,
  KeyboardEvent,
  WheelEvent,
  ReactNode,
} from "react";
import styles from "./NumberInput.module.css";

export interface NumberInputProps {
  label?: string;
  value?: number;
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
  onChange?: (value: number) => void;
  prefix?: ReactNode;
  suffix?: ReactNode;
  disabled?: boolean;
  helperText?: string;
  error?: string;
  errorMessage?: string;
  showSteppers?: boolean;
  id?: string;
  name?: string;
  className?: string;
}

export function NumberInput({
  label,
  value: controlledValue,
  defaultValue = 0,
  min,
  max,
  step = 1,
  onChange,
  prefix,
  suffix,
  disabled = false,
  helperText,
  error,
  errorMessage,
  showSteppers = true,
  id,
  name,
  className = "",
}: NumberInputProps) {
  const autoId = useId();
  const inputId = id || autoId;
  const effectiveError = errorMessage || error;
  const helperId = helperText ? `${inputId}-help` : undefined;
  const errorId = effectiveError ? `${inputId}-err` : undefined;

  const initialVal = controlledValue !== undefined ? controlledValue : defaultValue;
  const [internalValue, setInternalValue] = useState(initialVal);
  const [rawText, setRawText] = useState(String(initialVal));
  const [isFocused, setIsFocused] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const currentVal = controlledValue !== undefined ? controlledValue : internalValue;

  // Sync external controlled value
  useEffect(() => {
    if (controlledValue !== undefined && !isFocused) {
      setRawText(String(controlledValue));
    }
  }, [controlledValue, isFocused]);

  const commitValue = (num: number) => {
    let clamped = num;
    if (min !== undefined) clamped = Math.max(min, clamped);
    if (max !== undefined) clamped = Math.min(max, clamped);

    if (controlledValue === undefined) {
      setInternalValue(clamped);
    }
    setRawText(String(clamped));
    onChange?.(clamped);
  };

  const handleBlur = () => {
    setIsFocused(false);
    const parsed = Number(rawText.replace(/,/g, ""));
    if (isNaN(parsed)) {
      setRawText(String(currentVal));
    } else {
      commitValue(parsed);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    const allowedKeys = [
      "Backspace",
      "Delete",
      "Tab",
      "ArrowLeft",
      "ArrowRight",
      "ArrowUp",
      "ArrowDown",
      "Enter",
      "Home",
      "End",
    ];
    if (!allowedKeys.includes(e.key) && !e.ctrlKey && !e.metaKey && !/^[0-9]$/.test(e.key)) {
      e.preventDefault();
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      commitValue(currentVal + step);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      commitValue(currentVal - step);
    } else if (e.key === "PageUp") {
      e.preventDefault();
      commitValue(currentVal + step * 10);
    } else if (e.key === "PageDown") {
      e.preventDefault();
      commitValue(currentVal - step * 10);
    } else if (e.key === "Home" && min !== undefined) {
      e.preventDefault();
      commitValue(min);
    } else if (e.key === "End" && max !== undefined) {
      e.preventDefault();
      commitValue(max);
    } else if (e.key === "Enter") {
      e.preventDefault();
      handleBlur();
    }
  };

  // Prevent scroll wheel mutation
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    const preventWheel = (e: globalThis.WheelEvent) => {
      if (document.activeElement === el) {
        e.preventDefault();
      }
    };
    el.addEventListener("wheel", preventWheel, { passive: false });
    return () => el.removeEventListener("wheel", preventWheel);
  }, []);

  const handleStep = (direction: 1 | -1) => {
    commitValue(currentVal + direction * step);
    inputRef.current?.focus();
  };

  const isMin = min !== undefined && currentVal <= min;
  const isMax = max !== undefined && currentVal >= max;

  return (
    <div className={`${styles.container} ${className}`.trim()}>
      {label && (
        <div className={styles.labelRow}>
          <label htmlFor={inputId} className={styles.label}>
            {label}
          </label>
        </div>
      )}

      <div
        className={`${styles.controlsWrap} ${isFocused ? styles.isFocused : ""} ${effectiveError ? styles.isError : ""}`}
      >
        {showSteppers && (
          <button
            type="button"
            tabIndex={-1}
            aria-label={label ? `Decrease ${label}` : "Decrease value"}
            disabled={disabled || isMin}
            onClick={() => handleStep(-1)}
            className={styles.stepperBtn}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        )}

        <div className={styles.inputWrap}>
          {prefix && <span className={styles.adornment}>{prefix}</span>}

          <input
            ref={inputRef}
            type="text"
            role="spinbutton"
            id={inputId}
            name={name}
            inputMode="numeric"
            pattern="[0-9]*"
            aria-valuenow={currentVal}
            aria-valuemin={min}
            aria-valuemax={max}
            aria-describedby={errorId || helperId}
            aria-invalid={Boolean(effectiveError)}
            value={isFocused ? rawText : currentVal.toLocaleString()}
            onChange={(e) => {
              const sanitized = e.target.value.replace(/[^0-9]/g, "");
              setRawText(sanitized);
            }}
            onFocus={() => {
              setIsFocused(true);
              setRawText(String(currentVal));
            }}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            autoComplete="off"
            spellCheck="false"
            className={styles.input}
          />

          {suffix && <span className={styles.adornment}>{suffix}</span>}
        </div>

        {showSteppers && (
          <button
            type="button"
            tabIndex={-1}
            aria-label={label ? `Increase ${label}` : "Increase value"}
            disabled={disabled || isMax}
            onClick={() => handleStep(1)}
            className={styles.stepperBtn}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        )}
      </div>

      {effectiveError ? (
        <span id={errorId} role="alert" className={styles.errorText}>
          {effectiveError}
        </span>
      ) : helperText ? (
        <span id={helperId} className={styles.helperText}>
          {helperText}
        </span>
      ) : null}
    </div>
  );
}
