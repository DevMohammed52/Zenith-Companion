"use client";

import { useEffect, useState } from "react";
import { Icon } from "./Icon";
import styles from "./BackToTop.module.css";

export interface BackToTopProps {
  /** Scroll offset in pixels before the button appears. Defaults to 300. */
  threshold?: number;
  /** Accessible button label. Defaults to "Scroll back to top". */
  label?: string;
  /** Optional className appended to the floating button. */
  className?: string;
  /** Force the visible state regardless of scroll position (useful for static tests). */
  forceVisible?: boolean;
}

/**
 * Floating "Back to top" button for long scrollable views.
 * Fades and slides smoothly in/out, clears the mobile bottom dock,
 * and honors prefers-reduced-motion.
 */
export function BackToTop({
  threshold = 300,
  label = "Scroll back to top",
  className,
  forceVisible = false,
}: BackToTopProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > threshold);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);

  const isVisible = visible || forceVisible;

  const handleClick = () => {
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
    window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
  };

  const buttonClasses = [
    styles.button,
    isVisible ? styles.visible : "",
    className || "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type="button"
      className={buttonClasses}
      onClick={handleClick}
      aria-label={label}
      title="Back to top"
      aria-hidden={!isVisible}
      tabIndex={isVisible ? 0 : -1}
    >
      <Icon name="arrowUp" size="md" aria-hidden="true" />
    </button>
  );
}
