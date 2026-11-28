"use client";

import { useState } from "react";
import { GameImage } from "@/components/GameImage";
import { GoldIcon } from "@/components/GoldIcon";
import { Button, Icon, SearchInput, SegmentedControl } from "@/components/ui";
import { formatGoldUnit, formatHours, formatSignedGold } from "@/lib/format";
import type { DungeonState } from "../hooks/useDungeonState";
import {
  DROP_VALUATION_LABELS,
  DROP_VALUATION_OPTIONS,
  type DungeonDropValuationMode,
  type ReadinessFilter,
  getDungeonKey,
} from "../types";
import { DungeonItemEffectPicker } from "./DungeonItemEffectPicker";
import styles from "../Dungeons.module.css";

export interface DungeonHeaderProps {
  state: DungeonState;
}

export function DungeonHeader({ state }: DungeonHeaderProps) {
  const [tuningOpen, setTuningOpen] = useState(true);
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
    resetFilters,
  } = state;

  const hasFilters = Boolean(searchTerm.trim() || readinessFilter !== "all" || minimumProfit !== "");
  const totalItemMf = itemMagicFindBonus + equippedDungeonSpecialMagicFind;

  return (
    <header className={styles.headerBlock}>
      <div className={styles.titleRow}>
        <div className={styles.titleGroup}>
          <span className={styles.eyebrow}>
            <Icon name="dungeon" size="sm" aria-hidden="true" />
            <span>
              {activeProfile ? `${activeProfile.name} | ` : ""}
              {rows.length} {rows.length === 1 ? "dungeon" : "dungeons"} shown
            </span>
          </span>
          <h1 className={styles.pageTitle}>Dungeon Planner</h1>
          <p className={styles.subtitle}>
            Compare entry readiness, gold per run, shard value, and queued run limits.
          </p>
        </div>
      </div>

      <section className={styles.commandCard} aria-label="Dungeon spotlight and summary metrics">
        <div className={styles.commandHero}>
          <span className={styles.heroThumb} aria-hidden="true">
            <GameImage
              src={heroDungeon?.image_url}
              alt=""
              width={44}
              height={44}
              sizes="44px"
              fallback={<Icon name="dungeon" size="lg" />}
            />
          </span>
          <div className={styles.heroMeta}>
            <div className={styles.heroLabelRow}>
              <span className={styles.heroKicker}>{heroModeLabel}</span>
            </div>
            {heroDungeon ? (
              <button
                type="button"
                className={styles.heroButton}
                onClick={() => setSelectedDungeonKey(getDungeonKey(heroDungeon))}
              >
                <span>{heroDungeon.name}</span>
                <Icon name="chevronRight" size="sm" aria-hidden="true" />
              </button>
            ) : (
              <strong style={{ fontSize: "1.1rem" }}>Build a dungeon plan</strong>
            )}
            <p className={styles.heroSubtext}>{heroReason}</p>
          </div>
        </div>

        <div className={styles.statStrip}>
          <div className={styles.statCell}>
            <span className={styles.statLabel}>Ready Dungeons</span>
            <strong className={styles.statValue}>
              {activeProfile ? `${summary.readyRows.length}/${rows.length}` : "No profile"}
            </strong>
            <span className={styles.statHint}>
              {activeProfile ? "Enterable right now" : "Pick a character"}
            </span>
          </div>

          <div className={styles.statCell}>
            {summary.bestReady ? (
              <button
                type="button"
                className={styles.statCellAction}
                onClick={() => summary.bestReady && setSelectedDungeonKey(getDungeonKey(summary.bestReady))}
              >
                <span className={styles.statLabel}>Top Ready EV/Run</span>
                <strong className={styles.statValue}>
                  <GoldIcon size={13} />
                  <span>{formatSignedGold(summary.bestReady.netProfitPerRun)}</span>
                </strong>
                <span className={styles.statHint}>{summary.bestReady.name}</span>
              </button>
            ) : (
              <>
                <span className={styles.statLabel}>Top Ready EV/Run</span>
                <strong className={styles.statValue}>—</strong>
                <span className={styles.statHint}>{activeProfile ? "None ready here" : "Needs profile"}</span>
              </>
            )}
          </div>

          <div className={styles.statCell}>
            {summary.cheapest ? (
              <button
                type="button"
                className={styles.statCellAction}
                onClick={() => summary.cheapest && setSelectedDungeonKey(getDungeonKey(summary.cheapest))}
              >
                <span className={styles.statLabel}>Lowest Entry Cost</span>
                <strong className={styles.statValue}>
                  <GoldIcon size={13} />
                  <span>{formatGoldUnit(summary.cheapest.entryCost)}</span>
                </strong>
                <span className={styles.statHint}>{summary.cheapest.name}</span>
              </button>
            ) : (
              <>
                <span className={styles.statLabel}>Lowest Entry Cost</span>
                <strong className={styles.statValue}>—</strong>
                <span className={styles.statHint}>No match</span>
              </>
            )}
          </div>

          <div className={styles.statCell}>
            <span className={styles.statLabel}>Action Limit</span>
            <strong className={styles.statValue}>
              {actionLimitSummary.maxHousing > 0
                ? `Up to ${formatHours(actionLimitSummary.maxLimit)}`
                : formatHours(actionLimitSummary.base)}
            </strong>
            <span className={styles.statHint}>
              {activeProfile
                ? actionLimitSummary.maxHousing > 0
                  ? `${actionLimitSummary.matchingLocationText || `${actionLimitSummary.matchingRows} zones`}`
                  : `${activeProfile.kind === "main" ? "Main" : "Alt"} base cap`
                : "Select profile"}
            </span>
          </div>
        </div>
      </section>

      <section className={styles.toolbarCard} aria-label="Dungeon discovery and calculator controls">
        <div className={styles.primaryControls}>
          <SearchInput
            id="dungeon-search-input"
            ariaLabel="Search dungeons"
            placeholder="Search dungeon or location..."
            value={searchTerm}
            onChange={setSearchTerm}
            showShortcutHint={false}
          />

          <SegmentedControl<ReadinessFilter>
            ariaLabel="Filter by entry readiness"
            value={readinessFilter}
            onChange={setReadinessFilter}
            options={[
              { value: "all", label: "All" },
              { value: "ready", label: "Ready" },
              { value: "blocked", label: "Blocked" },
            ]}
          />

          <button
            type="button"
            className={`${styles.toggleChip} ${includeMagicFindEv ? styles.toggleChipActive : ""}`.trim()}
            aria-pressed={includeMagicFindEv}
            onClick={() => setIncludeMagicFindEv((value) => !value)}
          >
            <Icon name={includeMagicFindEv ? "check" : "minus"} size="xs" aria-hidden="true" />
            <span>Apply MF EV</span>
          </button>

          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.45rem" }}>
            <Button
              variant="secondary"
              size="md"
              aria-expanded={tuningOpen}
              icon={<Icon name="filter" size="sm" aria-hidden="true" />}
              iconTrailing={
                <Icon
                  name={tuningOpen ? "chevronUp" : "chevronDown"}
                  size="sm"
                  aria-hidden="true"
                />
              }
              onClick={() => setTuningOpen((open) => !open)}
            >
              Tuning
            </Button>
            {hasFilters && (
              <Button variant="ghost" size="md" onClick={resetFilters}>
                Reset
              </Button>
            )}
          </div>
        </div>

        <div className={`${styles.tuningDrawer} ${tuningOpen ? styles.tuningDrawerOpen : ""}`.trim()}>
          <div className={styles.tuningDrawerInner}>
            <div className={styles.tuningBody}>
              <div className={styles.limitsStrip} aria-label="Dungeon profile limits">
                <div className={styles.statCell}>
                  <span className={styles.statLabel}>Action Limit</span>
                  <strong className={styles.statValue}>
                    {actionLimitSummary.maxHousing > 0
                      ? `Up to ${formatHours(actionLimitSummary.maxLimit)}`
                      : formatHours(actionLimitSummary.base)}
                  </strong>
                  <span className={styles.statHint}>
                    {activeProfile
                      ? actionLimitSummary.maxHousing > 0
                        ? `Base ${formatHours(actionLimitSummary.base)} + housing`
                        : getHousingDungeonScopeText()
                      : "Select a profile."}
                  </span>
                </div>
                <div className={styles.statCell}>
                  <span className={styles.statLabel}>Daily Playtime</span>
                  <strong className={styles.statValue}>
                    {Number(activeProfile?.timers.activeHours || 0).toLocaleString()}h/day
                  </strong>
                  <span className={styles.statHint}>Daily repeat budget</span>
                </div>
                <div className={styles.statCell}>
                  <span className={styles.statLabel}>Completion Magic Find</span>
                  <strong className={styles.statValue}>+{completionMagicFindBonus}%</strong>
                  <span className={styles.statHint}>
                    {listedCompletionMagicFindBonus}% listed + {eventCompletionMagicFindBonus}% event
                  </span>
                </div>
              </div>

              <div className={styles.tuningGrid}>
                <label className={styles.controlField}>
                  <span className={styles.fieldLabel}>
                    <span>Min Profit / Run</span>
                    <span className={styles.fieldMeta}>Gold</span>
                  </span>
                  <div className={styles.numberFieldWrap}>
                    <GoldIcon size={14} />
                    <input
                      aria-label="Minimum profit per run"
                      className={styles.numberFieldInput}
                      type="number"
                      inputMode="numeric"
                      value={minimumProfit}
                      placeholder="Any"
                      onChange={(event) =>
                        setMinimumProfit(
                          event.target.value === ""
                            ? ""
                            : Number.isFinite(Number(event.target.value))
                              ? Number(event.target.value)
                              : "",
                        )
                      }
                    />
                  </div>
                </label>

                <label className={styles.controlField}>
                  <span className={styles.fieldLabel}>
                    <span>Dungeon Efficiency</span>
                    <span className={styles.fieldMeta}>% speed</span>
                  </span>
                  <div className={styles.numberFieldWrap}>
                    <input
                      aria-label="Dungeon Efficiency"
                      className={styles.numberFieldInput}
                      type="number"
                      min="0"
                      inputMode="numeric"
                      value={dungeonEfficiency}
                      placeholder={activeProfile?.efficiency.dungeon ? String(activeProfile.efficiency.dungeon) : "0"}
                      onChange={(event) =>
                        setDungeonEfficiency(
                          event.target.value === "" ? "" : Math.max(0, Number(event.target.value) || 0),
                        )
                      }
                    />
                    <span className={styles.numberFieldUnit}>%</span>
                  </div>
                </label>

                <label className={styles.controlField}>
                  <span className={styles.fieldLabel}>
                    <span>Dungeon MF</span>
                    <span className={styles.fieldMeta}>% bonus</span>
                  </span>
                  <div className={styles.numberFieldWrap}>
                    <input
                      aria-label="Dungeon Magic Find"
                      className={styles.numberFieldInput}
                      type="number"
                      min="0"
                      inputMode="numeric"
                      value={dungeonMagicFind}
                      placeholder={activeProfile?.magicFind.dungeon ? String(activeProfile.magicFind.dungeon) : "0"}
                      onChange={(event) =>
                        setDungeonMagicFind(
                          event.target.value === "" ? "" : Math.max(0, Number(event.target.value) || 0),
                        )
                      }
                    />
                    <span className={styles.numberFieldUnit}>%</span>
                  </div>
                </label>

                <label className={styles.controlField}>
                  <span className={styles.fieldLabel}>
                    <span>Event Completions</span>
                    <span className={styles.fieldMeta}>+1% MF ea</span>
                  </span>
                  <div className={styles.numberFieldWrap}>
                    <input
                      aria-label="Limited-time dungeon completions"
                      className={styles.numberFieldInput}
                      type="number"
                      min="0"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={eventDungeonCompletionCount}
                      placeholder="0"
                      onChange={(event) =>
                        setEventDungeonCompletionCount(
                          event.target.value === "" ? "" : Math.max(0, Math.floor(Number(event.target.value) || 0)),
                        )
                      }
                    />
                  </div>
                </label>
              </div>

              <div className={styles.modifiersValuationRow}>
                <section className={styles.insetGroup} aria-label="Dungeon item modifiers">
                  <div className={styles.insetGroupHeader}>
                    <span className={styles.insetGroupTitle}>Dungeon Item Effects</span>
                    <span className={styles.insetGroupNote}>
                      {itemEfficiencyBonus > 0 || totalItemMf > 0
                        ? `${itemEfficiencyBonus > 0 ? `+${itemEfficiencyBonus}% speed` : "No speed"} | ${totalItemMf > 0 ? `+${totalItemMf}% MF` : "No MF"}`
                        : "No item effect active"}
                    </span>
                  </div>
                  <div className={styles.pickersPair}>
                    <DungeonItemEffectPicker
                      ariaLabel="Active dungeon efficiency item"
                      emptyLabel="No speed item"
                      label="Efficiency Item"
                      onChange={(value) =>
                        setDungeonItemModifierSelections((current) => ({ ...current, efficiencyItem: value }))
                      }
                      options={dungeonEfficiencyItemOptions}
                      value={dungeonItemModifierSelections.efficiencyItem}
                    />
                    <DungeonItemEffectPicker
                      ariaLabel="Active dungeon magic find item"
                      emptyLabel="No magic-find item"
                      label="Magic-Find Item"
                      onChange={(value) =>
                        setDungeonItemModifierSelections((current) => ({ ...current, magicFindItem: value }))
                      }
                      options={dungeonMagicFindItemOptions}
                      value={dungeonItemModifierSelections.magicFindItem}
                    />
                  </div>
                </section>

                <section className={styles.insetGroup} aria-label="Dungeon drop valuation">
                  <div className={styles.insetGroupHeader}>
                    <span className={styles.insetGroupTitle}>Sensitive Drop Value</span>
                    <span className={styles.insetGroupNote}>{DROP_VALUATION_LABELS[dropValuationMode]}</span>
                  </div>
                  <div className={styles.valuationControls}>
                    <SegmentedControl<DungeonDropValuationMode>
                      ariaLabel="Sensitive drop valuation mode"
                      value={dropValuationMode}
                      onChange={setDropValuationMode}
                      options={DROP_VALUATION_OPTIONS.map((option) => ({
                        value: option.value,
                        label: option.label,
                      }))}
                      fullWidth
                    />
                    {dropValuationMode === "manual" && (
                      <label className={styles.controlField}>
                        <span className={styles.fieldLabel}>
                          <span>Manual Value / Drop</span>
                        </span>
                        <div className={styles.numberFieldWrap}>
                          <GoldIcon size={14} />
                          <input
                            aria-label="Manual value for sensitive dungeon drops"
                            className={styles.numberFieldInput}
                            type="number"
                            min="0"
                            inputMode="numeric"
                            value={manualSensitiveDropValue}
                            placeholder="0"
                            onChange={(event) =>
                              setManualSensitiveDropValue(
                                event.target.value === "" ? "" : Math.max(0, Number(event.target.value) || 0),
                              )
                            }
                          />
                        </div>
                      </label>
                    )}
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      </section>
    </header>
  );
}

export default DungeonHeader;
