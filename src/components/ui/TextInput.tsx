import React, { forwardRef, useId } from "react";
import styles from "./TextInput.module.css";

export interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode;
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightSlot?: React.ReactNode;
  containerClassName?: string;
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(function TextInput(
  {
    id: externalId,
    label,
    helperText,
    error,
    leftIcon,
    rightSlot,
    className = "",
    containerClassName = "",
    disabled,
    required,
    ...props
  },
  ref
) {
  const generatedId = useId();
  const inputId = externalId || `input-${generatedId}`;
  const errorId = `${inputId}-error`;
  const helperId = `${inputId}-helper`;

  const describedBy = error
    ? errorId
    : helperText
    ? helperId
    : undefined;

  const wrapperClasses = [
    styles.inputWrapper,
    leftIcon ? styles.hasLeftIcon : "",
    rightSlot ? styles.hasRightSlot : "",
    error ? styles.hasError : "",
    disabled ? styles.disabled : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={`${styles.fieldGroup} ${containerClassName}`.trim()}>
      {label && (
        <div className={styles.labelRow}>
          <label htmlFor={inputId} className={styles.label}>
            {label}
            {required && <span className={styles.required} aria-hidden="true">*</span>}
          </label>
        </div>
      )}

      <div className={wrapperClasses}>
        {leftIcon && <div className={styles.leftIcon}>{leftIcon}</div>}
        <input
          ref={ref}
          id={inputId}
          className={`${styles.input} ${className}`.trim()}
          disabled={disabled}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          {...props}
        />
        {rightSlot && <div className={styles.rightSlot}>{rightSlot}</div>}
      </div>

      {error ? (
        <p id={errorId} className={styles.errorText} role="alert">
          {error}
        </p>
      ) : helperText ? (
        <p id={helperId} className={styles.helperText}>
          {helperText}
        </p>
      ) : null}
    </div>
  );
});

TextInput.displayName = "TextInput";
