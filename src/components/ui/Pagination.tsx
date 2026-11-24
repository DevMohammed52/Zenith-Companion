"use client";

import React, { useId } from "react";
import styles from "./Pagination.module.css";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  pageSize?: number;
  pageSizeOptions?: number[];
  onPageSizeChange?: (size: number) => void;
  itemLabel?: string;
  showPageSize?: boolean;
  showSummary?: boolean;
  scrollToTop?: boolean;
  className?: string;
}

export function getPaginationItems(current: number, total: number): (number | "ellipsis-start" | "ellipsis-end")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  // Near start: 1, 2, 3, 4, 5, ..., total
  if (current <= 4) {
    return [1, 2, 3, 4, 5, "ellipsis-end", total];
  }

  // Near end: 1, ..., total-4, total-3, total-2, total-1, total
  if (current >= total - 3) {
    return [1, "ellipsis-start", total - 4, total - 3, total - 2, total - 1, total];
  }

  // Middle: 1, ..., current-1, current, current+1, ..., total
  return [1, "ellipsis-start", current - 1, current, current + 1, "ellipsis-end", total];
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  pageSize = 50,
  pageSizeOptions = [25, 50, 100],
  onPageSizeChange,
  itemLabel = "items",
  showPageSize = false,
  showSummary = true,
  scrollToTop = true,
  className = "",
}: PaginationProps) {
  const sizeSelectId = useId();

  if (totalItems === 0 || totalPages <= 0) return null;

  const safeCurrent = Math.max(1, Math.min(currentPage, Math.max(1, totalPages)));
  const items = getPaginationItems(safeCurrent, totalPages);

  const startItem = totalItems ? Math.min((safeCurrent - 1) * pageSize + 1, totalItems) : 0;
  const endItem = totalItems ? Math.min(safeCurrent * pageSize, totalItems) : 0;

  const handlePageSelect = (page: number) => {
    if (page === safeCurrent || page < 1 || page > totalPages) return;
    onPageChange(page);
    if (scrollToTop && typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrev = () => {
    if (safeCurrent > 1) {
      handlePageSelect(safeCurrent - 1);
    }
  };

  const handleNext = () => {
    if (safeCurrent < totalPages) {
      handlePageSelect(safeCurrent + 1);
    }
  };

  return (
    <nav aria-label="Pagination" className={`${styles.pagination} ${className}`.trim()}>
      {showSummary && totalItems !== undefined && (
        <div aria-live="polite" aria-atomic="true" className={styles.summary}>
          <span>
            Showing <span className={styles.tabular}>{startItem}&ndash;{endItem}</span> of{" "}
            <span className={styles.tabular}>{totalItems.toLocaleString()}</span> {itemLabel}
          </span>
          {showPageSize && onPageSizeChange && (
            <div className={styles.sizeSelector}>
              <label htmlFor={sizeSelectId}>Per page:</label>
              <select
                id={sizeSelectId}
                value={pageSize}
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                className={styles.sizeSelect}
              >
                {pageSizeOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      <div className={styles.controls}>
        <button
          type="button"
          onClick={handlePrev}
          disabled={safeCurrent <= 1}
          aria-label="Previous page"
          className={styles.button}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
          <span style={{ marginLeft: "4px" }}>Prev</span>
        </button>

        <div className={styles.mobileStatus}>
          Page <span className={styles.tabular} style={{ margin: "0 4px" }}>{safeCurrent}</span> of{" "}
          <span className={styles.tabular} style={{ margin: "0 4px" }}>{totalPages}</span>
        </div>

        <ol className={styles.pageList}>
          {items.map((item, idx) => {
            if (typeof item === "string") {
              return (
                <li key={`${item}-${idx}`} className={styles.ellipsis} aria-hidden="true">
                  &hellip;
                </li>
              );
            }

            const isCurrent = item === safeCurrent;

            return (
              <li key={item}>
                <button
                  type="button"
                  onClick={() => handlePageSelect(item)}
                  aria-current={isCurrent ? "page" : undefined}
                  aria-label={`Page ${item}`}
                  className={`${styles.pageButton} ${isCurrent ? styles.isCurrent : ""}`}
                >
                  {item}
                </button>
              </li>
            );
          })}
        </ol>

        <button
          type="button"
          onClick={handleNext}
          disabled={safeCurrent >= totalPages}
          aria-label="Next page"
          className={styles.button}
        >
          <span style={{ marginRight: "4px" }}>Next</span>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>
      </div>
    </nav>
  );
}
