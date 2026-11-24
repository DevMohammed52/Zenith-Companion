"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Icon } from "./Icon";
import { type IconConcept } from "@/lib/icons";
import { ZENITH_NOTIFY_EVENT, type ZenithNotification } from "@/lib/notifications";
import styles from "./Toast.module.css";

export type ToastVariant = "default" | "success" | "info" | "warning" | "error";

export interface ToastAction {
  label: string;
  onClick: () => void;
  icon?: IconConcept;
}

export interface ToastOptions {
  title: string;
  description?: React.ReactNode;
  variant?: ToastVariant;
  /**
   * Duration in milliseconds before auto-dismissing.
   * Defaults to word-count-scaled timing (2,800ms - 10,000ms).
   * Set to 0 or Infinity for persistent toasts.
   * Error toasts default to persistent (0).
   */
  duration?: number;
  action?: ToastAction;
}

export interface ToastData extends ToastOptions {
  id: string;
  repeatCount?: number;
}

export interface ToastContextValue {
  toast: ((options: ToastOptions | string) => string) & {
    success: (title: string, options?: Omit<ToastOptions, "title" | "variant">) => string;
    error: (title: string, options?: Omit<ToastOptions, "title" | "variant">) => string;
    info: (title: string, options?: Omit<ToastOptions, "title" | "variant">) => string;
    warning: (title: string, options?: Omit<ToastOptions, "title" | "variant">) => string;
    dismiss: (id: string) => void;
    dismissAll: () => void;
  };
  dismiss: (id: string) => void;
  dismissAll: () => void;
  toasts: ToastData[];
}

const ToastContext = createContext<ToastContextValue | null>(null);

const MAX_VISIBLE_TOASTS = 3;

/**
 * Calculates adaptive duration based on word count per WCAG 2.2 SC 2.2.1.
 */
export function calculateAdaptiveDuration(
  title: string,
  description?: React.ReactNode,
  hasAction = false,
  variant: ToastVariant = "default"
): number {
  if (variant === "error") {
    // Errors must never auto-dismiss per NN/g and WCAG standards
    return 0;
  }

  const descText = typeof description === "string" ? description : "";
  const words = `${title} ${descText}`.trim().split(/\s+/).filter(Boolean).length;
  // Baseline: 2,000ms base + 280ms per word, bounded between 2,800ms and 7,500ms
  let duration = Math.max(2800, Math.min(7500, 2000 + words * 280));

  if (hasAction) {
    // Actions require deliberate consideration and hit-target reach
    duration = Math.max(duration, 8000);
  }

  return duration;
}

const VARIANT_ICONS: Record<ToastVariant, IconConcept> = {
  default: "info",
  success: "check",
  info: "info",
  warning: "warning",
  error: "error",
};

const VARIANT_CLASSES: Record<ToastVariant, string> = {
  default: styles.variantDefault,
  success: styles.variantSuccess,
  info: styles.variantInfo,
  warning: styles.variantWarning,
  error: styles.variantError,
};

const ICON_CLASSES: Record<ToastVariant, string> = {
  default: styles.iconDefault,
  success: styles.iconSuccess,
  info: styles.iconInfo,
  warning: styles.iconWarning,
  error: styles.iconError,
};

export interface ToastItemProps {
  toast: ToastData;
  onDismiss: (id: string) => void;
}

export function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const { id, title, description, variant = "default", duration, action, repeatCount } = toast;

  const resolvedDuration =
    duration !== undefined
      ? duration
      : calculateAdaptiveDuration(title, description, Boolean(action), variant);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const remainingTimeRef = useRef<number>(resolvedDuration);
  const startTimeRef = useRef<number>(Date.now());
  const isPausedRef = useRef<boolean>(false);

  const startTimer = useCallback(() => {
    if (resolvedDuration <= 0) return;
    if (timerRef.current) clearTimeout(timerRef.current);

    startTimeRef.current = Date.now();
    timerRef.current = setTimeout(() => {
      onDismiss(id);
    }, remainingTimeRef.current);
  }, [id, onDismiss, resolvedDuration]);

  const pauseTimer = useCallback(() => {
    if (resolvedDuration <= 0 || isPausedRef.current) return;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    const elapsed = Date.now() - startTimeRef.current;
    remainingTimeRef.current = Math.max(0, remainingTimeRef.current - elapsed);
    isPausedRef.current = true;
  }, [resolvedDuration]);

  const resumeTimer = useCallback(() => {
    if (resolvedDuration <= 0 || !isPausedRef.current) return;
    isPausedRef.current = false;
    startTimer();
  }, [resolvedDuration, startTimer]);

  useEffect(() => {
    remainingTimeRef.current = resolvedDuration;
    startTimer();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [resolvedDuration, startTimer, repeatCount]);

  const isError = variant === "error";

  return (
    <div
      className={`${styles.toast} ${VARIANT_CLASSES[variant]}`.trim()}
      onMouseEnter={pauseTimer}
      onMouseLeave={resumeTimer}
      onFocus={pauseTimer}
      onBlur={resumeTimer}
      tabIndex={action ? 0 : undefined}
      data-testid={`toast-${id}`}
    >
      <div
        className={`${styles.iconWrapper} ${ICON_CLASSES[variant]}`.trim()}
        aria-hidden="true"
      >
        <Icon name={VARIANT_ICONS[variant]} size="sm" />
      </div>

      <div className={styles.content}>
        <div className={styles.headerRow}>
          <h4 className={styles.title}>{title}</h4>
          {repeatCount && repeatCount > 1 ? (
            <span
              className={styles.repeatBadge}
              aria-label={`Repeated ${repeatCount} times`}
            >
              +{repeatCount}
            </span>
          ) : null}
        </div>

        {description ? <p className={styles.description}>{description}</p> : null}

        {action ? (
          <div className={styles.actionRow}>
            <button
              type="button"
              className={styles.actionButton}
              onClick={() => {
                action.onClick();
                onDismiss(id);
              }}
            >
              {action.icon ? (
                <Icon name={action.icon} size="xs" aria-hidden="true" />
              ) : null}
              {action.label}
            </button>
          </div>
        ) : null}
      </div>

      <button
        type="button"
        className={styles.closeButton}
        onClick={() => onDismiss(id)}
        aria-label="Dismiss notification"
      >
        <Icon name="close" size="sm" aria-hidden="true" />
      </button>
    </div>
  );
}

export interface ToastViewportProps {
  toasts: ToastData[];
  onDismiss: (id: string) => void;
}

export function ToastViewport({ toasts, onDismiss }: ToastViewportProps) {
  // Pre-mounted accessibility regions (WCAG 2.2 SC 4.1.3 & Adrian Roselli standard)
  const regularToasts = toasts.filter((t) => t.variant !== "error");
  const errorToasts = toasts.filter((t) => t.variant === "error");

  return (
    <div
      className={styles.viewport}
      role="region"
      aria-label="Notifications"
    >
      {/* Polite live region for standard status updates */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {regularToasts.map((t) => (
          <p key={t.id}>{t.title} {typeof t.description === "string" ? t.description : ""}</p>
        ))}
      </div>

      {/* Assertive live region for critical system errors */}
      <div role="alert" aria-live="assertive" aria-atomic="true" className="sr-only">
        {errorToasts.map((t) => (
          <p key={t.id}>{t.title} {typeof t.description === "string" ? t.description : ""}</p>
        ))}
      </div>

      {/* Visible interactive toast stack */}
      {toasts.slice(0, MAX_VISIBLE_TOASTS).map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

export interface ToastProviderProps {
  children: React.ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    setToasts([]);
  }, []);

  const toastFn = useCallback(
    (options: ToastOptions | string): string => {
      const config: ToastOptions =
        typeof options === "string" ? { title: options } : options;

      const generatedId = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const targetTitle = config.title;
      const targetVariant = config.variant || "default";

      setToasts((prev) => {
        // Duplicate collapse logic: collapse identical consecutive triggers
        const existingIndex = prev.findIndex(
          (t) => t.title === targetTitle && (t.variant || "default") === targetVariant
        );

        if (existingIndex !== -1) {
          const updated = [...prev];
          const existing = updated[existingIndex];
          updated[existingIndex] = {
            ...existing,
            ...config,
            repeatCount: (existing.repeatCount || 1) + 1,
          };
          return updated;
        }

        const newToast: ToastData = {
          ...config,
          id: generatedId,
          variant: targetVariant,
          repeatCount: 1,
        };

        return [newToast, ...prev].slice(0, MAX_VISIBLE_TOASTS + 2);
      });

      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("zenith:toast", {
            detail: {
              id: generatedId,
              title: targetTitle,
              variant: targetVariant,
            },
          })
        );
      }

      return generatedId;
    },
    []
  );

  const success = useCallback(
    (title: string, options?: Omit<ToastOptions, "title" | "variant">) =>
      toastFn({ ...options, title, variant: "success" }),
    [toastFn]
  );

  const error = useCallback(
    (title: string, options?: Omit<ToastOptions, "title" | "variant">) =>
      toastFn({ ...options, title, variant: "error" }),
    [toastFn]
  );

  const info = useCallback(
    (title: string, options?: Omit<ToastOptions, "title" | "variant">) =>
      toastFn({ ...options, title, variant: "info" }),
    [toastFn]
  );

  const warning = useCallback(
    (title: string, options?: Omit<ToastOptions, "title" | "variant">) =>
      toastFn({ ...options, title, variant: "warning" }),
    [toastFn]
  );

  const toastCallable = Object.assign(toastFn, {
    success,
    error,
    info,
    warning,
    dismiss,
    dismissAll,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleLegacyNotification = (event: Event) => {
      const customEvent = event as CustomEvent<ZenithNotification>;
      const detail = customEvent.detail;
      if (!detail?.title) return;

      const variant: ToastVariant =
        detail.tone === "success"
          ? "success"
          : detail.tone === "warning"
          ? "warning"
          : detail.tone === "tip"
          ? "info"
          : "default";

      toastCallable({
        title: detail.title,
        description: detail.body,
        variant,
        action:
          detail.actionHref && detail.actionLabel
            ? {
                label: detail.actionLabel,
                onClick: () => {
                  if (detail.actionHref?.startsWith("http")) {
                    window.open(detail.actionHref, "_blank", "noopener,noreferrer");
                  } else if (detail.actionHref) {
                    window.location.href = detail.actionHref;
                  }
                },
              }
            : undefined,
      });
    };

    window.addEventListener(ZENITH_NOTIFY_EVENT, handleLegacyNotification);
    return () => window.removeEventListener(ZENITH_NOTIFY_EVENT, handleLegacyNotification);
  }, [toastCallable]);

  return (
    <ToastContext.Provider value={{ toast: toastCallable, dismiss, dismissAll, toasts }}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
