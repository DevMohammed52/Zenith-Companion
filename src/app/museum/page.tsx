"use client";

import { useMuseumState } from "./hooks/useMuseumState";
import { MuseumHero } from "./components/MuseumHero";
import { MuseumControls } from "./components/MuseumControls";
import { MuseumImportStatus } from "./components/MuseumImportStatus";
import { MuseumSummaryRail } from "./components/MuseumSummaryRail";
import { MuseumGrid } from "./components/MuseumGrid";
import {
  MuseumLoading,
  MuseumEmptySnapshot,
} from "./components/MuseumLoadingOrEmpty";
import { formatNumber } from "./utils/museum-helpers";
import styles from "./page.module.css";

export default function MuseumPage() {
  const state = useMuseumState();

  return (
    <main className={`container ${styles.museumPage}`} aria-labelledby="museum-page-title">
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {state.hasMuseum
          ? `${formatNumber(state.visibleItems.length)} museum items match the current filters. ${formatNumber(state.displayedItems.length)} are rendered.`
          : state.emptyState.title}
      </div>

      <MuseumHero
        activeProfile={state.activeProfile}
        summaries={state.summaries}
      />

      {!state.loaded ? (
        <MuseumLoading />
      ) : !state.hasMuseum ? (
        <MuseumEmptySnapshot
          EmptyIcon={state.EmptyIcon}
          title={state.emptyState.title}
          body={state.emptyState.body}
        />
      ) : (
        <>
          <MuseumControls
            query={state.query}
            setQuery={state.setQuery}
            category={state.category}
            setCategory={state.setCategory}
            sortKey={state.sortKey}
            setSortKey={state.setSortKey}
            sortDirection={state.sortDirection}
            setSortDirection={state.setSortDirection}
            itemsCount={state.items.length}
            visibleItemsCount={state.visibleItems.length}
            displayedItemsCount={state.displayedItems.length}
            selectedQuantity={state.selectedQuantity}
            summaryByCategory={state.summaryByCategory}
            activeControlCount={state.activeControlCount}
            hasActiveFilters={state.hasActiveFilters}
            hasCustomSort={state.hasCustomSort}
            resetControls={state.resetControls}
          />

          <MuseumImportStatus
            museum={state.museum}
            sourceTail={state.sourceTail}
            coverageText={state.coverageText}
            itemsCount={state.items.length}
            expectedItemCount={state.expectedItemCount}
            hasCountMismatch={state.hasCountMismatch}
            readableWarnings={state.readableWarnings}
            uniqueWarnings={state.uniqueWarnings}
          />

          <MuseumSummaryRail
            itemsCount={state.items.length}
            totalQuantity={state.totalQuantity}
            expectedItemCount={state.expectedItemCount}
            summaries={state.summaries}
            category={state.category}
            onToggleCategory={(cat) =>
              state.setCategory((current) => (current === cat ? "ALL" : cat))
            }
          />

          <MuseumGrid
            category={state.category}
            displayedItems={state.displayedItems}
            visibleItems={state.visibleItems}
            activeSummary={state.activeSummary}
            hasMoreItems={state.hasMoreItems}
            showMore={state.showMore}
            noMatchTitle={state.noMatchTitle}
            query={state.query}
          />
        </>
      )}
    </main>
  );
}
