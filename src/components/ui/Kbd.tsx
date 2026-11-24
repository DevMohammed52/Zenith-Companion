"use client";

import React from "react";
import styles from "./Kbd.module.css";

export type KbdSize = "sm" | "md" | "lg";

export interface KbdProps extends React.HTMLAttributes<HTMLElement> {
  children?: React.ReactNode;
  keys?: string[];
  size?: KbdSize;
  className?: string;
}

export function Kbd({
  children,
  keys,
  size = "md",
  className = "",
  ...restProps
}: KbdProps) {
  const sizeClass =
    size === "sm" ? styles.sizeSm : size === "lg" ? styles.sizeLg : styles.sizeMd;

  if (keys && keys.length > 0) {
    return (
      <kbd
        className={`${styles.kbdGroup} ${sizeClass} ${className}`.trim()}
        {...restProps}
      >
        {keys.map((keyStr, idx) => (
          <React.Fragment key={idx}>
            <kbd className={styles.kbd}>{keyStr}</kbd>
            {idx < keys.length - 1 && (
              <span className={styles.separator} aria-hidden="true">
                +
              </span>
            )}
          </React.Fragment>
        ))}
      </kbd>
    );
  }

  return (
    <kbd
      className={`${styles.kbd} ${sizeClass} ${className}`.trim()}
      {...restProps}
    >
      {children}
    </kbd>
  );
}
