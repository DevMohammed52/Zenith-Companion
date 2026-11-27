"use client";

import React, { ReactNode } from "react";
import styles from "./ProgressBar.module.css";

export type ProgressVariant = "default" | "success" | "danger";
export type ProgressSize = "sm" | "md" | "lg";

export interface ProgressBarProps {
  value: number;
  min?: number;
  max?: number;
  label?: string;
  ariaLabel?: string;
  valueText?: string;
  variant?: ProgressVariant;
  size?: ProgressSize;
  mode?: "progressbar" | "meter";
  showReadout?: boolean;
  showValue?: boolean;
  className?: string;
}

export function ProgressBar({
  value,
  min = 0,
  max = 100,
  label,
  ariaLabel,
  valueText,
  variant = "default",
  size = "md",
  mode = "progressbar",
  showReadout = true,
  showValue,
  className = "",
}: ProgressBarProps) {
  const clamped = Math.max(min, Math.min(value, max));
  const percent = max > min ? ((clamped - min) / (max - min)) * 100 : 0;
  const scale = percent / 100;

  const role = mode === "meter" ? "meter" : "progressbar";
  const shouldShowReadout = showValue !== undefined ? showValue : showReadout;
  const displayReadout = valueText || `${Math.round(percent)}%`;

  return (
    <div className={`${styles.container} ${className}`.trim()}>
      {(label || shouldShowReadout) && (
        <div className={styles.header}>
          {label && <span className={styles.label}>{label}</span>}
          {shouldShowReadout && <span className={styles.readout}>{displayReadout}</span>}
        </div>
      )}

      <div
        role={role}
        aria-valuenow={clamped}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuetext={displayReadout}
        aria-label={ariaLabel || label || valueText || "Progress"}
        className={`${styles.track} ${styles[`size_${size}`]}`}
      >
        <div
          className={[styles.fill, styles[`color_${variant}`] || ""].filter(Boolean).join(" ")}
          style={{ transform: `scaleX(${scale})` }}
        />
      </div>
    </div>
  );
}

export interface ProgressRingProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  variant?: ProgressVariant;
  label?: string;
  children?: ReactNode;
  className?: string;
}

export function ProgressRing({
  value,
  max = 100,
  size = 48,
  strokeWidth = 4,
  variant = "default",
  label,
  children,
  className = "",
}: ProgressRingProps) {
  const clamped = Math.max(0, Math.min(value, max));
  const percent = max > 0 ? clamped / max : 0;

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - percent);

  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label}
      style={{ width: size, height: size }}
      className={`${styles.ringContainer} ${className}`.trim()}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className={styles.ringSvg}
        aria-hidden="true"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          fill="none"
          className={styles.ringTrack}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={`${styles.ringFill} ${styles[`color_${variant}`]}`}
        />
      </svg>

      {children && <div className={styles.ringCenterText}>{children}</div>}
    </div>
  );
}

export interface MeterProps {
  value: number;
  min?: number;
  max?: number;
  low?: number;
  high?: number;
  optimum?: number;
  label?: string;
  valueText?: string;
  showReadout?: boolean;
  className?: string;
}

export function Meter({
  value,
  min = 0,
  max = 100,
  low,
  high,
  optimum,
  label,
  valueText,
  showReadout = true,
  className = "",
}: MeterProps) {
  let variant: ProgressVariant = "default";
  if (optimum !== undefined) {
    if (low !== undefined && high !== undefined) {
      if (optimum < low) {
        variant = value <= low ? "success" : value >= high ? "danger" : "default";
      } else {
        variant = value >= high ? "success" : value <= low ? "danger" : "default";
      }
    }
  }

  return (
    <ProgressBar
      value={value}
      min={min}
      max={max}
      label={label}
      valueText={valueText}
      variant={variant}
      mode="meter"
      showReadout={showReadout}
      className={className}
    />
  );
}

