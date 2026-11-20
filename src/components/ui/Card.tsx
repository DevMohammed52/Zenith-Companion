import React, { forwardRef } from "react";
import styles from "./Card.module.css";

export type CardPadding = "none" | "sm" | "md" | "lg";
export type CardVariant = "default" | "sunken" | "elevated" | "interactive";
export type CardAccent =
  | "refined"
  | "epic"
  | "legendary"
  | "mythic"
  | "unique"
  | "danger"
  | "success"
  | "warning";

export interface CardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  footer?: React.ReactNode;
  padding?: CardPadding;
  variant?: CardVariant;
  accent?: CardAccent;
  interactive?: boolean;
  children?: React.ReactNode;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  {
    title,
    subtitle,
    action,
    footer,
    padding = "md",
    variant = "default",
    accent,
    interactive = false,
    className = "",
    children,
    onClick,
    onKeyDown,
    tabIndex,
    role,
    ...props
  },
  ref
) {
  const isClickable = interactive || Boolean(onClick);

  const paddingClass =
    padding === "none"
      ? styles.paddingNone
      : padding === "sm"
      ? styles.paddingSm
      : padding === "lg"
      ? styles.paddingLg
      : styles.paddingMd;

  const cardClasses = [
    styles.card,
    paddingClass,
    styles[variant],
    accent ? styles[`accent_${accent}`] : "",
    isClickable ? styles.interactive : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (isClickable && onClick && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      onClick(e as unknown as React.MouseEvent<HTMLDivElement>);
    }
    onKeyDown?.(e);
  };

  const hasHeader = Boolean(title || subtitle || action);

  return (
    <div
      ref={ref}
      className={cardClasses}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      tabIndex={isClickable ? tabIndex ?? 0 : tabIndex}
      role={isClickable ? role ?? "button" : role}
      {...props}
    >
      {hasHeader && (
        <div className={styles.header}>
          <div className={styles.titleArea}>
            {title && (
              typeof title === "string" ? (
                <h3 className={styles.title}>{title}</h3>
              ) : (
                <div className={styles.title}>{title}</div>
              )
            )}
            {subtitle && (
              typeof subtitle === "string" ? (
                <p className={styles.subtitle}>{subtitle}</p>
              ) : (
                <div className={styles.subtitle}>{subtitle}</div>
              )
            )}
          </div>
          {action && <div className={styles.action}>{action}</div>}
        </div>
      )}

      <div className={styles.body}>{children}</div>

      {footer && <div className={styles.footer}>{footer}</div>}
    </div>
  );
});

Card.displayName = "Card";
