"use client";

import { useMemo, useState } from "react";
import { Eye, Info, PackageSearch, X } from "lucide-react";
import { formatGold } from "@/lib/format";
import { formatHours } from "@/lib/housing";
import { formatEssenceBuff } from "@/lib/essences";
import { useData } from "@/context/DataContext";
import { usePreferences } from "@/lib/preferences";
import { useModalA11y } from "@/lib/use-modal-a11y";
import {
  calculateSkillProfitRow,
  getPrice,
  isFixedBuyPriceItem,
  type SkillName,
  type SkillProfitRow,
  type SkillProfitSettings,
} from "@/lib/skill-profit";
import QualityText from "@/components/QualityText";
import styles from "../page.module.css";
import { CalcRow, DetailPill, DetailList } from "./SkillProfitControls";
import {
  formatEffectEntry,
  formatNumber,
  formatOptionalNumber,
  formatPriceSource,
  formatSignedGold,
  formatType,
  getDisplayProfitPerHour,
  getRankedProfitPerHour,
  stringifyDetail,
} from "../types";

export interface SkillProfitStrategyModalProps {
  row: SkillProfitRow;
  settings: SkillProfitSettings & { housingIdleHoursBySkill?: Partial<Record<SkillName, number>> };
  membership: boolean;
  onClose: () => void;
  onOpenItem: (name: string) => void;
}

export function SkillProfitStrategyModal({
  row,
  settings,
  membership,
  onClose,
  onOpenItem,
}: SkillProfitStrategyModalProps) {
  const { marketData, allItemsDb } = useData();
  const { preferences, setPreferences } = usePreferences();
  const [scenarioPrices, setScenarioPrices] = useState<Record<string, string>>({});
  const [targetGoldPerHour, setTargetGoldPerHour] = useState("");
  const [scenarioSaved, setScenarioSaved] = useState(false);

  const cleanScenarioPrices = useMemo(() => {
    return Object.fromEntries(
      Object.entries(scenarioPrices)
        .map(([name, value]) => [name, Number(value)] as const)
        .filter(([, value]) => Number.isFinite(value) && value > 0),
    );
  }, [scenarioPrices]);

  const settingsWithoutRowEssence = useMemo<SkillProfitSettings>(() => {
    const essenceBySkill = { ...settings.essenceBySkill };
    const essenceBuffsBySkill = { ...settings.essenceBuffsBySkill };
    const essencePricesBySkill = { ...settings.essencePricesBySkill };
    delete essenceBySkill[row.skill];
    delete essenceBuffsBySkill[row.skill];
    delete essencePricesBySkill[row.skill];
    return {
      ...settings,
      essenceBySkill,
      essenceBuffsBySkill,
      essencePricesBySkill,
    };
  }, [row.skill, settings]);

  const baseRouteRow = useMemo(
    () => calculateSkillProfitRow(row, marketData, allItemsDb, { ...settingsWithoutRowEssence, scenarioPrices: cleanScenarioPrices }),
    [allItemsDb, cleanScenarioPrices, marketData, row, settingsWithoutRowEssence],
  );

  const activeRow = useMemo(
    () => calculateSkillProfitRow(row, marketData, allItemsDb, { ...settings, scenarioPrices: cleanScenarioPrices }),
    [allItemsDb, cleanScenarioPrices, marketData, row, settings],
  );

  const taxRate = membership ? 12 : 15;
  const hasScenarioPrices = Object.keys(cleanScenarioPrices).length > 0;
  const baseIngredientCosts = useMemo(
    () => new Map(row.ingredientCosts.map((ingredient) => [ingredient.name, ingredient])),
    [row.ingredientCosts],
  );

  const actionRate = Math.max(activeRow.itemsPerHour, 1);
  const target = Number(targetGoldPerHour);
  const targetNeedsEssencePrice = activeRow.essenceActive && activeRow.essenceNeedsPrice;
  const essenceCostPerAction = activeRow.essenceActive && activeRow.essenceCostPerHour !== null
    ? activeRow.essenceCostPerHour / actionRate
    : 0;
  const targetPerAction = !targetNeedsEssencePrice && Number.isFinite(target) && target > 0
    ? (target + (activeRow.essenceActive ? activeRow.essenceCostPerHour || 0 : 0)) / actionRate
    : null;

  const editableInputCount = activeRow.ingredientCosts.filter((ingredient) => !isFixedBuyPriceItem(ingredient.name) && ingredient.source !== "vendor").length;
  const sharedInputs = activeRow.ingredientCosts
    .map((ingredient) => ({
      ingredient,
      usedTotal: ingredient.unitPrice * ingredient.quantity,
    }))
    .filter(({ ingredient, usedTotal }) => !isFixedBuyPriceItem(ingredient.name) && ingredient.source !== "vendor" && ingredient.unitPrice > 0 && usedTotal > 0);

  const sharedInputCost = sharedInputs.reduce((sum, entry) => sum + entry.usedTotal, 0);
  const sharedFixedInputCost = activeRow.inputCost - sharedInputCost;
  const sharedBreakEvenBudget = targetNeedsEssencePrice
    ? null
    : activeRow.netRevenue - sharedFixedInputCost - essenceCostPerAction;
  const sharedTargetBudget = targetPerAction === null ? null : activeRow.netRevenue - sharedFixedInputCost - targetPerAction;
  const sharedBreakEvenRatio = sharedInputCost > 0 && sharedBreakEvenBudget !== null && sharedBreakEvenBudget > 0
    ? sharedBreakEvenBudget / sharedInputCost
    : null;
  const sharedTargetRatio = sharedInputCost > 0 && sharedTargetBudget !== null && sharedTargetBudget > 0
    ? sharedTargetBudget / sharedInputCost
    : null;
  const sharedBreakEvenLabel = sharedBreakEvenRatio === null
    ? targetNeedsEssencePrice ? "Needs price" : "No margin"
    : sharedBreakEvenRatio >= 1
      ? `+${Math.round((sharedBreakEvenRatio - 1) * 100)}% room`
      : `${Math.round((1 - sharedBreakEvenRatio) * 100)}% lower`;

  const displayProfitPerHour = getDisplayProfitPerHour(activeRow);
  const rankedProfitPerHour = getRankedProfitPerHour(activeRow);
  const changeNeedsPriceData = (row.essenceActive && row.essenceNeedsPrice) || (activeRow.essenceActive && activeRow.essenceNeedsPrice);
  const profitPerHourDelta = changeNeedsPriceData ? null : rankedProfitPerHour - getRankedProfitPerHour(row);
  const item = allItemsDb?.[activeRow.name];
  const market = marketData?.[activeRow.name] || {};

  const baseSale = useMemo(
    () => getPrice(row.name, marketData, allItemsDb, preferences.customPrices),
    [allItemsDb, marketData, preferences.customPrices, row.name],
  );

  const canTrySellPrice = item ? item.is_tradeable !== false && !/\(Untradable\)$/i.test(activeRow.name) : !/\(Untradable\)$/i.test(activeRow.name);
  const currentTrySellPrice = scenarioPrices[activeRow.name] ?? "";
  const taxMultiplier = 1 - taxRate / 100;
  const totalCostPerAction = activeRow.inputCost + essenceCostPerAction;
  const breakEvenGrossSellPrice = targetNeedsEssencePrice
    ? null
    : canTrySellPrice && taxMultiplier > 0
      ? Math.ceil(totalCostPerAction / taxMultiplier)
      : Math.ceil(totalCostPerAction);
  const targetGrossSellPrice = targetPerAction !== null && canTrySellPrice && taxMultiplier > 0
    ? Math.ceil((activeRow.inputCost + targetPerAction) / taxMultiplier)
    : null;

  const hasMarketRevenue = activeRow.marketRevenue > 0;
  const grossRevenue = activeRow.bestSaleSource !== "vendor" && activeRow.salePrice > 0
    ? activeRow.salePrice
    : hasMarketRevenue
      ? Math.round(activeRow.marketRevenue / (1 - taxRate / 100))
      : 0;
  const taxPaid = hasMarketRevenue ? Math.max(0, grossRevenue - activeRow.marketRevenue) : 0;

  const itemStats = item?.stats && typeof item.stats === "object" ? Object.entries(item.stats).filter(([, value]) => value !== null && value !== 0 && value !== "") : [];
  const itemRequirements = item?.requirements && typeof item.requirements === "object" ? Object.entries(item.requirements).filter(([, value]) => value !== null && value !== "") : [];
  const itemEffects = item?.effects
    ? Array.isArray(item.effects)
      ? item.effects.map((effect: any, index: number) => formatEffectEntry(effect, index))
      : Object.entries(item.effects)
        .filter(([, value]) => value !== null && value !== "")
        .map(([key, value]) => [formatType(key), stringifyDetail(value)] as [string, string])
    : [];

  const restorationEntries = [
    ["Health", item?.health_restore ? `+${item.health_restore}` : "0"],
    ["Hunger", item?.hunger_restore ? `+${item.hunger_restore}` : "0"],
  ].filter(([, value]) => value !== "0") as Array<[string, string]>;
  const findSources = Array.isArray(item?.where_to_find) ? item.where_to_find.filter(Boolean).slice(0, 4) : [];

  const dialogRef = useModalA11y<HTMLDivElement>(true, onClose);

  return (
    <div className="modal-overlay skill-profit-strategy-overlay" onClick={onClose}>
      <div
        aria-labelledby="skill-strategy-title"
        aria-modal="true"
        className={`modal-content ${styles.strategyModalContent}`}
        onClick={(event) => event.stopPropagation()}
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
      >
        <div className="modal-header">
          <h2 id="skill-strategy-title">{activeRow.name} Strategy</h2>
          <button aria-label="Close skill strategy" className="close-btn" onClick={onClose} type="button"><X size={20} /></button>
        </div>
        <div className="modal-body">
          <div className={styles.modalGrid}>
            <section className={styles.modalPanel}>
              <div className={styles.modalPanelTitle}><PackageSearch size={16} /> Pricing & Inputs</div>
              <div className={styles.tryPriceHeader}>
                <div>
                  <strong>Try Buy & Sell Prices</strong>
                  <span>Test market sell price and bulk-buy prices without changing your saved custom prices.</span>
                </div>
                <small>
                  {canTrySellPrice ? "1 output" : "Fixed output"}
                  {editableInputCount > 0 ? ` + ${editableInputCount} material${editableInputCount === 1 ? "" : "s"}` : ""}
                </small>
              </div>
              {hasScenarioPrices && (
                <div className={styles.tryPriceSummary}>
                  <div>
                    <span>With try prices</span>
                    <strong className={displayProfitPerHour === null ? styles.mutedValue : rankedProfitPerHour >= 0 ? styles.goodValue : styles.badValue}>
                      {displayProfitPerHour === null ? "Needs price/data" : `${formatGold(displayProfitPerHour)}g/hr`}
                    </strong>
                  </div>
                  <div>
                    <span>Change</span>
                    <strong className={profitPerHourDelta === null ? styles.mutedValue : profitPerHourDelta >= 0 ? styles.goodValue : styles.badValue}>
                      {profitPerHourDelta === null ? "Needs price/data" : `${formatSignedGold(profitPerHourDelta)}/hr`}
                    </strong>
                  </div>
                  <div>
                    <span>Profit each</span>
                    <strong className={activeRow.profitEach >= 0 ? styles.goodValue : styles.badValue}>{formatSignedGold(activeRow.profitEach)}</strong>
                  </div>
                </div>
              )}
              <div className={styles.materialList}>
                <div className={styles.materialScenario}>
                  <button
                    className={styles.materialLine}
                    onClick={() => onOpenItem(activeRow.name)}
                    type="button"
                  >
                    <span className={styles.materialName}>
                      <strong>1x {activeRow.name} (Output)</strong>
                      <small>Current {formatGold(baseSale.value)}g ea - {formatPriceSource(baseSale.source)}</small>
                    </span>
                    <strong>{formatGold(activeRow.netRevenue)}g net</strong>
                  </button>
                  {canTrySellPrice ? (
                    <div className={styles.tryPriceGrid}>
                      <label className={styles.scenarioInput}>
                        <span>Try sell price</span>
                        <input
                          aria-label={`Try sell price for ${activeRow.name}`}
                          inputMode="numeric"
                          min={0}
                          placeholder={`${formatGold(baseSale.value)}g`}
                          type="number"
                          value={currentTrySellPrice}
                          onChange={(event) => {
                            const value = event.target.value;
                            setScenarioSaved(false);
                            setScenarioPrices((current) => {
                              const next = { ...current };
                              if (value === "") delete next[activeRow.name];
                              else next[activeRow.name] = value;
                              return next;
                            });
                          }}
                        />
                      </label>
                      <div className={styles.breakEvenLine}>
                        <span>Break-even</span>
                        <strong className={breakEvenGrossSellPrice !== null && breakEvenGrossSellPrice > 0 ? styles.goodValue : styles.badValue}>
                          {breakEvenGrossSellPrice === null
                            ? "Needs essence price"
                            : breakEvenGrossSellPrice > 0
                              ? `${formatGold(breakEvenGrossSellPrice)}g gross`
                              : "0g (Free)"}
                        </strong>
                      </div>
                      {targetGrossSellPrice !== null ? (
                        <div className={styles.breakEvenLine}>
                          <span>For target</span>
                          <strong className={targetGrossSellPrice > 0 ? styles.goodValue : styles.badValue}>
                            {targetGrossSellPrice > 0 ? `${formatGold(targetGrossSellPrice)}g gross` : "Not possible"}
                          </strong>
                        </div>
                      ) : (
                        <div className={styles.breakEvenLine}>
                          <span>Net after tax</span>
                          <strong>{formatGold(activeRow.netRevenue)}g</strong>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className={styles.fixedPriceNote}>Untradable item (Vendor only)</div>
                  )}
                </div>
                {activeRow.ingredients.length === 0 ? (
                  <div className={styles.materialLine}>
                    <span>Zero input</span>
                    <strong>0g</strong>
                  </div>
                ) : activeRow.ingredientCosts.map((ingredient) => {
                  const baseIngredient = baseIngredientCosts.get(ingredient.name) || ingredient;
                  const canTryBuyPrice = !isFixedBuyPriceItem(ingredient.name) && ingredient.source !== "vendor";
                  const otherInputCost = activeRow.inputCost - ingredient.unitPrice * ingredient.quantity;
                  const maxUnitForBreakEven = targetNeedsEssencePrice
                    ? null
                    : Math.floor((activeRow.netRevenue - otherInputCost - essenceCostPerAction) / Math.max(ingredient.quantity, 1));
                  const maxUnitForTarget = targetPerAction === null
                    ? null
                    : Math.floor((activeRow.netRevenue - otherInputCost - targetPerAction) / Math.max(ingredient.quantity, 1));
                  const currentTryPrice = scenarioPrices[ingredient.name] ?? "";
                  return (
                    <div className={styles.materialScenario} key={ingredient.name}>
                      <button
                        className={styles.materialLine}
                        onClick={() => onOpenItem(ingredient.name)}
                        type="button"
                      >
                        <span className={styles.materialName}>
                          <strong>{ingredient.quantity}x {ingredient.name}</strong>
                          <small>Current {formatGold(baseIngredient.unitPrice)}g ea - {formatPriceSource(baseIngredient.source)}</small>
                        </span>
                        <strong>{formatGold(ingredient.totalPrice)}g</strong>
                      </button>
                      {canTryBuyPrice ? (
                        <div className={styles.tryPriceGrid}>
                          <label className={styles.scenarioInput}>
                            <span>Try buy price</span>
                            <input
                              aria-label={`Try buy price for ${ingredient.name}`}
                              inputMode="numeric"
                              min={0}
                              placeholder={`${formatGold(baseIngredient.unitPrice)}g`}
                              type="number"
                              value={currentTryPrice}
                              onChange={(event) => {
                                const value = event.target.value;
                                setScenarioSaved(false);
                                setScenarioPrices((current) => {
                                  const next = { ...current };
                                  if (value === "") delete next[ingredient.name];
                                  else next[ingredient.name] = value;
                                  return next;
                                });
                              }}
                            />
                          </label>
                          <div className={styles.breakEvenLine}>
                            <span>Break-even</span>
                            <strong>
                              {maxUnitForBreakEven === null
                                ? "Needs essence price"
                                : maxUnitForBreakEven > 0 ? `${formatGold(maxUnitForBreakEven)}g ea` : "Not profitable"}
                            </strong>
                          </div>
                          {maxUnitForTarget !== null && (
                            <div className={styles.breakEvenLine}>
                              <span>Max for target</span>
                              <strong>{maxUnitForTarget > 0 ? `${formatGold(maxUnitForTarget)}g ea` : "Not possible"}</strong>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className={styles.fixedPriceNote}>Fixed vendor price</div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className={styles.modalTotal}>
                <span>Total input cost</span>
                <strong>{formatGold(activeRow.inputCost)}g</strong>
              </div>
              <label className={styles.targetProfitField}>
                <span>Target gold per hour</span>
                <input
                  aria-label="Target gold per hour"
                  inputMode="numeric"
                  min={0}
                  placeholder="Optional"
                  type="number"
                  value={targetGoldPerHour}
                  onChange={(event) => setTargetGoldPerHour(event.target.value)}
                />
              </label>
              {sharedInputs.length > 1 && (
                <div className={styles.sharedScenario}>
                  <div className={styles.sharedScenarioHeader}>
                    <div>
                      <strong>Combined material break-even</strong>
                      <span>Current editable input mix: {formatGold(sharedInputCost)}g</span>
                    </div>
                    <small>{sharedBreakEvenLabel}</small>
                  </div>
                  <div className={styles.sharedScenarioSummary}>
                    <div>
                      <span>Max combined cost</span>
                      <strong className={sharedBreakEvenBudget !== null && sharedBreakEvenBudget > 0 ? styles.goodValue : styles.badValue}>
                        {sharedBreakEvenBudget === null
                          ? "Needs essence price"
                          : sharedBreakEvenBudget > 0 ? `${formatGold(sharedBreakEvenBudget)}g` : "Not profitable"}
                      </strong>
                    </div>
                    <div>
                      <span>Target combined cost</span>
                      <strong className={sharedTargetBudget === null ? "" : sharedTargetBudget > 0 ? styles.goodValue : styles.badValue}>
                        {sharedTargetBudget === null
                          ? targetNeedsEssencePrice ? "Needs essence price" : "Set target"
                          : sharedTargetBudget > 0 ? `${formatGold(sharedTargetBudget)}g` : "Not possible"}
                      </strong>
                    </div>
                  </div>
                  <div className={styles.sharedScenarioGrid}>
                    {sharedInputs.map(({ ingredient }) => {
                      const breakEvenUnit = sharedBreakEvenRatio === null ? null : Math.floor(ingredient.unitPrice * sharedBreakEvenRatio);
                      const targetUnit = sharedTargetRatio === null ? null : Math.floor(ingredient.unitPrice * sharedTargetRatio);
                      return (
                        <div className={styles.breakEvenLine} key={ingredient.name}>
                          <span>{ingredient.name}</span>
                          <strong className={breakEvenUnit !== null && breakEvenUnit > 0 ? styles.goodValue : styles.badValue}>
                            {breakEvenUnit !== null && breakEvenUnit > 0 ? `${formatGold(breakEvenUnit)}g ea` : "No room"}
                          </strong>
                          {targetPerAction !== null && (
                            <em className={targetUnit !== null && targetUnit > 0 ? styles.goodValue : styles.badValue}>
                              Target {targetUnit !== null && targetUnit > 0 ? `${formatGold(targetUnit)}g ea` : "not possible"}
                            </em>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {targetNeedsEssencePrice && (
                <div className={styles.fixedPriceNote}>Set essence price to calculate profit target</div>
              )}
              {hasScenarioPrices && (
                <div className={styles.scenarioActions}>
                  <button type="button" onClick={() => setScenarioPrices({})}>Clear try prices</button>
                  <button
                    type="button"
                    onClick={() => {
                      setPreferences({
                        customPrices: {
                          ...preferences.customPrices,
                          ...Object.fromEntries(Object.entries(cleanScenarioPrices).map(([name, price]) => [name, Math.round(price)])),
                        },
                      });
                      setScenarioSaved(true);
                    }}
                  >
                    Save as custom prices
                  </button>
                  {scenarioSaved && <span className={styles.scenarioSaved}>Saved to custom prices</span>}
                </div>
              )}
              {activeRow.inputMissing.length > 0 && (
                <div className={styles.modalWarning}>Missing prices: {activeRow.inputMissing.join(", ")}</div>
              )}
            </section>

            <section className={styles.modalPanel}>
              <div className={styles.modalPanelTitle}><Info size={16} /> Calculation</div>
              <div className={styles.calcRows}>
                <CalcRow label={hasScenarioPrices ? "Try/market gross" : "Market gross"} value={hasMarketRevenue ? `${formatGold(grossRevenue)}g` : "No market"} muted={!hasMarketRevenue} />
                <CalcRow label={`Market tax (${taxRate}%)`} value={hasMarketRevenue ? `-${formatGold(taxPaid)}g` : "0g"} muted={!hasMarketRevenue} />
                <CalcRow label="Market net" value={`${formatGold(activeRow.marketRevenue)}g`} muted={activeRow.marketRevenue <= 0} />
                <CalcRow label="Vendor net" value={`${formatGold(activeRow.vendorRevenue)}g`} muted={activeRow.vendorRevenue <= 0} />
                <CalcRow label={(settings.saleMode || "best") === "best" ? "Best sell path" : "Selected sell path"} value={formatPriceSource(activeRow.bestSaleSource)} tone={activeRow.bestSaleSource === "vendor" ? "good" : undefined} />
                <CalcRow label="Net revenue used" value={`${formatGold(activeRow.netRevenue)}g`} />
                <CalcRow label="Input cost" value={`-${formatGold(activeRow.inputCost)}g`} />
                <CalcRow label="Profit each" value={`${activeRow.profitEach >= 0 ? "+" : ""}${formatGold(activeRow.profitEach)}g`} tone={activeRow.profitEach >= 0 ? "good" : "bad"} />
                <CalcRow label="Items per hour" value={activeRow.itemsPerHour.toLocaleString()} />
                {activeRow.housingWindowHours > 0 && (
                  <>
                    <CalcRow label={`${activeRow.skill} housing window`} value={`+${formatHours(activeRow.housingWindowHours)}`} />
                    <CalcRow label="Actions per housing window" value={activeRow.itemsPerHousingWindow.toLocaleString()} />
                    <CalcRow label="Gold per housing window" value={`${formatGold(activeRow.profitPerHousingWindow)}g`} tone={activeRow.profitPerHousingWindow >= 0 ? "good" : "bad"} />
                  </>
                )}
                {activeRow.toolBonus > 0 && <CalcRow label="Tool efficiency" value={`+${activeRow.toolBonus}%`} />}
                <CalcRow label={activeRow.essenceActive ? "Gross profit/hr (pre-essence)" : "Gold per hour"} value={`${formatGold(activeRow.profitPerHour)}g`} tone={activeRow.profitPerHour >= 0 ? "good" : "bad"} />
                {activeRow.essenceActive ? (
                  <>
                    <CalcRow label="Base route profit/hr" value={`${formatGold(baseRouteRow.profitPerHour)}g`} />
                    <CalcRow label="Essence effect" value={formatEssenceBuff({ efficiency: activeRow.essenceEfficiencyBonus, experience: activeRow.essenceExperienceBonus })} />
                    <CalcRow label="Idle action window" value={activeRow.essenceIdleActionHours > 0 ? formatHours(activeRow.essenceIdleActionHours) : "Profile needed"} muted={activeRow.essenceIdleActionHours <= 0} />
                    <CalcRow label="Cost per start" value={activeRow.essenceNeedsPrice ? "Needs price/data" : `${formatGold(activeRow.essenceCostPerStart)}g`} muted={activeRow.essenceNeedsPrice} />
                    <CalcRow label="Cost per hour" value={activeRow.essenceCostPerHour === null ? "Needs price/data" : `${formatGold(activeRow.essenceCostPerHour)}g`} muted={activeRow.essenceCostPerHour === null} />
                    <CalcRow
                      label="Profit with essence"
                      value={activeRow.profitWithEssencePerHour === null ? "Needs price/data" : `${formatGold(activeRow.profitWithEssencePerHour)}g`}
                      tone={activeRow.profitWithEssencePerHour === null ? undefined : activeRow.profitWithEssencePerHour >= 0 ? "good" : "bad"}
                      muted={activeRow.profitWithEssencePerHour === null}
                    />
                  </>
                ) : (
                  <CalcRow label="Essence" value="None" muted />
                )}
                <CalcRow label="EXP per second" value={activeRow.expPerSecond === null ? "Unknown" : activeRow.expPerSecond.toFixed(2)} muted={activeRow.expPerSecond === null} />
                <CalcRow label="Stable volume" value={activeRow.stableVolume3d.toLocaleString()} />
                <CalcRow label="Raw 3-day volume" value={activeRow.volume3d.toLocaleString()} muted={activeRow.stableVolume3d === activeRow.volume3d} />
                <CalcRow label="Liquidity" value={activeRow.liquidityLabel} muted={!activeRow.liquidityRisk && activeRow.liquidityLabel === "No market"} />
                {activeRow.liquidityRisk && <CalcRow label="Market caution" value={activeRow.liquidityNote} muted />}
                {activeRow.priceSwingRisk && <CalcRow label="Price caution" value={activeRow.priceSwingNote} muted />}
              </div>
              <div className={styles.formula}>
                {activeRow.essenceActive && activeRow.profitWithEssencePerHour !== null
                  ? `(${formatGold(activeRow.netRevenue)}g net - ${formatGold(activeRow.inputCost)}g input) x ${activeRow.itemsPerHour.toLocaleString()} actions/hr - ${formatGold(activeRow.essenceCostPerHour || 0)}g essence/hr = ${formatGold(activeRow.profitWithEssencePerHour)}g/hr`
                  : activeRow.essenceActive
                    ? `Base route is ${formatGold(baseRouteRow.profitPerHour)}g/hr. Profit with essence needs price/data before it can be ranked.`
                  : `(${formatGold(activeRow.netRevenue)}g net - ${formatGold(activeRow.inputCost)}g input) x ${activeRow.itemsPerHour.toLocaleString()} actions/hr = ${formatGold(activeRow.profitPerHour)}g/hr`}
              </div>
              <button className={styles.openItemButton} onClick={() => onOpenItem(activeRow.name)} type="button">
                Open item database details
              </button>
            </section>

            <section className={`${styles.modalPanel} ${styles.itemDetailsPanel}`}>
              <div className={styles.modalPanelTitle}><Eye size={16} /> Result Item Details</div>
              <div className={styles.itemDetailHeader}>
                {item?.image_url && <img src={item.image_url} alt="" />}
                <div>
                  <strong>{activeRow.name}</strong>
                  <span>{item?.description || activeRow.note || "No item description available in the local database."}</span>
                </div>
              </div>
              <div className={styles.detailGrid}>
                <DetailPill label="Skill" value={activeRow.skill} />
                <DetailPill label="Level" value={activeRow.level.toLocaleString()} />
                <DetailPill label="Base Time" value={`${formatNumber(activeRow.baseDuration)}s`} />
                <DetailPill label="Final Time" value={`${formatNumber(activeRow.finalDuration)}s`} />
                <DetailPill label="Base EXP" value={formatOptionalNumber(activeRow.experience)} muted={activeRow.experience === null} />
                <DetailPill label="EXP/hr" value={formatOptionalNumber(activeRow.expPerHour)} muted={activeRow.expPerHour === null} />
                <DetailPill label="Type" value={formatType(item?.type)} muted={!item?.type} />
                <DetailPill label="Quality" value={formatType(item?.quality)} muted={!item?.quality}>
                  {item?.quality ? <QualityText value={item.quality}>{formatType(item.quality)}</QualityText> : undefined}
                </DetailPill>
                <DetailPill label="Tradeable" value={item ? (item.is_tradeable ? "Yes" : "No") : "Unknown"} muted={!item} />
                <DetailPill label="Vendor Base" value={item?.vendor_price ? `${formatGold(item.vendor_price)}g` : "None"} muted={!item?.vendor_price} />
                <DetailPill label="3d Avg" value={market?.avg_3 ? `${formatGold(market.avg_3)}g` : "No data"} muted={!market?.avg_3} />
                <DetailPill label="7d Avg" value={market?.avg_7 ? `${formatGold(market.avg_7)}g` : "No data"} muted={!market?.avg_7} />
                <DetailPill label="30d Avg" value={market?.avg_30 ? `${formatGold(market.avg_30)}g` : "No data"} muted={!market?.avg_30} />
                <DetailPill label="Stable Volume" value={activeRow.stableVolume3d.toLocaleString()} muted={activeRow.stableVolume3d <= 0} />
                <DetailPill label="Raw 3d Volume" value={activeRow.volume3d.toLocaleString()} muted={activeRow.stableVolume3d === activeRow.volume3d} />
              </div>

              {(itemRequirements.length > 0 || itemStats.length > 0 || itemEffects.length > 0 || findSources.length > 0 || item?.health_restore || item?.hunger_restore) && (
                <div className={styles.extraDetailGrid}>
                  {itemRequirements.length > 0 && <DetailList title="Requirements" entries={itemRequirements} />}
                  {itemStats.length > 0 && <DetailList title="Stats" entries={itemStats} />}
                  {itemEffects.length > 0 && <DetailList title="Effects" entries={itemEffects} />}
                  {(item?.health_restore || item?.hunger_restore) && (
                    <DetailList
                      title="Restoration"
                      entries={restorationEntries}
                    />
                  )}
                  {findSources.length > 0 && (
                    <DetailList
                      title="Where To Find"
                      entries={findSources.map((source: any, index: number) => [
                        source?.type || source?.name || `Source ${index + 1}`,
                        source?.name || source?.location || stringifyDetail(source),
                      ])}
                    />
                  )}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

// Re-export with legacy alias for backward compatibility
export const SkillStrategyModal = SkillProfitStrategyModal;
