import React from "react";
import styles from "./Badge.module.css";

export type BadgeVariant =
  | "neutral"
  | "standard"
  | "refined"
  | "premium"
  | "epic"
  | "legendary"
  | "mythic"
  | "unique"
  | "success"
  | "warning"
  | "danger";

export type BadgeSize = "sm" | "md";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  gradient?: boolean;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

export function Badge({
  variant = "neutral",
  size = "md",
  gradient,
  icon,
  className = "",
  children,
  ...props
}: BadgeProps) {
  const badgeClasses = [
    styles.badge,
    styles[variant],
    styles[size],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const useGradient = gradient ?? (variant === "mythic" || variant === "unique");
  const labelClass =
    useGradient && variant === "mythic"
      ? styles.mythicGradient
      : useGradient && variant === "unique"
      ? styles.uniqueGradient
      : undefined;

  return (
    <span className={badgeClasses} {...props}>
      {icon && <span className={styles.icon}>{icon}</span>}
      <span className={labelClass}>{children}</span>
    </span>
  );
}
