import React, { useRef, useId, useCallback } from "react";
import styles from "./Slider.module.css";

export type SliderValue = number | [number, number];

export interface SliderProps {
  value: SliderValue;
  onChange: (value: any) => void;
  onChangeEnd?: (value: any) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  valueFormat?: (val: number) => string;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  minAriaLabel?: string;
  maxAriaLabel?: string;
}

function clamp(val: number, min: number, max: number): number {
  return Math.min(Math.max(val, min), max);
}

function roundToStep(val: number, min: number, step: number): number {
  const steps = Math.round((val - min) / step);
  return min + steps * step;
}

export function Slider({
  value,
  onChange,
  onChangeEnd,
  min = 0,
  max = 100,
  step = 1,
  label,
  valueFormat,
  disabled = false,
  className,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  minAriaLabel = "Minimum value",
  maxAriaLabel = "Maximum value",
}: SliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const labelId = useId();
  const isRange = Array.isArray(value);

  const format = useCallback(
    (v: number) => (valueFormat ? valueFormat(v) : v.toString()),
    [valueFormat]
  );

  const getPercentage = useCallback(
    (v: number) => {
      if (max <= min) return 0;
      return clamp(((v - min) / (max - min)) * 100, 0, 100);
    },
    [min, max]
  );

  const getValueFromPosition = useCallback(
    (clientX: number): number => {
      if (!trackRef.current) return min;
      const rect = trackRef.current.getBoundingClientRect();
      const pos = clamp((clientX - rect.left) / rect.width, 0, 1);
      const raw = min + pos * (max - min);
      return clamp(roundToStep(raw, min, step), min, max);
    },
    [min, max, step]
  );

  const handleTrackPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled || !trackRef.current) return;
    const clickedVal = getValueFromPosition(e.clientX);

    if (isRange) {
      const [currMin, currMax] = value as [number, number];
      const distMin = Math.abs(clickedVal - currMin);
      const distMax = Math.abs(clickedVal - currMax);
      let next: [number, number];
      if (distMin <= distMax) {
        next = [Math.min(clickedVal, currMax), currMax];
      } else {
        next = [currMin, Math.max(clickedVal, currMin)];
      }
      onChange(next);
      onChangeEnd?.(next);
    } else {
      onChange(clickedVal);
      onChangeEnd?.(clickedVal);
    }
  };

  const createThumbPointerHandler = (thumbIndex?: 0 | 1) => {
    return (e: React.PointerEvent<HTMLDivElement>) => {
      if (disabled) return;
      e.stopPropagation();
      const thumb = e.currentTarget;
      thumb.setPointerCapture(e.pointerId);

      const onPointerMove = (moveEvent: PointerEvent) => {
        const newVal = getValueFromPosition(moveEvent.clientX);
        if (isRange) {
          const [currMin, currMax] = value as [number, number];
          if (thumbIndex === 0) {
            const nextMin = Math.min(newVal, currMax);
            onChange([nextMin, currMax]);
          } else {
            const nextMax = Math.max(newVal, currMin);
            onChange([currMin, nextMax]);
          }
        } else {
          onChange(newVal);
        }
      };

      const onPointerUp = (upEvent: PointerEvent) => {
        thumb.releasePointerCapture(upEvent.pointerId);
        thumb.removeEventListener("pointermove", onPointerMove);
        thumb.removeEventListener("pointerup", onPointerUp);
        thumb.removeEventListener("pointercancel", onPointerUp);
        if (onChangeEnd) {
          const finalVal = getValueFromPosition(upEvent.clientX);
          if (isRange) {
            const [currMin, currMax] = value as [number, number];
            if (thumbIndex === 0) {
              onChangeEnd([Math.min(finalVal, currMax), currMax]);
            } else {
              onChangeEnd([currMin, Math.max(finalVal, currMin)]);
            }
          } else {
            onChangeEnd(finalVal);
          }
        }
      };

      thumb.addEventListener("pointermove", onPointerMove);
      thumb.addEventListener("pointerup", onPointerUp);
      thumb.addEventListener("pointercancel", onPointerUp);
    };
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLDivElement>,
    thumbIndex?: 0 | 1
  ) => {
    if (disabled) return;
    const bigStep = step * 10;
    let delta = 0;

    switch (e.key) {
      case "ArrowRight":
      case "ArrowUp":
        delta = step;
        break;
      case "ArrowLeft":
      case "ArrowDown":
        delta = -step;
        break;
      case "PageUp":
        delta = bigStep;
        break;
      case "PageDown":
        delta = -bigStep;
        break;
      case "Home":
        if (isRange) {
          const [currMin, currMax] = value as [number, number];
          const next: [number, number] =
            thumbIndex === 0 ? [min, currMax] : [currMin, currMin];
          onChange(next);
        } else {
          onChange(min);
        }
        e.preventDefault();
        return;
      case "End":
        if (isRange) {
          const [currMin, currMax] = value as [number, number];
          const next: [number, number] =
            thumbIndex === 0 ? [currMax, currMax] : [currMin, max];
          onChange(next);
        } else {
          onChange(max);
        }
        e.preventDefault();
        return;
      default:
        return;
    }

    e.preventDefault();

    if (isRange) {
      const [currMin, currMax] = value as [number, number];
      if (thumbIndex === 0) {
        const nextMin = clamp(
          roundToStep(currMin + delta, min, step),
          min,
          currMax
        );
        onChange([nextMin, currMax]);
      } else {
        const nextMax = clamp(
          roundToStep(currMax + delta, min, step),
          currMin,
          max
        );
        onChange([currMin, nextMax]);
      }
    } else {
      const currentVal = value as number;
      const nextVal = clamp(roundToStep(currentVal + delta, min, step), min, max);
      onChange(nextVal);
    }
  };

  const singleVal = isRange ? 0 : (value as number);
  const [minVal, maxVal] = isRange
    ? (value as [number, number])
    : [singleVal, singleVal];

  const fillLeft = isRange ? getPercentage(minVal) : 0;
  const fillWidth = isRange
    ? getPercentage(maxVal) - getPercentage(minVal)
    : getPercentage(singleVal);

  return (
    <div className={`${styles.container} ${className || ""}`.trim()}>
      {(label || value !== undefined) && (
        <div className={styles.header}>
          {label && (
            <span id={labelId} className={styles.label}>
              {label}
            </span>
          )}
          <span className={styles.value}>
            {isRange
              ? `${format(minVal)} – ${format(maxVal)}`
              : format(singleVal)}
          </span>
        </div>
      )}

      <div
        ref={trackRef}
        className={`${styles.trackContainer} ${disabled ? styles.disabled : ""}`}
        onPointerDown={handleTrackPointerDown}
      >
        <div className={styles.track}>
          <div
            className={styles.fill}
            style={{
              left: `${fillLeft}%`,
              width: `${fillWidth}%`,
            }}
          />

          {isRange ? (
            <>
              {/* Lower thumb */}
              <div
                role="slider"
                tabIndex={disabled ? -1 : 0}
                aria-label={minAriaLabel}
                aria-valuenow={minVal}
                aria-valuemin={min}
                aria-valuemax={maxVal}
                aria-valuetext={format(minVal)}
                aria-disabled={disabled || undefined}
                className={styles.thumb}
                style={{ left: `${getPercentage(minVal)}%` }}
                onPointerDown={createThumbPointerHandler(0)}
                onKeyDown={(e) => handleKeyDown(e, 0)}
              />
              {/* Upper thumb */}
              <div
                role="slider"
                tabIndex={disabled ? -1 : 0}
                aria-label={maxAriaLabel}
                aria-valuenow={maxVal}
                aria-valuemin={minVal}
                aria-valuemax={max}
                aria-valuetext={format(maxVal)}
                aria-disabled={disabled || undefined}
                className={styles.thumb}
                style={{ left: `${getPercentage(maxVal)}%` }}
                onPointerDown={createThumbPointerHandler(1)}
                onKeyDown={(e) => handleKeyDown(e, 1)}
              />
            </>
          ) : (
            <div
              role="slider"
              tabIndex={disabled ? -1 : 0}
              aria-labelledby={label ? labelId : ariaLabelledBy}
              aria-label={label ? undefined : ariaLabel || "Slider"}
              aria-valuenow={singleVal}
              aria-valuemin={min}
              aria-valuemax={max}
              aria-valuetext={format(singleVal)}
              aria-disabled={disabled || undefined}
              className={styles.thumb}
              style={{ left: `${getPercentage(singleVal)}%` }}
              onPointerDown={createThumbPointerHandler()}
              onKeyDown={(e) => handleKeyDown(e)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
