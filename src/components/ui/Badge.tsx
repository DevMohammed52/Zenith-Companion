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
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

export function Badge({
  variant = "neutral",
  size = "md",
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

  return (
    <span className={badgeClasses} {...props}>
      {icon && <span className={styles.icon}>{icon}</span>}
      <span>{children}</span>
    </span>
  );
}
