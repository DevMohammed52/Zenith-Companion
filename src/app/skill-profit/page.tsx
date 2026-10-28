"use client";

import styles from "./page.module.css";
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

  return (
    <main
      className={`container ${styles.shell} ${state.mobileSetupOpen ? styles.mobileSetupOpen : styles.mobileSetupCollapsed}`}
      aria-label="Skill Profit Finder"
    >
      <SkillProfitHeader
        profileLabel={calc.profileLabel}
        scopeLabel={calc.scopeLabel}
        saleModeLabel={calc.saleModeLabel}
        topRoute={calc.rowModel.topOverall}
        rowsCount={calc.rows.length}
        filteredCount={calc.rowModel.filtered.length}
        marketAgeMinutes={calc.marketAgeMinutes}
        buffTotals={calc.buffTotals}
        housingWindowAllValue={calc.housingWindowAllValue}
        housingWindowAllSub={calc.housingWindowAllSub}
        activeSkillHousingLabel={calc.activeSkillHousingLabel}
        activeSkillHousingHours={calc.activeSkillHousingHours}
        housingWindowSub={calc.housingWindowSub}
        activeSkill={state.activeSkill}
        onSelectSkill={state.setActiveSkill}
        topBySkill={calc.rowModel.topBySkill}
        counts={calc.rowModel.counts}
        forgeRecipesCount={calc.forgeRecipes.length}
        onSelectRow={state.setSelectedRow}
        prefetchItem={prefetchItem}
      />

      <SkillProfitFilterBar state={state} calc={calc} />

      <SkillProfitTabs
        activeSkill={state.activeSkill}
        onSelectSkill={state.setActiveSkill}
        filteredCount={calc.rowModel.filtered.length}
      />

      <div style={{ minHeight: "520px", contain: "layout" }}>
        <SkillProfitCardList
          visibleRows={calc.visibleRows}
          hiddenRowCount={calc.hiddenRowCount}
          totalFilteredCount={calc.rowModel.filtered.length}
          minVolume={state.minVolume}
          searchTokens={calc.searchTokens}
          onSelectRow={state.setSelectedRow}
          prefetchItem={prefetchItem}
          onShowMore={() => state.setVisibleRowLimit((limit) => limit + 48)}
          onResetFilters={state.resetRouteFilters}
        />

        <SkillProfitTable
          visibleRows={calc.visibleRows}
          hiddenRowCount={calc.hiddenRowCount}
          totalFilteredCount={calc.rowModel.filtered.length}
          minVolume={state.minVolume}
          searchTokens={calc.searchTokens}
          sortKey={state.sortKey}
          sortDesc={state.sortDesc}
          onSort={state.handleSort}
          onSelectRow={state.setSelectedRow}
          prefetchItem={prefetchItem}
          onShowMore={() => state.setVisibleRowLimit((limit) => limit + 48)}
          onResetFilters={state.resetRouteFilters}
        />
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
    </main>
  );
}
