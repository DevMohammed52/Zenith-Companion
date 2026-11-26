"use client";

import styles from "./page.module.css";
import { BackToTop, Skeleton, SkeletonContainer } from "@/components/ui";
import { useItemModal } from "@/context/ItemModalContext";
import { useSkillProfitState } from "./hooks/useSkillProfitState";
import { useSkillProfitCalculations } from "./hooks/useSkillProfitCalculations";
import { SkillProfitHeader, SkillProfitTabs } from "./components/SkillProfitHeader";
import { SkillProfitFilterBar } from "./components/SkillProfitFilterBar";
import { SkillProfitTable } from "./components/SkillProfitTable";
import { SkillProfitCardList } from "./components/SkillProfitCardList";
import { SkillProfitStrategyModal } from "./components/SkillProfitStrategyModal";

export {
  STORAGE_KEY,
  DEFAULT_SETTINGS,
  DEFAULT_STATE,
  MOBILE_RESULT_BATCH_SIZE,
  CONQUEST_PICKER_OPTIONS,
  SALE_MODE_OPTIONS,
  SORT_LABELS,
  isLiquid,
  isExcludedFromTop,
  getSearchTokens,
  rowMatchesSearch,
  getMatchedIngredient,
  getSortValue,
  getDisplayProfitPerHour,
  getRankedProfitPerHour,
  getProfitCellValue,
  getProfitCardValue,
  getProfitSummary,
  formatSignedGold,
  formatNumber,
  formatOptionalNumber,
  formatPriceSource,
  formatType,
  stringifyDetail,
  formatEffectEntry,
} from "./types";

export default function SkillProfitPage() {
  const state = useSkillProfitState();
  const calc = useSkillProfitCalculations(state);
  const { openItemByName, prefetchItem } = useItemModal();
  const itemsDb = (calc.allItemsDb as Record<string, any> | null) || null;
  const activeModifierCount =
    (calc.effectiveSettings.membership ? 1 : 0) +
    (calc.effectiveSettings.assaultRank !== "none" ? 1 : 0) +
    (calc.effectiveSettings.energizingPoolExp > 0 ? 1 : 0) +
    (state.targetBarteringLevel > 0 ? 1 : 0) +
    calc.activeEssenceCount +
    state.settings.ascensionBuffIds.length;
  const showCards = state.compactResults || state.viewMode === "cards";

  return (
    <main className={`container ${styles.shell}`} aria-label="Skill Profit Planner">
      <SkillProfitHeader
        profileLabel={calc.profileLabel}
        membership={calc.effectiveSettings.membership}
        topRoute={calc.activeTopRoute}
        rowsCount={calc.rows.length}
        filteredCount={calc.rowModel.filtered.length}
        liquidRouteCount={calc.liquidRouteCount}
        marketAgeMinutes={calc.marketAgeMinutes}
        buffTotals={calc.buffTotals}
        baseIdleActionHours={calc.baseIdleActionHours}
        activeSkillHousingLabel={calc.activeSkillHousingLabel}
        activeSkillHousingHours={calc.activeSkillHousingHours}
        housingWindowAllValue={calc.housingWindowAllValue}
        housingWindowAllSub={calc.housingWindowAllSub}
        housingWindowSub={calc.housingWindowSub}
        activeSkill={state.activeSkill}
        rateMode={state.rateMode}
        activeModifierCount={activeModifierCount}
        onOpenDrawer={() => state.setDrawerOpen(true)}
        allItemsDb={itemsDb}
        onSelectRow={state.setSelectedRow}
        prefetchItem={prefetchItem}
      />

      <SkillProfitTabs
        activeSkill={state.activeSkill}
        onSelectSkill={state.setActiveSkill}
        counts={calc.rowModel.counts}
        rowsCount={calc.rows.length}
      />

      <SkillProfitFilterBar state={state} calc={calc} />

      <div id="skill-profit-results" style={{ minHeight: "520px", contain: "layout" }}>
        {calc.isLoading ? (
          <SkeletonContainer busy announcement="Loading skill profit routes...">
            <div className={styles.skeletonCard}>
              <Skeleton variant="text" width="38%" height={20} />
              <Skeleton variant="rectangular" width="100%" height={46} />
              <Skeleton variant="rectangular" width="100%" height={46} />
              <Skeleton variant="rectangular" width="100%" height={46} />
              <Skeleton variant="rectangular" width="100%" height={46} />
              <Skeleton variant="rectangular" width="100%" height={46} />
            </div>
          </SkeletonContainer>
        ) : showCards ? (
          <SkillProfitCardList
            visibleRows={calc.paginatedRows}
            totalFilteredCount={calc.rowModel.filtered.length}
            currentPage={state.currentPage}
            totalPages={calc.totalPages}
            pageSize={state.pageSize}
            minVolume={state.minVolume}
            rateMode={state.rateMode}
            baseIdleActionHours={calc.baseIdleActionHours}
            configuredProfile={state.configuredProfile}
            searchTokens={calc.searchTokens}
            allItemsDb={itemsDb}
            onPageChange={state.setCurrentPage}
            onPageSizeChange={state.setPageSize}
            onSelectRow={state.setSelectedRow}
            prefetchItem={prefetchItem}
            onResetFilters={state.resetRouteFilters}
          />
        ) : (
          <SkillProfitTable
            visibleRows={calc.paginatedRows}
            totalFilteredCount={calc.rowModel.filtered.length}
            currentPage={state.currentPage}
            totalPages={calc.totalPages}
            pageSize={state.pageSize}
            minVolume={state.minVolume}
            rateMode={state.rateMode}
            baseIdleActionHours={calc.baseIdleActionHours}
            configuredProfile={state.configuredProfile}
            searchTokens={calc.searchTokens}
            sortKey={state.sortKey}
            sortDesc={state.sortDesc}
            allItemsDb={itemsDb}
            onSort={state.handleSort}
            onPageChange={state.setCurrentPage}
            onPageSizeChange={state.setPageSize}
            onSelectRow={state.setSelectedRow}
            prefetchItem={prefetchItem}
            onResetFilters={state.resetRouteFilters}
          />
        )}
      </div>

      {state.selectedRow && (
        <SkillProfitStrategyModal
          row={state.selectedRow}
          settings={{ ...calc.effectiveSettings, housingIdleHoursBySkill: calc.housingIdleHoursBySkill }}
          membership={calc.effectiveSettings.membership}
          onClose={() => state.setSelectedRow(null)}
          onOpenItem={(name) => {
            state.setSelectedRow(null);
            openItemByName(name);
          }}
        />
      )}

      <BackToTop />
    </main>
  );
}
