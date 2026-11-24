import React from "react";
import styles from "./Breadcrumbs.module.css";

export interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  separator?: React.ReactNode;
  className?: string;
  "aria-label"?: string;
}

export function Breadcrumbs({
  items,
  separator = "/",
  className,
  "aria-label": ariaLabel = "Breadcrumb",
}: BreadcrumbsProps) {
  if (!items || items.length === 0) return null;

  return (
    <nav
      aria-label={ariaLabel}
      className={`${styles.nav} ${className || ""}`.trim()}
    >
      <ol className={styles.list}>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={index} className={styles.item}>
              {isLast ? (
                <span
                  aria-current="page"
                  className={styles.current}
                  title={item.label}
                >
                  {item.label}
                </span>
              ) : (
                <>
                  <a
                    href={item.href || "#"}
                    onClick={item.onClick}
                    className={styles.link}
                  >
                    {item.label}
                  </a>
                  <span aria-hidden="true" className={styles.separator}>
                    {separator}
                  </span>
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
