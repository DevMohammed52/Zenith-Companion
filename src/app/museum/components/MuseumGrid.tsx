"use client";

import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { museumCategoryLabel } from "@/lib/museum";
import type { MuseumCategory, MuseumItem } from "../types";
import { formatNumber } from "../utils/museum-helpers";
import { MuseumItemCard } from "./MuseumItemCard";
import styles from "../page.module.css";

export function MuseumGrid({
  category,
  displayedItems,
  visibleItems,
  selectedQuantity,
  page,
  totalPages,
  pageSize,
  setPage,
  setPageSize,
  noMatchTitle,
  query,
  onResetFilters,
  onInspectCollectible,
}: {
  category: MuseumCategory | "ALL";
  displayedItems: MuseumItem[];
  visibleItems: MuseumItem[];
  selectedQuantity: number;
  page: number;
  totalPages: number;
  pageSize: number;
  setPage: (p: number) => void;
  setPageSize: (size: number) => void;
  noMatchTitle: string;
  query: string;
  onResetFilters: () => void;
  onInspectCollectible: (id: string, name: string) => void;
}) {
  return (
    <>
      <div className={styles.resultsBar}>
        <div className={styles.resultsStrip}>
          <span>{category === "ALL" ? "All categories" : museumCategoryLabel(category)}</span>
          <span>
            {formatNumber(visibleItems.length)} item{visibleItems.length === 1 ? "" : "s"}
          </span>
          <span>{formatNumber(selectedQuantity)} total collected</span>
        </div>
      </div>

      {visibleItems.length > 0 ? (
        <>
          <section className={styles.itemGrid} aria-label="Museum items">
            {displayedItems.map((item) => (
              <MuseumItemCard
                key={`${item.category}-${String(item.id)}-${item.name}`}
                item={item}
                onInspectCollectible={onInspectCollectible}
              />
            ))}
          </section>

          {totalPages > 1 && (
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={visibleItems.length}
              pageSize={pageSize}
              pageSizeOptions={[24, 48, 96]}
              showPageSize
              itemLabel="entries"
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          )}
        </>
      ) : (
        <section className={styles.emptyPanel}>
          <EmptyState
            icon="searchEmpty"
            title={query.trim() ? noMatchTitle : "No matching museum items"}
            description="Try a different search query or switch category filters."
            action={{
              label: "Reset Filters",
              onClick: onResetFilters,
            }}
          />
        </section>
      )}
    </>
  );
}
