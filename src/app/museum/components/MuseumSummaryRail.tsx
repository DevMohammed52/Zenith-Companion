import {
  CATEGORY_ICONS,
  type MuseumCategory,
  type MuseumCategorySummary,
} from "../types";
import { categoryTone, formatNumber } from "../utils/museum-helpers";
import styles from "../page.module.css";

export function MuseumSummaryRail({
  itemsCount,
  totalQuantity,
  expectedItemCount,
  summaries,
  category,
  onToggleCategory,
}: {
  itemsCount: number;
  totalQuantity: number;
  expectedItemCount: number;
  summaries: MuseumCategorySummary[];
  category: MuseumCategory | "ALL";
  onToggleCategory: (cat: MuseumCategory) => void;
}) {
  return (
    <section className={styles.museumSummary} aria-label="Museum summary">
      <div className={styles.museumSummaryMain}>
        <span>Total collected</span>
        <strong>{formatNumber(itemsCount)}</strong>
        <small>
          {formatNumber(totalQuantity)} total quantity
          {expectedItemCount ? ` / ${formatNumber(expectedItemCount)} expected` : ""}
        </small>
      </div>
      {summaries.map((summary) => {
        const Icon = CATEGORY_ICONS[summary.category];
        const isActive = category === summary.category;
        return (
          <button
            type="button"
            key={summary.category}
            className={`${styles.museumSummaryCard} ${isActive ? styles.active : ""}`}
            data-tone={categoryTone(summary.category)}
            data-active={isActive ? "true" : undefined}
            aria-pressed={isActive}
            onClick={() => onToggleCategory(summary.category)}
            aria-label={`Show ${summary.label} museum items`}
          >
            <Icon size={16} aria-hidden="true" />
            <span>{summary.label}</span>
            <strong>{formatNumber(summary.itemCount)}</strong>
            <small>{formatNumber(summary.totalQuantity)} qty</small>
          </button>
        );
      })}
    </section>
  );
}
