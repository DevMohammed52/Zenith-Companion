import React, { forwardRef } from "react";
import { Icon } from "./Icon";
import { type IconConcept } from "@/lib/icons";
import styles from "./Banner.module.css";

export type BannerVariant = "warning" | "error" | "announcement" | "info";

export interface BannerAction {
  label: string;
  onClick: () => void;
}

export interface BannerProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BannerVariant;
  icon?: IconConcept | React.ReactNode | null;
  children?: React.ReactNode;
  action?: BannerAction | React.ReactNode;
  onDismiss?: () => void;
  dismissible?: boolean;
}

const DEFAULT_BANNER_ICONS: Record<BannerVariant, IconConcept | null> = {
  warning: "warning",
  error: "error",
  announcement: "info",
  info: "info",
};

const VARIANT_CLASSES: Record<BannerVariant, string> = {
  warning: styles.variantWarning,
  error: styles.variantError,
  announcement: styles.variantAnnouncement,
  info: styles.variantInfo,
};

export const Banner = forwardRef<HTMLDivElement, BannerProps>(function Banner(
  {
    variant = "warning",
    icon,
    children,
    action,
    onDismiss,
    dismissible = Boolean(onDismiss),
    className = "",
    role,
    ...props
  },
  ref
) {
  const isError = variant === "error";
  const resolvedRole = role ?? (isError ? "alert" : "status");

  let resolvedIcon: React.ReactNode = null;
  if (icon === null) {
    resolvedIcon = null;
  } else if (icon !== undefined && typeof icon !== "string") {
    resolvedIcon = icon;
  } else {
    const concept = (icon as IconConcept) ?? DEFAULT_BANNER_ICONS[variant];
    if (concept) {
      resolvedIcon = <Icon name={concept} size="sm" aria-hidden="true" />;
    }
  }

  return (
    <div
      ref={ref}
      role={resolvedRole}
      className={`${styles.banner} ${VARIANT_CLASSES[variant]} ${className}`.trim()}
      {...props}
    >
      <div className={styles.leftSection}>
        {resolvedIcon ? <span className={styles.iconBadge}>{resolvedIcon}</span> : null}
        <div className={styles.message}>{children}</div>
      </div>

      <div className={styles.actionRow}>
        {React.isValidElement(action) ? (
          action
        ) : action && typeof action === "object" && "label" in action ? (
          <button
            type="button"
            className={styles.actionButton}
            onClick={(action as BannerAction).onClick}
          >
            {(action as BannerAction).label}
          </button>
        ) : null}

        {dismissible ? (
          <button
            type="button"
            className={styles.closeButton}
            onClick={onDismiss}
            aria-label="Dismiss banner"
          >
            <Icon name="close" size="xs" aria-hidden="true" />
          </button>
        ) : null}
      </div>
    </div>
  );
});
