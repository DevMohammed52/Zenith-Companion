import { Search } from "lucide-react";
import { museumCategoryLabel } from "@/lib/museum";
import type { MuseumCategory, MuseumItem } from "../types";
import { formatNumber } from "../utils/museum-helpers";
import { MuseumItemCard } from "./MuseumItemCard";
import styles from "../page.module.css";

export function MuseumGrid({
  category,
  displayedItems,
  visibleItems,
  activeSummary,
  hasMoreItems,
  showMore,
  noMatchTitle,
  query,
}: {
  category: MuseumCategory | "ALL";
  displayedItems: MuseumItem[];
  visibleItems: MuseumItem[];
  activeSummary: { itemCount: number; totalQuantity: number };
  hasMoreItems: boolean;
  showMore: () => void;
  noMatchTitle: string;
  query: string;
}) {
  return (
    <>
      <section className={styles.museumResultsHeader}>
        <div>
          <span>
            {category === "ALL" ? "All categories" : museumCategoryLabel(category)}
          </span>
          <strong>
            {formatNumber(displayedItems.length)} of {formatNumber(visibleItems.length)} shown
          </strong>
        </div>
        <div>
          <span>Selected total</span>
          <strong>
            {formatNumber(activeSummary.itemCount)} collected /{" "}
            {formatNumber(activeSummary.totalQuantity)} qty
          </strong>
        </div>
      </section>

      {visibleItems.length > 0 ? (
        <>
          <section className={styles.museumGrid} aria-label="Museum items">
            {displayedItems.map((item) => (
              <MuseumItemCard
                key={`${item.category}-${String(item.id)}-${item.name}`}
                item={item}
              />
            ))}
          </section>
          {hasMoreItems && (
            <div className={styles.museumMore}>
              <button
                type="button"
                onClick={showMore}
                aria-label={`Show more museum items, currently showing ${formatNumber(
                  displayedItems.length
                )} of ${formatNumber(visibleItems.length)}`}
              >
                Show{" "}
                {formatNumber(
                  Math.min(120, visibleItems.length - displayedItems.length)
                )}{" "}
                more
              </button>
            </div>
          )}
        </>
      ) : (
        <section className={`${styles.museumEmpty} ${styles.museumEmptyCompact}`} role="status">
          <Search size={24} aria-hidden="true" />
          <h2>{query.trim() ? noMatchTitle : "No matching museum items"}</h2>
          <p>Adjust the search text or category filter.</p>
        </section>
      )}
    </>
  );
}
