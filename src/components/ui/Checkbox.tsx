"use client";

import React, { useRef, useEffect, useId, InputHTMLAttributes } from "react";
import styles from "./Checkbox.module.css";

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: React.ReactNode;
  description?: React.ReactNode;
  indeterminate?: boolean;
}

export function Checkbox({
  label,
  description,
  indeterminate = false,
  checked,
  defaultChecked,
  onChange,
  disabled = false,
  id,
  className = "",
  ...rest
}: CheckboxProps) {
  const autoId = useId();
  const inputId = id || autoId;
  const descId = description ? `${inputId}-desc` : undefined;
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  return (
    <label
      htmlFor={inputId}
      className={`${styles.labelContainer} ${disabled ? styles.isDisabled : ""} ${className}`.trim()}
    >
      <input
        ref={inputRef}
        type="checkbox"
        id={inputId}
        checked={checked}
        defaultChecked={defaultChecked}
        onChange={onChange}
        disabled={disabled}
        aria-describedby={descId}
        className="sr-only"
        {...rest}
      />

      <span
        className={`${styles.box} ${checked ? styles.isChecked : ""} ${indeterminate ? styles.isIndeterminate : ""}`}
        aria-hidden="true"
      >
        {indeterminate ? (
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          >
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        ) : checked ? (
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : null}
      </span>

      <div className={styles.textGroup}>
        <span className={styles.labelText}>{label}</span>
        {description && (
          <span id={descId} className={styles.description}>
            {description}
          </span>
        )}
      </div>
    </label>
  );
}
