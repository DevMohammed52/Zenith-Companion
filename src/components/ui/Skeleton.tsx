"use client";

import React from "react";
import styles from "./Skeleton.module.css";

export type SkeletonVariant = "text" | "circular" | "rectangular";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: SkeletonVariant;
  width?: string | number;
  height?: string | number;
  className?: string;
  style?: React.CSSProperties;
}

export function Skeleton({
  variant = "rectangular",
  width,
  height,
  className = "",
  style,
  ...restProps
}: SkeletonProps) {
  const variantClass =
    variant === "circular"
      ? styles.circular
      : variant === "text"
      ? styles.text
      : styles.rectangular;

  const inlineStyles: React.CSSProperties = {
    ...style,
    ...(width !== undefined ? { width: typeof width === "number" ? `${width}px` : width } : {}),
    ...(height !== undefined ? { height: typeof height === "number" ? `${height}px` : height } : {}),
  };

  return (
    <div
      aria-hidden="true"
      className={`${styles.skeleton} ${variantClass} ${className}`.trim()}
      style={inlineStyles}
      {...restProps}
    />
  );
}

export interface SkeletonContainerProps {
  busy?: boolean;
  announcement?: string;
  children?: React.ReactNode;
  className?: string;
}

export function SkeletonContainer({
  busy = true,
  announcement = "Loading content...",
  children,
  className = "",
}: SkeletonContainerProps) {
  return (
    <div
      aria-busy={busy}
      className={`${styles.container} ${className}`.trim()}
    >
      {busy && announcement && (
        <div className={styles.srOnly} role="status" aria-live="polite">
          {announcement}
        </div>
      )}
      {children}
    </div>
  );
}
