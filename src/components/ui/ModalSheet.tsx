"use client";

import React, { useEffect, useRef, useId, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./ModalSheet.module.css";

export type ModalSheetMaxWidth = "sm" | "md" | "lg" | "xl";

export interface ModalSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: ModalSheetMaxWidth;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  className?: string;
}

export function ModalSheet({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = "md",
  closeOnBackdrop = true,
  closeOnEscape = true,
  className = "",
}: ModalSheetProps) {
  const [mounted, setMounted] = useState(false);
  const [isRendering, setIsRendering] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setIsRendering(true);
      setIsClosing(false);
    } else if (isRendering) {
      setIsClosing(true);
      const timer = setTimeout(() => {
        setIsRendering(false);
        setIsClosing(false);
      }, 140);
      return () => clearTimeout(timer);
    }
  }, [isOpen, isRendering]);

  // Handle focus trapping, restoration, Escape key, and body scroll lock
  useEffect(() => {
    if (!isOpen) return;

    // Save previous active element to restore focus when closing
    if (document.activeElement instanceof HTMLElement) {
      previousActiveElement.current = document.activeElement;
    }

    // Lock body scroll
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Focus the sheet or first interactive element inside it
    const timer = setTimeout(() => {
      const focusable = sheetRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable && focusable.length > 0) {
        focusable[0]?.focus();
      } else {
        sheetRef.current?.focus();
      }
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && closeOnEscape) {
        e.preventDefault();
        onCloseRef.current();
        return;
      }

      if (e.key === "Tab" && sheetRef.current) {
        const focusable = Array.from(
          sheetRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        );

        if (focusable.length === 0) {
          e.preventDefault();
          return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last?.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first?.focus();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
      // Restore focus
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [isOpen, closeOnEscape]);

  if (!mounted || !isRendering) {
    return null;
  }

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !isClosing && closeOnBackdrop) {
      onClose();
    }
  };

  const sheetClasses = [
    styles.sheet,
    styles[maxWidth],
    isClosing ? styles.sheetClosing : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const overlayClasses = [
    styles.overlay,
    isClosing ? styles.overlayClosing : "",
  ]
    .filter(Boolean)
    .join(" ");

  const modalContent = (
    <div
      className={overlayClasses}
      onClick={handleBackdropClick}
      role="presentation"
    >
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={sheetClasses}
      >
        <div className={styles.mobileHandle} aria-hidden="true" />

        <div className={styles.header}>
          <div className={styles.headerText}>
            <h2 id={titleId} className={styles.title}>
              {title}
            </h2>
            {description && (
              <p id={descriptionId} className={styles.description}>
                {description}
              </p>
            )}
          </div>

          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close dialog"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className={styles.body}>{children}</div>

        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
