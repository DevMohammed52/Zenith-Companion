import React, { useId, useState, useRef } from "react";
import styles from "./RadioGroup.module.css";

export interface RadioOption {
  value: string;
  label: React.ReactNode;
  description?: React.ReactNode;
  disabled?: boolean;
  disabledReason?: string;
}

export interface RadioGroupProps {
  name?: string;
  options: RadioOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  legend?: string;
  helperText?: string;
  orientation?: "vertical" | "horizontal";
  variant?: "default" | "card";
  className?: string;
  disabled?: boolean;
}

export function RadioGroup({
  name,
  options,
  value,
  defaultValue,
  onChange,
  legend,
  helperText,
  orientation = "vertical",
  variant = "default",
  className,
  disabled = false,
}: RadioGroupProps) {
  const generatedName = useId();
  const groupName = name || generatedName;
  const helperId = `${groupName}-help`;

  const [internalVal, setInternalVal] = useState<string>(
    defaultValue || (options.length > 0 ? options[0].value : "")
  );

  const selectedValue = value !== undefined ? value : internalVal;
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const handleSelect = (val: string) => {
    if (disabled) return;
    if (value === undefined) {
      setInternalVal(val);
    }
    onChange?.(val);
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (disabled) return;
    const enabledIndices = options
      .map((opt, i) => (!opt.disabled && !disabled ? i : -1))
      .filter((i) => i !== -1);

    if (enabledIndices.length === 0) return;

    const currentPos = enabledIndices.indexOf(index);
    let nextIndex = -1;

    if (e.key === "ArrowDown" || e.key === "ArrowRight") {
      e.preventDefault();
      const nextPos = (currentPos + 1) % enabledIndices.length;
      nextIndex = enabledIndices[nextPos];
    } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
      e.preventDefault();
      const prevPos =
        (currentPos - 1 + enabledIndices.length) % enabledIndices.length;
      nextIndex = enabledIndices[prevPos];
    }

    if (nextIndex !== -1) {
      const nextOption = options[nextIndex];
      handleSelect(nextOption.value);
      inputRefs.current[nextIndex]?.focus();
    }
  };

  return (
    <fieldset
      className={`${styles.fieldset} ${className || ""}`.trim()}
      aria-describedby={helperText ? helperId : undefined}
    >
      {legend && <legend className={styles.legend}>{legend}</legend>}
      {helperText && (
        <p id={helperId} className={styles.helperText}>
          {helperText}
        </p>
      )}

      <div
        className={`${styles.optionsList} ${
          orientation === "horizontal" ? styles.horizontal : ""
        }`}
        role="radiogroup"
      >
        {options.map((opt, idx) => {
          const isSelected = selectedValue === opt.value;
          const isDisabled = disabled || !!opt.disabled;
          const isCard = variant === "card";

          return (
            <label
              key={opt.value}
              className={`${isCard ? styles.optionCard : styles.optionLabel} ${
                isSelected ? styles.selected : ""
              } ${isDisabled ? styles.disabled : ""}`}
            >
              <input
                ref={(el) => {
                  inputRefs.current[idx] = el;
                }}
                type="radio"
                name={groupName}
                value={opt.value}
                checked={isSelected}
                disabled={isDisabled}
                onChange={() => handleSelect(opt.value)}
                onKeyDown={(e) => handleKeyDown(e, idx)}
                className={styles.nativeRadio}
              />

              <span className={styles.radioCircle} aria-hidden="true">
                <span className={styles.dot} />
              </span>

              <div className={styles.content}>
                <span className={styles.labelTitle}>{opt.label}</span>
                {opt.description && (
                  <span className={styles.description}>{opt.description}</span>
                )}
                {opt.disabledReason && isDisabled && (
                  <span className={styles.disabledReason}>
                    {opt.disabledReason}
                  </span>
                )}
              </div>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
