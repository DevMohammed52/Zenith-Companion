"use client";

import {
  BarChart3,
  Check,
  Search,
  ShieldCheck,
  Timer,
} from "lucide-react";
import ZenithIcon from "@/components/icons/ZenithIcon";
import { formatGoldUnit, formatHours, formatSignedGold } from "@/lib/format";
import type { DungeonState } from "../hooks/useDungeonState";
import {
  DROP_VALUATION_LABELS,
  DROP_VALUATION_OPTIONS,
  type DungeonDropValuationMode,
  type ReadinessFilter,
  getDungeonKey,
  getReadinessText,
} from "../types";
import { DungeonItemEffectPicker } from "./DungeonItemEffectPicker";

export interface DungeonHeaderProps {
  state: DungeonState;
}

export function DungeonHeader({ state }: DungeonHeaderProps) {
  const {
    activeProfile,
    rows,
    heroDungeon,
    heroModeLabel,
    heroReason,
    summary,
    searchTerm,
    setSearchTerm,
    readinessFilter,
    setReadinessFilter,
    actionLimitSummary,
    completionMagicFindBonus,
    listedCompletionMagicFindBonus,
    eventCompletionMagicFindBonus,
    minimumProfit,
    setMinimumProfit,
    dungeonEfficiency,
    setDungeonEfficiency,
    dungeonMagicFind,
    setDungeonMagicFind,
    eventDungeonCompletionCount,
    setEventDungeonCompletionCount,
    includeMagicFindEv,
    setIncludeMagicFindEv,
    itemEfficiencyBonus,
    itemMagicFindBonus,
    equippedDungeonSpecialMagicFind,
    dungeonEfficiencyItemOptions,
    dungeonMagicFindItemOptions,
    dungeonItemModifierSelections,
    setDungeonItemModifierSelections,
    dropValuationMode,
    setDropValuationMode,
    manualSensitiveDropValue,
    setManualSensitiveDropValue,
    setSelectedDungeonKey,
    getHousingDungeonScopeText,
  } = state;

  return (
    <>
      <div className="header">
        <h1 className="header-title">
          <ZenithIcon name="castle" size={24} style={{ color: "var(--text-accent)" }} /> Dungeon Planner
        </h1>
        <div className="header-status" aria-live="polite">
          <div className="status-dot"></div>
          <span className="mono">{activeProfile ? `${activeProfile.name} - ` : ""}{rows.length} FILTERED</span>
        </div>
      </div>

      <section className="dungeon-command">
        <div className="dungeon-command-main">
          <span className="dungeon-eyebrow"><ShieldCheck size={14} /> {heroModeLabel}</span>
          <h2>{heroDungeon?.name || "Build a dungeon plan"}</h2>
          <p>
            {heroReason} Compare entry readiness, run cost, dungeon efficiency, gold per shard, and magic-find adjusted EV.
          </p>
          {summary.sensitiveDropCount > 0 && (
            <p className="dungeon-risk-note">
              Modeled market EV includes {summary.sensitiveDropCount} gear or mythic-style drop{summary.sensitiveDropCount === 1 ? "" : "s"} with thin-market risk. Use Vendor, Manual, or Exclude before treating these as fast-sale profit.
            </p>
          )}
        </div>
        <div className="dungeon-command-stats" aria-label="Dungeon summary metrics" tabIndex={0}>
          <div>
            <span>Ready dungeons</span>
            <strong>{activeProfile ? `${summary.readyRows.length} of ${rows.length} visible` : "Select profile"}</strong>
            <small>{activeProfile ? "Current filters your profile can enter now." : "Readiness needs an active profile."}</small>
          </div>
          <div>
            <span>Top ready EV/run</span>
            <strong>{summary.bestReady ? formatSignedGold(summary.bestReady.netProfitPerRun) : "-"}</strong>
            <small>{summary.bestReady ? `${summary.bestReady.name} after entry cost.` : activeProfile ? "No ready dungeon in this view." : "Select a profile to check readiness."}</small>
          </div>
          <div>
            <span>Lowest entry cost</span>
            <strong>{summary.cheapest ? formatGoldUnit(summary.cheapest.entryCost) : "-"}</strong>
            <small>{summary.cheapest ? `${summary.cheapest.name} entry cost per run.` : "No dungeon matches the filters."}</small>
          </div>
        </div>
      </section>

      <section className="dungeon-planner">
        <div className="dungeon-control-panel dungeon-find-panel" aria-label="Dungeon discovery controls">
          <div className="dungeon-planner-field dungeon-search-field dungeon-search-control">
            <label className="control-label">Search</label>
            <div className="dungeon-input-icon">
              <Search aria-hidden="true" size={16} strokeWidth={2.1} />
              <input
                aria-label="Search dungeons"
                type="text"
                className="control-input"
                placeholder="Search dungeon or location"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
          </div>
          <div className="dungeon-planner-field dungeon-filter-field dungeon-readiness-filters" role="group" aria-label="Filter by readiness">
            <span className="control-label">Entry Readiness</span>
            <div className="dungeon-segmented">
              {(["all", "ready", "blocked"] as ReadinessFilter[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  className={`dungeon-readiness-pill ${readinessFilter === mode ? "active" : ""}`}
                  aria-pressed={readinessFilter === mode}
                  onClick={() => setReadinessFilter(mode)}
                >
                  {mode === "all" ? "All" : mode === "ready" ? "Ready" : "Blocked"}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="dungeon-control-panel dungeon-limits-panel" aria-label="Dungeon profile limits">
          <div className="dungeon-planner-field dungeon-readonly-field dungeon-action-limit-field">
            <span className="control-label">Action Limit</span>
            <strong>{actionLimitSummary.maxHousing > 0 ? `Up to ${formatHours(actionLimitSummary.maxLimit)}` : formatHours(actionLimitSummary.base)}</strong>
            <small>
              {activeProfile
                ? actionLimitSummary.maxHousing > 0
                  ? `${activeProfile.kind === "main" ? "Main" : "Alt"} base ${formatHours(actionLimitSummary.base)}. Housing applies per matching row${actionLimitSummary.matchingLocationText ? ` (${actionLimitSummary.matchingLocationText})` : ""}.`
                  : `${activeProfile.kind === "main" ? "Main" : "Alt"} base. ${getHousingDungeonScopeText()}`
                : "Select a profile."}
            </small>
          </div>
          <div className="dungeon-planner-field dungeon-readonly-field dungeon-playtime-field">
            <span className="control-label">Playtime</span>
            <strong>{Number(activeProfile?.timers.activeHours || 0).toLocaleString()}h/day</strong>
            <small>Used for daily repeat capacity, not one queued action.</small>
          </div>
          <div className="dungeon-planner-field dungeon-readonly-field dungeon-completion-field">
            <span className="control-label">Completion Magic Find</span>
            <strong>+{completionMagicFindBonus}%</strong>
            <small>{listedCompletionMagicFindBonus}% current list + {eventCompletionMagicFindBonus}% limited-time.</small>
          </div>
        </div>
        <div className="dungeon-control-panel dungeon-tuning-panel" aria-label="Dungeon EV tuning controls">
          <label className="dungeon-planner-field dungeon-profit-field">
            <span className="control-label">Min Profit / Run</span>
            <input aria-label="Minimum profit per run" className="control-input" type="number" value={minimumProfit} onChange={(event) => setMinimumProfit(event.target.value === "" ? "" : Number.isFinite(Number(event.target.value)) ? Number(event.target.value) : "")} />
          </label>
          <label className="dungeon-planner-field dungeon-efficiency-field">
            <span className="control-label">Dungeon Efficiency</span>
            <input aria-label="Dungeon Efficiency" className="control-input" type="number" min="0" value={dungeonEfficiency} placeholder={activeProfile?.efficiency.dungeon ? String(activeProfile.efficiency.dungeon) : "0"} onChange={(event) => setDungeonEfficiency(event.target.value === "" ? "" : Math.max(0, Number(event.target.value) || 0))} />
          </label>
          <label className="dungeon-planner-field dungeon-mf-field">
            <span className="control-label">Dungeon MF</span>
            <input aria-label="Dungeon Magic Find" className="control-input" type="number" min="0" value={dungeonMagicFind} placeholder={activeProfile?.magicFind.dungeon ? String(activeProfile.magicFind.dungeon) : "0"} onChange={(event) => setDungeonMagicFind(event.target.value === "" ? "" : Math.max(0, Number(event.target.value) || 0))} />
          </label>
          <label className="dungeon-planner-field dungeon-event-completion-field">
            <span className="control-label">Event Completions</span>
            <input
              aria-label="Limited-time dungeon completions"
              className="control-input"
              type="number"
              min="0"
              value={eventDungeonCompletionCount}
              placeholder="0"
              onChange={(event) => setEventDungeonCompletionCount(event.target.value === "" ? "" : Math.max(0, Math.floor(Number(event.target.value) || 0)))}
            />
            <small>Adds completion MF for completed limited-time dungeons.</small>
          </label>
          <button
            type="button"
            className={`dungeon-check-toggle dungeon-mf-toggle ${includeMagicFindEv ? "active" : ""}`}
            aria-pressed={includeMagicFindEv}
            onClick={() => setIncludeMagicFindEv((value) => !value)}
          >
            <span className="dungeon-check-box">{includeMagicFindEv && <Check size={13} />}</span>
            <span>
              <strong>Apply MF</strong>
              <small>Adjust loot EV with profile and completion magic find.</small>
            </span>
          </button>
        </div>
      </section>

      <div className="dungeon-advanced-row">
        <section className="dungeon-modifier-panel" aria-label="Dungeon item modifiers">
          <div className="dungeon-modifier-copy">
            <span className="control-label">Dungeon Item Effects</span>
            <strong>
              {itemEfficiencyBonus > 0 || itemMagicFindBonus > 0 || equippedDungeonSpecialMagicFind > 0
                ? `${itemEfficiencyBonus > 0 ? `+${itemEfficiencyBonus}% speed` : "No speed"} / ${itemMagicFindBonus + equippedDungeonSpecialMagicFind > 0 ? `+${itemMagicFindBonus + equippedDungeonSpecialMagicFind}% MF` : "No MF"}`
                : "No item effect"}
            </strong>
            <small>Temporary dropdowns exclude equipped specials; profile gear special adds MF when selected.</small>
            {dungeonMagicFindItemOptions.length === 0 && (
              <small className="dungeon-empty-menu-hint">No tradeable temporary MF item is known in the current data. Select special gear from Profiles.</small>
            )}
          </div>
          <div className="dungeon-modifier-pickers">
            <DungeonItemEffectPicker
              ariaLabel="Active dungeon efficiency item"
              emptyLabel="No speed item"
              label="Efficiency Item"
              onChange={(value) => setDungeonItemModifierSelections((current) => ({ ...current, efficiencyItem: value }))}
              options={dungeonEfficiencyItemOptions}
              value={dungeonItemModifierSelections.efficiencyItem}
            />
            <DungeonItemEffectPicker
              ariaLabel="Active dungeon magic find item"
              emptyLabel="No magic-find item"
              label="Magic-Find Item"
              onChange={(value) => setDungeonItemModifierSelections((current) => ({ ...current, magicFindItem: value }))}
              options={dungeonMagicFindItemOptions}
              value={dungeonItemModifierSelections.magicFindItem}
            />
          </div>
        </section>

        <section className="dungeon-valuation-panel" aria-label="Dungeon drop valuation">
          <div className="dungeon-valuation-copy">
            <span className="control-label">Sensitive Drop Value</span>
            <strong>{DROP_VALUATION_LABELS[dropValuationMode]}</strong>
            <small>Uses safe market prices plus modeled chest/recipe paths for high-tier gear recipes and mythic potion-style drops. Loot EV, shard EV, and entry cost stay separated.</small>
          </div>
          <div className="dungeon-valuation-controls">
            <div className="dungeon-segmented dungeon-valuation-segmented" role="group" aria-label="Sensitive drop valuation mode">
              {DROP_VALUATION_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={dropValuationMode === option.value ? "active" : ""}
                  aria-pressed={dropValuationMode === option.value}
                  onClick={() => setDropValuationMode(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
            {dropValuationMode === "manual" && (
              <label className="dungeon-manual-value-field">
                <span className="control-label">Manual Value / Drop</span>
                <input
                  aria-label="Manual value for sensitive dungeon drops"
                  className="control-input"
                  type="number"
                  min="0"
                  value={manualSensitiveDropValue}
                  placeholder="0"
                  onChange={(event) => setManualSensitiveDropValue(event.target.value === "" ? "" : Math.max(0, Number(event.target.value) || 0))}
                />
              </label>
            )}
          </div>
        </section>
      </div>

      <section className="dungeon-insights">
        <button type="button" className="dungeon-insight" onClick={() => summary.bestProfit && setSelectedDungeonKey(getDungeonKey(summary.bestProfit))}>
          <BarChart3 size={16} />
          <span>Top EV/run in view</span>
          <strong>{summary.bestProfit ? summary.bestProfit.name : "-"}</strong>
          <small>{summary.bestProfit ? `${formatSignedGold(summary.bestProfit.netProfitPerRun)} after entry cost.` : "No dungeon data in this view."}</small>
        </button>
        <button type="button" className="dungeon-insight" onClick={() => summary.bestReady && setSelectedDungeonKey(getDungeonKey(summary.bestReady))}>
          <ShieldCheck size={16} />
          <span>Top ready EV/run</span>
          <strong>{summary.bestReady ? summary.bestReady.name : "-"}</strong>
          <small>{summary.bestReady ? `${formatSignedGold(summary.bestReady.netProfitPerRun)} and ${getReadinessText(summary.bestReady, Boolean(activeProfile)).toLowerCase()}.` : "No ready dungeon in this view."}</small>
        </button>
        <div className="dungeon-insight passive">
          <Timer size={16} />
          <span>Profile action limit</span>
          <strong>{actionLimitSummary.maxHousing > 0 ? `Up to ${formatHours(actionLimitSummary.maxLimit)}` : `${formatHours(actionLimitSummary.base)} action limit`}</strong>
          <small>
            {actionLimitSummary.maxHousing > 0
              ? `Base ${formatHours(actionLimitSummary.base)}; housing applies only on ${actionLimitSummary.matchingRows} matching row${actionLimitSummary.matchingRows === 1 ? "" : "s"}.`
              : "No dungeon housing bonus applied."}
          </small>
        </div>
      </section>
    </>
  );
}

export default DungeonHeader;
