"use client";

import React, { useId, InputHTMLAttributes } from "react";
import styles from "./Switch.module.css";

export interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: React.ReactNode;
  description?: React.ReactNode;
}

export function Switch({
  label,
  description,
  checked,
  defaultChecked,
  onChange,
  disabled = false,
  id,
  className = "",
  ...rest
}: SwitchProps) {
  const autoId = useId();
  const inputId = id || autoId;
  const descId = description ? `${inputId}-desc` : undefined;

  return (
    <label
      htmlFor={inputId}
      className={`${styles.container} ${disabled ? styles.isDisabled : ""} ${className}`.trim()}
    >
      <input
        type="checkbox"
        role="switch"
        id={inputId}
        checked={checked}
        defaultChecked={defaultChecked}
        onChange={onChange}
        disabled={disabled}
        aria-checked={checked}
        aria-describedby={descId}
        className="sr-only"
        {...rest}
      />

      <span
        className={`${styles.track} ${checked ? styles.isChecked : ""}`}
        aria-hidden="true"
      >
        <span className={styles.thumb} />
      </span>

      <div className={styles.textGroup}>
        <span className={styles.label}>{label}</span>
        {description && (
          <span id={descId} className={styles.description}>
            {description}
          </span>
        )}
      </div>
    </label>
  );
}
