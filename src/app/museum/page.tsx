"use client";

import { useState } from "react";
import { BackToTop } from "@/components/ui/BackToTop";
import { useMuseumState } from "./hooks/useMuseumState";
import { MuseumHero } from "./components/MuseumHero";
import { MuseumControls } from "./components/MuseumControls";
import { MuseumImportStatus } from "./components/MuseumImportStatus";
import { MuseumGrid } from "./components/MuseumGrid";
import {
  MuseumLoading,
  MuseumEmptySnapshot,
} from "./components/MuseumLoadingOrEmpty";
import { formatNumber } from "./utils/museum-helpers";
import styles from "./page.module.css";

export default function MuseumPage() {
  const state = useMuseumState();
  const [snapshotInfoOpen, setSnapshotInfoOpen] = useState(false);

  return (
    <main className={styles.page} aria-labelledby="museum-page-title">
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {state.hasMuseum
          ? `${formatNumber(state.visibleItems.length)} museum entries match the current filters. ${formatNumber(state.displayedItems.length)} shown.`
          : state.emptyState.title}
      </div>

      <MuseumHero
        loaded={state.loaded}
        activeProfile={state.activeProfile}
        museum={state.museum}
        itemsCount={state.items.length}
        totalQuantity={state.totalQuantity}
        summaries={state.summaries}
        onOpenSnapshotInfo={() => setSnapshotInfoOpen(true)}
      />

      {!state.loaded ? (
        <MuseumLoading />
      ) : !state.hasMuseum ? (
        <MuseumEmptySnapshot
          icon={state.emptyState.icon}
          variant={state.emptyState.variant}
          title={state.emptyState.title}
          body={state.emptyState.body}
        />
      ) : (
        <>
          <MuseumImportStatus
            museum={state.museum}
            sourceTail={state.sourceTail}
            coverageText={state.coverageText}
            itemsCount={state.items.length}
            expectedItemCount={state.expectedItemCount}
            hasCountMismatch={state.hasCountMismatch}
            readableWarnings={state.readableWarnings}
            uniqueWarnings={state.uniqueWarnings}
            isOpen={snapshotInfoOpen}
            onClose={() => setSnapshotInfoOpen(false)}
          />

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
            summaryByCategory={state.summaryByCategory}
            activeControlCount={state.activeControlCount}
            resetControls={state.resetControls}
          />

          <MuseumGrid
            category={state.category}
            displayedItems={state.displayedItems}
            visibleItems={state.visibleItems}
            selectedQuantity={state.selectedQuantity}
            page={state.page}
            totalPages={state.totalPages}
            pageSize={state.pageSize}
            setPage={state.setPage}
            setPageSize={state.setPageSize}
            noMatchTitle={state.noMatchTitle}
            query={state.query}
            onResetFilters={state.resetControls}
            onInspectCollectible={state.openCollectible}
          />
        </>
      )}

      <BackToTop />
    </main>
  );
}
