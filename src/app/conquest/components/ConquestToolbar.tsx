"use client";

import { SearchInput } from "@/components/ui/SearchInput";
import { FILTERS, type UseConquestStateReturn } from "../types";
import styles from "../page.module.css";

export default function ConquestToolbar({
  state,
}: {
  state: Pick<
    UseConquestStateReturn,
    | "filter"
    | "setFilter"
    | "searchTerm"
    | "setSearchTerm"
    | "zoneStatus"
    | "isHistoricalSeason"
  >;
}) {
  const { filter, setFilter, searchTerm, setSearchTerm, zoneStatus, isHistoricalSeason } = state;
  const visibleFilters = isHistoricalSeason
    ? FILTERS.filter((f) => f.key !== "active")
    : FILTERS;

  return (
    <>
      <section className={styles.toolbar} aria-label="Zone filters">
        <div className={styles.filterButtons} role="group" aria-label="Zone status filter">
          {visibleFilters.map((item) => (
            <button
              key={item.key}
              type="button"
              aria-pressed={filter === item.key}
              data-active={filter === item.key}
              onClick={() => setFilter(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <span className={styles.toolbarDivider} aria-hidden="true" />
        <div className={styles.searchWrap}>
          <SearchInput
            ariaLabel="Search conquest zones, guilds, and players"
            showShortcutHint={false}
            value={searchTerm}
            onChange={(value) => {
              setSearchTerm(value);
              if (value.trim()) setFilter("all");
            }}
            onClear={() => setSearchTerm("")}
            placeholder="Search zone, guild, player..."
          />
        </div>
      </section>
      <p className="sr-only" role="status" aria-live="polite">
        {zoneStatus}
      </p>
    </>
  );
}
