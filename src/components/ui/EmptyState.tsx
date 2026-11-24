import React, { forwardRef } from "react";
import { Icon, type IconProps } from "./Icon";
import { Button, type ButtonProps, type ButtonVariant, type ButtonSize } from "./Button";
import { type IconConcept } from "@/lib/icons";
import styles from "./EmptyState.module.css";

export type EmptyStateVariant =
  | "default"
  | "no-data"
  | "search-empty"
  | "error"
  | "offline";

export type EmptyStateSize = "sm" | "md" | "lg";

export interface EmptyStateActionConfig {
  label: string;
  onClick?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  icon?: IconConcept;
}

export interface EmptyStateSecondaryActionConfig {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
}

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Operational category of the empty state.
   * Dictates default icons, borders, colors, and accessibility live regions.
   * @default "default"
   */
  variant?: EmptyStateVariant;

  /**
   * Density and padding scale.
   * @default "md"
   */
  size?: EmptyStateSize;

  /**
   * Icon concept name or custom React node.
   * When omitted, automatically derives an appropriate icon from the variant.
   * Set to `null` to suppress the icon.
   */
  icon?: IconConcept | React.ReactNode | null;

  /**
   * Primary title summarizing the condition.
   */
  title: string;

  /**
   * Explanatory copy describing the cause and suggested remedy.
   */
  description?: React.ReactNode;

  /**
   * Echoed search string for search-empty states to highlight typos.
   */
  query?: string;

  /**
   * Single primary call-to-action button.
   * Can be an action configuration object or a custom React element.
   */
  action?: EmptyStateActionConfig | React.ReactNode;

  /**
   * Optional secondary action (rendered as an accessible text link).
   */
  secondaryAction?: EmptyStateSecondaryActionConfig | React.ReactNode;

  /**
   * Semantic HTML heading tag to preserve document heading hierarchy.
   * @default "h3"
   */
  headingLevel?: "h2" | "h3" | "h4" | "h5" | "h6";

  /**
   * ARIA role for assistive technologies (WCAG 2.2 SC 4.1.3).
   * @default "status" (or "alert" for error variant)
   */
  role?: string;

  /**
   * ARIA live region announcement policy.
   * @default "polite" (or "assertive" for error variant)
   */
  ariaLive?: "polite" | "assertive" | "off";

  /**
   * Optional additional content rendered beneath the actions.
   */
  children?: React.ReactNode;
}

const DEFAULT_VARIANT_ICONS: Record<EmptyStateVariant, IconConcept> = {
  default: "emptyInbox",
  "no-data": "emptyInbox",
  "search-empty": "searchEmpty",
  error: "error",
  offline: "offline",
};

const VARIANT_CONTAINER_CLASS: Record<EmptyStateVariant, string> = {
  default: styles.variantDefault,
  "no-data": styles.variantNoData,
  "search-empty": styles.variantSearchEmpty,
  error: styles.variantError,
  offline: styles.variantOffline,
};

const VARIANT_ICON_CLASS: Record<EmptyStateVariant, string> = {
  default: styles.iconDefault,
  "no-data": styles.iconNoData,
  "search-empty": styles.iconSearchEmpty,
  error: styles.iconError,
  offline: styles.iconOffline,
};

const SIZE_CONTAINER_CLASS: Record<EmptyStateSize, string> = {
  sm: styles.sizeSm,
  md: styles.sizeMd,
  lg: styles.sizeLg,
};

const SIZE_TITLE_CLASS: Record<EmptyStateSize, string> = {
  sm: styles.titleSm,
  md: styles.titleMd,
  lg: styles.titleLg,
};

const SIZE_DESCRIPTION_CLASS: Record<EmptyStateSize, string> = {
  sm: styles.descriptionSm,
  md: styles.descriptionMd,
  lg: styles.descriptionLg,
};

const SIZE_ICON_WRAPPER_CLASS: Record<EmptyStateSize, string> = {
  sm: styles.iconWrapperSm,
  md: styles.iconWrapperMd,
  lg: styles.iconWrapperLg,
};

const ICON_PIXEL_SIZES: Record<EmptyStateSize, number> = {
  sm: 18,
  md: 24,
  lg: 30,
};

export const EmptyState = forwardRef<HTMLDivElement, EmptyStateProps>(
  function EmptyState(
    {
      variant = "default",
      size = "md",
      icon,
      title,
      description,
      query,
      action,
      secondaryAction,
      headingLevel = "h3",
      role,
      ariaLive,
      className = "",
      children,
      ...props
    },
    ref
  ) {
    const isError = variant === "error";
    const resolvedRole = role ?? (isError ? "alert" : "status");
    const resolvedAriaLive = ariaLive ?? (isError ? "assertive" : "polite");

    // Resolve icon rendering
    let resolvedIcon: React.ReactNode = null;
    if (icon === null) {
      resolvedIcon = null;
    } else if (icon !== undefined && typeof icon !== "string") {
      resolvedIcon = icon;
    } else {
      const conceptName: IconConcept = (icon as IconConcept) ?? DEFAULT_VARIANT_ICONS[variant];
      resolvedIcon = (
        <Icon
          name={conceptName}
          size={ICON_PIXEL_SIZES[size]}
          aria-hidden="true"
        />
      );
    }

    // Resolve description copy when query is provided in search-empty variant
    let resolvedDescription = description;
    if (!resolvedDescription && query && variant === "search-empty") {
      resolvedDescription = (
        <>
          No records match <span className={styles.queryBadge}>"{query}"</span>. Check spelling or clear active filters.
        </>
      );
    }

    // Resolve Heading Element
    const HeadingTag = headingLevel;

    // Resolve Primary Action
    let primaryActionElement: React.ReactNode = null;
    if (React.isValidElement(action)) {
      primaryActionElement = action;
    } else if (action && typeof action === "object" && "label" in action) {
      const actionConfig = action as EmptyStateActionConfig;
      primaryActionElement = (
        <Button
          variant={actionConfig.variant ?? (isError ? "danger" : "primary")}
          size={actionConfig.size ?? (size === "sm" ? "sm" : "md")}
          onClick={actionConfig.onClick}
          disabled={actionConfig.disabled}
        >
          {actionConfig.icon && (
            <Icon name={actionConfig.icon} size="sm" aria-hidden="true" />
          )}
          {actionConfig.label}
        </Button>
      );
    }

    // Resolve Secondary Action
    let secondaryActionElement: React.ReactNode = null;
    if (React.isValidElement(secondaryAction)) {
      secondaryActionElement = secondaryAction;
    } else if (
      secondaryAction &&
      typeof secondaryAction === "object" &&
      "label" in secondaryAction
    ) {
      const secConfig = secondaryAction as EmptyStateSecondaryActionConfig;
      secondaryActionElement = (
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={secConfig.onClick}
          disabled={secConfig.disabled}
        >
          {secConfig.label}
        </button>
      );
    }

    const hasActions = primaryActionElement !== null || secondaryActionElement !== null;

    const containerClasses = [
      styles.container,
      SIZE_CONTAINER_CLASS[size],
      VARIANT_CONTAINER_CLASS[variant],
      className,
    ]
      .filter(Boolean)
      .join(" ");

    const iconWrapperClasses = [
      styles.iconWrapper,
      SIZE_ICON_WRAPPER_CLASS[size],
      VARIANT_ICON_CLASS[variant],
    ].join(" ");

    return (
      <div
        ref={ref}
        role={resolvedRole}
        aria-live={resolvedAriaLive}
        className={containerClasses}
        {...props}
      >
        {resolvedIcon && (
          <div className={iconWrapperClasses} aria-hidden="true">
            {resolvedIcon}
          </div>
        )}

        <div className={styles.content}>
          <HeadingTag
            className={`${styles.title} ${SIZE_TITLE_CLASS[size]}`.trim()}
          >
            {title}
          </HeadingTag>

          {resolvedDescription && (
            <p
              className={`${styles.description} ${SIZE_DESCRIPTION_CLASS[size]}`.trim()}
            >
              {resolvedDescription}
            </p>
          )}

          {hasActions && (
            <div className={styles.actions}>
              {primaryActionElement}
              {secondaryActionElement}
            </div>
          )}

          {children && <div className={styles.extraSlot}>{children}</div>}
        </div>
      </div>
    );
  }
);
