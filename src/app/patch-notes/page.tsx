"use client";

import { Suspense } from "react";
import { BackToTop, EmptyState, Skeleton, SkeletonContainer } from "@/components/ui";
import { PatchNotesHeader } from "./components/PatchNotesHeader";
import { PatchNotesToolbar } from "./components/PatchNotesToolbar";
import { PatchNotesList } from "./components/PatchNotesList";
import { usePatchNotesState } from "./hooks/usePatchNotesState";
import styles from "./PatchNotes.module.css";

function PatchNotesSkeleton() {
  return (
    <SkeletonContainer announcement="Loading IdleMMO patch notes..." className={styles.skeletonStack}>
      {[0, 1, 2, 3].map((idx) => (
        <div key={idx} className={styles.skeletonCard}>
          <Skeleton variant="text" width="28%" height={18} />
          <Skeleton variant="text" width="54%" height={24} />
          <Skeleton variant="rectangular" width="100%" height={42} />
        </div>
      ))}
    </SkeletonContainer>
  );
}

function PatchNotesContent() {
  const state = usePatchNotesState();

  return (
    <main className={styles.container} aria-labelledby="patch-notes-page-title">
      <PatchNotesHeader meta={state.meta} totalCount={state.totalCount} />

      <PatchNotesToolbar
        query={state.query}
        onQueryChange={state.handleQueryChange}
        category={state.category}
        onCategoryChange={state.handleCategoryChange}
        year={state.year}
        onYearChange={state.handleYearChange}
        categoryOptions={state.categoryOptions}
        yearOptions={state.yearOptions}
        categoryCounts={state.categoryCounts}
        isLoading={state.isLoading}
        hasFilters={state.hasFilters}
        onReset={state.handleReset}
        filteredCount={state.filteredNotes.length}
        visibleRangeLabel={state.visibleRangeLabel}
        onExpandAll={() => state.setExpandedIds(new Set(state.paginatedNotes.map((n) => n.id)))}
        onCollapseAll={() => state.setExpandedIds(new Set())}
      />

      <div className={styles.viewport} style={{ minHeight: "520px", contain: "layout" }}>
        {state.isLoading ? (
          <PatchNotesSkeleton />
        ) : state.loadError ? (
          <EmptyState
            variant="error"
            title="Could not load IdleMMO patch notes"
            description={state.loadError}
            action={{ label: "Retry", onClick: state.handleRetry }}
          />
        ) : state.filteredNotes.length === 0 ? (
          <EmptyState
            variant="search-empty"
            title="No matching patch notes"
            description="Try a different keyword or reset the active category and year filters."
            query={state.query.trim() || undefined}
            action={{ label: "Clear filters", onClick: state.handleReset }}
          />
        ) : (
          <PatchNotesList
            notes={state.paginatedNotes}
            totalFilteredCount={state.filteredNotes.length}
            latestId={state.meta?.latestPatchId ?? null}
            query={state.deferredQuery}
            activeCategory={state.category}
            expandedIds={state.expandedIds}
            currentPage={state.currentPage}
            totalPages={state.totalPages}
            onToggleExpand={state.handleToggleExpand}
            onCategorySelect={state.handleCategoryChange}
            onPageChange={state.setCurrentPage}
          />
        )}
      </div>

      <BackToTop />
    </main>
  );
}

export default function IdleMmoPatchNotesPage() {
  return (
    <Suspense fallback={<div className={styles.container}><PatchNotesSkeleton /></div>}>
      <PatchNotesContent />
    </Suspense>
  );
}
