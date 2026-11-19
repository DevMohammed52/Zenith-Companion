"use client";

import { Search } from "lucide-react";
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
    | "searchActive"
    | "zoneStatus"
  >;
}) {
  const { filter, setFilter, searchTerm, setSearchTerm, searchActive, zoneStatus } = state;

  return (
    <>
      <section className={styles.toolbar} aria-label="Zone filters">
        <div className={styles.filterButtons}>
          {FILTERS.map((item) => (
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
        <label className={styles.searchBox}>
          <span>Search zones, guilds, players</span>
          <Search size={15} aria-hidden="true" />
          <input
            aria-label="Search conquest zones, guilds, and players"
            value={searchTerm}
            onChange={(event) => {
              setSearchTerm(event.target.value);
              if (event.target.value.trim()) setFilter("all");
            }}
            placeholder="Search conquest..."
          />
          {searchActive && (
            <button type="button" onClick={() => setSearchTerm("")}>
              Clear
            </button>
          )}
        </label>
        <p className={styles.filterHelp}>
          Dominated is the in-game zone status. Controlled means one guild holds 95%+ of zone XP.
        </p>
      </section>
      <p className="sr-only" role="status" aria-live="polite">
        {zoneStatus}
      </p>
    </>
  );
}
