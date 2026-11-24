"use client";

import React from "react";
import styles from "./Separator.module.css";

export type SeparatorOrientation = "horizontal" | "vertical";
export type SeparatorSpacing = "none" | "sm" | "md" | "lg";

export interface SeparatorProps extends React.HTMLAttributes<HTMLHRElement | HTMLDivElement> {
  orientation?: SeparatorOrientation;
  decorative?: boolean;
  spacing?: SeparatorSpacing;
  className?: string;
  // Interactive window splitter props
  interactive?: boolean;
  valueNow?: number;
  valueMin?: number;
  valueMax?: number;
  onResizeStep?: (delta: number) => void;
}

export function Separator({
  orientation = "horizontal",
  decorative = true,
  spacing = "none",
  className = "",
  interactive = false,
  valueNow,
  valueMin = 0,
  valueMax = 100,
  onResizeStep,
  ...restProps
}: SeparatorProps) {
  const orientationClass =
    orientation === "vertical" ? styles.vertical : styles.horizontal;

  const spacingClass =
    spacing === "sm"
      ? styles.marginSm
      : spacing === "md"
      ? styles.marginMd
      : spacing === "lg"
      ? styles.marginLg
      : styles.marginNone;

  const interactiveClass = interactive ? styles.interactive : "";

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!interactive || !onResizeStep) return;

    if (orientation === "horizontal") {
      if (e.key === "ArrowUp") {
        e.preventDefault();
        onResizeStep(-1);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        onResizeStep(1);
      }
    } else {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        onResizeStep(-1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        onResizeStep(1);
      }
    }
  };

  if (interactive) {
    return (
      <div
        role="separator"
        tabIndex={0}
        aria-orientation={orientation}
        aria-valuenow={valueNow}
        aria-valuemin={valueMin}
        aria-valuemax={valueMax}
        onKeyDown={handleKeyDown}
        className={`${styles.separator} ${orientationClass} ${spacingClass} ${interactiveClass} ${className}`.trim()}
        {...(restProps as React.HTMLAttributes<HTMLDivElement>)}
      />
    );
  }

  if (orientation === "vertical") {
    return (
      <div
        role={decorative ? "none" : "separator"}
        aria-orientation="vertical"
        className={`${styles.separator} ${styles.vertical} ${spacingClass} ${className}`.trim()}
        {...(restProps as React.HTMLAttributes<HTMLDivElement>)}
      />
    );
  }

  return (
    <hr
      role={decorative ? "none" : undefined}
      className={`${styles.separator} ${styles.horizontal} ${spacingClass} ${className}`.trim()}
      {...(restProps as React.HTMLAttributes<HTMLHRElement>)}
    />
  );
}
