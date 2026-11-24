import React, { useId, forwardRef } from "react";
import styles from "./TextArea.module.css";

export interface TextAreaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  errorMessage?: string;
  maxLength?: number;
  mono?: boolean;
  isDataImport?: boolean;
  minRows?: number;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  (
    {
      label,
      helperText,
      errorMessage,
      maxLength,
      mono = false,
      isDataImport = false,
      minRows = 3,
      id,
      value,
      defaultValue,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const helperId = `${inputId}-helper`;
    const errorId = `${inputId}-error`;
    const counterId = `${inputId}-counter`;

    const stringVal =
      typeof value === "string"
        ? value
        : typeof defaultValue === "string"
        ? defaultValue
        : "";
    const charCount = stringVal.length;
    const isOverLimit = maxLength ? charCount > maxLength : false;

    // Describedby connections
    const describedByParts: string[] = [];
    if (helperText) describedByParts.push(helperId);
    if (errorMessage) describedByParts.push(errorId);
    if (maxLength) describedByParts.push(counterId);
    const ariaDescribedBy =
      describedByParts.length > 0 ? describedByParts.join(" ") : undefined;

    const useMono = mono || isDataImport;

    return (
      <div className={`${styles.container} ${className || ""}`.trim()}>
        {(label || maxLength) && (
          <div className={styles.header}>
            {label && (
              <label htmlFor={inputId} className={styles.label}>
                {label}
              </label>
            )}
            {maxLength !== undefined && (
              <span
                id={counterId}
                className={`${styles.counter} ${
                  isOverLimit ? styles.counterOver : ""
                }`}
                aria-live="polite"
              >
                {charCount.toLocaleString()} / {maxLength.toLocaleString()}
              </span>
            )}
          </div>
        )}

        <textarea
          ref={ref}
          id={inputId}
          rows={minRows}
          value={value}
          defaultValue={defaultValue}
          disabled={disabled}
          aria-invalid={errorMessage || isOverLimit ? "true" : undefined}
          aria-describedby={ariaDescribedBy}
          spellCheck={isDataImport ? false : props.spellCheck}
          autoCapitalize={isDataImport ? "off" : props.autoCapitalize}
          autoCorrect={isDataImport ? "off" : (props as any).autoCorrect}
          autoComplete={isDataImport ? "off" : props.autoComplete}
          wrap={isDataImport ? "off" : props.wrap}
          className={`${styles.textarea} ${useMono ? styles.mono : ""} ${
            errorMessage || isOverLimit ? styles.error : ""
          }`}
          {...props}
        />

        {helperText && !errorMessage && (
          <p id={helperId} className={styles.helper}>
            {helperText}
          </p>
        )}

        {errorMessage && (
          <p id={errorId} className={styles.errorMessage} role="alert">
            {errorMessage}
          </p>
        )}
      </div>
    );
  }
);

TextArea.displayName = "TextArea";
