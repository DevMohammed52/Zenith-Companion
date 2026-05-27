"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { AlertTriangle, Inbox, Loader2, SearchX, WifiOff } from "lucide-react";
import styles from "./StateBlock.module.css";

type StateBlockVariant = "loading" | "empty" | "error" | "no-results" | "stale";

type StateBlockProps = {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  icon?: LucideIcon;
  variant?: StateBlockVariant;
  compact?: boolean;
  className?: string;
};

const DEFAULT_ICONS: Record<StateBlockVariant, LucideIcon> = {
  loading: Loader2,
  empty: Inbox,
  error: AlertTriangle,
  "no-results": SearchX,
  stale: WifiOff,
};

export default function StateBlock({
  title,
  description,
  action,
  icon,
  variant = "empty",
  compact = false,
  className = "",
}: StateBlockProps) {
  const Icon = icon || DEFAULT_ICONS[variant];
  const role = variant === "error" ? "alert" : "status";

  return (
    <section
      className={`${styles.block} ${styles[variant] || ""} ${compact ? styles.compact : ""} ${className}`}
      role={role}
      aria-live={variant === "loading" || variant === "error" ? "polite" : undefined}
      aria-busy={variant === "loading" ? true : undefined}
    >
      <span className={styles.iconShell} aria-hidden="true">
        <Icon className={variant === "loading" ? styles.spin : undefined} size={compact ? 18 : 22} />
      </span>
      <span className={styles.copy}>
        <strong>{title}</strong>
        {description ? <span>{description}</span> : null}
      </span>
      {action ? <span className={styles.action}>{action}</span> : null}
    </section>
  );
}

export function LoadingState(props: Omit<StateBlockProps, "variant">) {
  return <StateBlock {...props} variant="loading" />;
}

export function EmptyState(props: Omit<StateBlockProps, "variant">) {
  return <StateBlock {...props} variant="empty" />;
}

export function ErrorState(props: Omit<StateBlockProps, "variant">) {
  return <StateBlock {...props} variant="error" />;
}

export function NoResultsState(props: Omit<StateBlockProps, "variant">) {
  return <StateBlock {...props} variant="no-results" />;
}

export function StaleDataNotice(props: Omit<StateBlockProps, "variant">) {
  return <StateBlock {...props} variant="stale" />;
}
