"use client";

import { useEffect, useRef, type RefObject } from "react";

type ModalA11yOptions = {
  initialFocusRef?: RefObject<HTMLElement | null>;
  restoreFocus?: boolean;
};

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "summary",
  "[contenteditable='true']",
  "[role='button']",
  "[role='link']",
  "[role='tab']",
  "[role='option']",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

function isVisibleFocusable(element: HTMLElement) {
  return (
    !element.hasAttribute("disabled")
    && element.getAttribute("aria-hidden") !== "true"
    && (element.tabIndex >= 0 || element === document.activeElement)
    && (element.offsetParent !== null || element.getClientRects().length > 0 || element === document.activeElement)
  );
}

export function useModalA11y<T extends HTMLElement>(
  isOpen: boolean,
  onClose: () => void,
  options: ModalA11yOptions = {},
) {
  const dialogRef = useRef<T | null>(null);
  const onCloseRef = useRef(onClose);
  const { initialFocusRef, restoreFocus = true } = options;

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const previouslyFocused = document.activeElement instanceof HTMLElement && document.activeElement !== document.body
      ? document.activeElement
      : null;
    const focusTimer = window.setTimeout(() => {
      const dialog = dialogRef.current;
      const initialFocus = initialFocusRef?.current;
      if (initialFocus && dialog?.contains(initialFocus) && isVisibleFocusable(initialFocus)) {
        initialFocus.focus({ preventScroll: true });
        return;
      }
      dialog?.focus({ preventScroll: true });
    }, 0);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;

      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }

      if (event.key !== "Tab") return;

      const dialog = dialogRef.current;
      if (!dialog) return;

      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
        .filter(isVisibleFocusable);

      if (focusable.length === 0) {
        event.preventDefault();
        dialog.focus({ preventScroll: true });
        return;
      }

      const activeElement = document.activeElement;
      const activeIndex = activeElement instanceof HTMLElement ? focusable.indexOf(activeElement) : -1;
      const nextIndex = event.shiftKey
        ? activeIndex <= 0 ? focusable.length - 1 : activeIndex - 1
        : activeIndex === -1 || activeIndex >= focusable.length - 1 ? 0 : activeIndex + 1;

      event.preventDefault();
      focusable[nextIndex]?.focus({ preventScroll: true });
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener("keydown", handleKeyDown);
      if (restoreFocus && previouslyFocused && document.contains(previouslyFocused)) {
        previouslyFocused.focus({ preventScroll: true });
      }
    };
  }, [initialFocusRef, isOpen, restoreFocus]);

  return dialogRef;
}
