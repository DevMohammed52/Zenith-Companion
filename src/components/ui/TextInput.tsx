import React, { forwardRef, useId } from "react";
import styles from "./TextInput.module.css";

export interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode;
  labelAction?: React.ReactNode;
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightSlot?: React.ReactNode;
  containerClassName?: string;
  onEscape?: () => void;
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(function TextInput(
  {
    id: externalId,
    label,
    labelAction,
    helperText,
    error,
    leftIcon,
    rightSlot,
    className = "",
    containerClassName = "",
    disabled,
    required,
    onKeyDown,
    onEscape,
    ...props
  },
  ref
) {
  const generatedId = useId();
  const inputId = externalId || `input-${generatedId}`;
  const errorId = `${inputId}-error`;
  const helperId = `${inputId}-helper`;

  const describedBy = [error ? errorId : null, helperText ? helperId : null]
    .filter(Boolean)
    .join(" ") || undefined;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      onEscape?.();
    }
    onKeyDown?.(e);
  };

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
      {(label || labelAction) && (
        <div className={styles.labelRow}>
          {label ? (
            <label htmlFor={inputId} className={styles.label}>
              {label}
              {required && <span className={styles.required} aria-hidden="true">*</span>}
            </label>
          ) : <span />}
          {labelAction && <div className={styles.labelAction}>{labelAction}</div>}
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
          onKeyDown={handleKeyDown}
          {...props}
        />
        {rightSlot && <div className={styles.rightSlot}>{rightSlot}</div>}
      </div>

      {(error || helperText) && (
        <div className={styles.messageRow}>
          {error && (
            <p id={errorId} className={styles.errorText} role="alert">
              {error}
            </p>
          )}
          {helperText && (
            <p id={helperId} className={styles.helperText}>
              {helperText}
            </p>
          )}
        </div>
      )}
    </div>
  );
});

TextInput.displayName = "TextInput";
