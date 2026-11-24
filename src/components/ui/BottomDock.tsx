"use client";

import React, { useRef } from "react";
import Link from "next/link";
import styles from "./BottomDock.module.css";

export interface BottomDockItem {
  id: string;
  label: string;
  href?: string;
  icon: React.ReactNode;
  isActive?: boolean;
  badge?: number | string;
  hasDot?: boolean;
  onClick?: () => void;
  "aria-label"?: string;
}

export interface BottomDockProps {
  items: BottomDockItem[];
  className?: string;
  ariaLabel?: string;
  hideOnDesktop?: boolean;
}

export function BottomDock({
  items,
  className = "",
  ariaLabel = "Mobile navigation",
  hideOnDesktop = false,
}: BottomDockProps) {
  const listRef = useRef<HTMLUListElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLUListElement>) => {
    if (!listRef.current) return;
    const focusable = Array.from(
      listRef.current.querySelectorAll<HTMLElement>("a, button")
    );
    const currentIndex = focusable.indexOf(document.activeElement as HTMLElement);

    if (e.key === "ArrowRight") {
      e.preventDefault();
      const nextIndex = (currentIndex + 1) % focusable.length;
      focusable[nextIndex]?.focus();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      const prevIndex = (currentIndex - 1 + focusable.length) % focusable.length;
      focusable[prevIndex]?.focus();
    } else if (e.key === "Home") {
      e.preventDefault();
      focusable[0]?.focus();
    } else if (e.key === "End") {
      e.preventDefault();
      focusable[focusable.length - 1]?.focus();
    }
  };

  const desktopClass = hideOnDesktop ? styles.mobileOnly : "";

  return (
    <nav
      className={`${styles.dock} ${desktopClass} ${className}`.trim()}
      aria-label={ariaLabel}
    >
      <ul ref={listRef} className={styles.list} onKeyDown={handleKeyDown}>
        {items.map((item) => {
          const content = (
            <>
              <span className={styles.iconWrapper}>
                <span className={styles.icon}>{item.icon}</span>
                {item.badge !== undefined && item.badge !== null && item.badge !== 0 ? (
                  <span
                    className={styles.badge}
                    aria-label={`${item.badge} notifications`}
                  >
                    {typeof item.badge === "number" && item.badge > 99
                      ? "99+"
                      : item.badge}
                  </span>
                ) : item.hasDot ? (
                  <span className={styles.badgeDot} aria-hidden="true" />
                ) : null}
              </span>
              <span className={styles.label}>{item.label}</span>
            </>
          );

          const itemClass = `${styles.link} ${item.isActive ? styles.active : ""}`.trim();

          return (
            <li key={item.id} className={styles.item}>
              {item.href ? (
                <Link
                  id={item.id}
                  href={item.href}
                  className={itemClass}
                  aria-current={item.isActive ? "page" : undefined}
                  aria-label={item["aria-label"] || item.label}
                  onClick={item.onClick}
                >
                  {content}
                </Link>
              ) : (
                <button
                  id={item.id}
                  type="button"
                  className={itemClass}
                  aria-pressed={item.isActive}
                  aria-current={item.isActive ? "page" : undefined}
                  aria-label={item["aria-label"] || item.label}
                  onClick={item.onClick}
                >
                  {content}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
