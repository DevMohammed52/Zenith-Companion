"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { GameImage } from "@/components/GameImage";
import { GoldIcon } from "@/components/GoldIcon";
import {
  Badge,
  Banner,
  Button,
  Icon,
  ModalSheet,
  Tab,
  TabList,
  TabPanel,
  Tabs,
} from "@/components/ui";
import QualityText from "@/components/QualityText";
import { useData } from "@/context/DataContext";
import { formatEssenceBuff } from "@/lib/essences";
import { formatGold } from "@/lib/format";
import { formatHours } from "@/lib/housing";
import { usePreferences } from "@/lib/preferences";
import {
  calculateSkillProfitRow,
  getPrice,
  isFixedBuyPriceItem,
  type SkillName,
  type SkillProfitRow,
  type SkillProfitSettings,
} from "@/lib/skill-profit";
import styles from "../page.module.css";
import { CalcRow, DetailList, DetailPill, Metric } from "./SkillProfitControls";
import {
  formatDurationSeconds,
  formatEffectEntry,
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

function extractFindSources(whereToFind: unknown): Array<[string, string]> {
  if (!whereToFind) return [];
  if (Array.isArray(whereToFind)) {
    return whereToFind
      .filter(Boolean)
      .slice(0, 4)
      .map((source: any, index) => [
        source?.type || source?.name || `Source ${index + 1}`,
        source?.name || source?.location || stringifyDetail(source),
      ]);
  }
  if (typeof whereToFind === "object") {
    const record = whereToFind as Record<string, unknown>;
    const rows: Array<[string, string]> = [];
    const groups: Array<[string, string]> = [
      ["enemies", "Enemy"],
      ["dungeons", "Dungeon"],
      ["world_bosses", "World Boss"],
    ];
    for (const [key, label] of groups) {
      const list = Array.isArray(record[key]) ? (record[key] as Array<any>) : [];
      for (const entry of list) {
        if (!entry) continue;
        const name = entry.name || entry.location || stringifyDetail(entry);
        const suffix = entry.level ? ` (Lv ${entry.level})` : "";
        rows.push([label, `${name}${suffix}`]);
        if (rows.length >= 4) return rows;
      }
    }
    return rows;
  }
  return [];
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
    () =>
      calculateSkillProfitRow(row, marketData, allItemsDb, {
        ...settingsWithoutRowEssence,
        scenarioPrices: cleanScenarioPrices,
      }),
    [allItemsDb, cleanScenarioPrices, marketData, row, settingsWithoutRowEssence],
  );

  const activeRow = useMemo(
    () =>
      calculateSkillProfitRow(row, marketData, allItemsDb, {
        ...settings,
        scenarioPrices: cleanScenarioPrices,
      }),
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
  const essenceCostPerAction =
    activeRow.essenceActive && activeRow.essenceCostPerHour !== null
      ? activeRow.essenceCostPerHour / actionRate
      : 0;
  const targetPerAction =
    !targetNeedsEssencePrice && Number.isFinite(target) && target > 0
      ? (target + (activeRow.essenceActive ? activeRow.essenceCostPerHour || 0 : 0)) / actionRate
      : null;

  const editableInputCount = activeRow.ingredientCosts.filter(
    (ingredient) => !isFixedBuyPriceItem(ingredient.name) && ingredient.source !== "vendor",
  ).length;
  const sharedInputs = activeRow.ingredientCosts
    .map((ingredient) => ({
      ingredient,
      usedTotal: ingredient.unitPrice * ingredient.quantity,
    }))
    .filter(
      ({ ingredient, usedTotal }) =>
        !isFixedBuyPriceItem(ingredient.name) &&
        ingredient.source !== "vendor" &&
        ingredient.unitPrice > 0 &&
        usedTotal > 0,
    );

  const sharedInputCost = sharedInputs.reduce((sum, entry) => sum + entry.usedTotal, 0);
  const sharedFixedInputCost = activeRow.inputCost - sharedInputCost;
  const sharedBreakEvenBudget = targetNeedsEssencePrice
    ? null
    : activeRow.netRevenue - sharedFixedInputCost - essenceCostPerAction;
  const sharedTargetBudget =
    targetPerAction === null ? null : activeRow.netRevenue - sharedFixedInputCost - targetPerAction;
  const sharedBreakEvenRatio =
    sharedInputCost > 0 && sharedBreakEvenBudget !== null && sharedBreakEvenBudget > 0
      ? sharedBreakEvenBudget / sharedInputCost
      : null;
  const sharedTargetRatio =
    sharedInputCost > 0 && sharedTargetBudget !== null && sharedTargetBudget > 0
      ? sharedTargetBudget / sharedInputCost
      : null;
  const sharedBreakEvenLabel =
    sharedBreakEvenRatio === null
      ? targetNeedsEssencePrice
        ? "Needs price"
        : "No margin"
      : sharedBreakEvenRatio >= 1
        ? `+${Math.round((sharedBreakEvenRatio - 1) * 100)}% room`
        : `${Math.round((1 - sharedBreakEvenRatio) * 100)}% lower`;

  const displayProfitPerHour = getDisplayProfitPerHour(activeRow);
  const rankedProfitPerHour = getRankedProfitPerHour(activeRow);
  const changeNeedsPriceData =
    (row.essenceActive && row.essenceNeedsPrice) ||
    (activeRow.essenceActive && activeRow.essenceNeedsPrice);
  const profitPerHourDelta = changeNeedsPriceData
    ? null
    : rankedProfitPerHour - getRankedProfitPerHour(row);
  const item = allItemsDb?.[activeRow.name];
  const market = marketData?.[activeRow.name] || {};

  const baseSale = useMemo(
    () => getPrice(row.name, marketData, allItemsDb, preferences.customPrices),
    [allItemsDb, marketData, preferences.customPrices, row.name],
  );

  const canTrySellPrice = item
    ? item.is_tradeable !== false && !/\(Untradable\)$/i.test(activeRow.name)
    : !/\(Untradable\)$/i.test(activeRow.name);
  const currentTrySellPrice = scenarioPrices[activeRow.name] ?? "";
  const taxMultiplier = 1 - taxRate / 100;
  const totalCostPerAction = activeRow.inputCost + essenceCostPerAction;
  const breakEvenGrossSellPrice = targetNeedsEssencePrice
    ? null
    : canTrySellPrice && taxMultiplier > 0
      ? Math.ceil(totalCostPerAction / taxMultiplier)
      : Math.ceil(totalCostPerAction);
  const targetGrossSellPrice =
    targetPerAction !== null && canTrySellPrice && taxMultiplier > 0
      ? Math.ceil((activeRow.inputCost + targetPerAction) / taxMultiplier)
      : null;

  const hasMarketRevenue = activeRow.marketRevenue > 0;
  const grossRevenue =
    activeRow.bestSaleSource !== "vendor" && activeRow.salePrice > 0
      ? activeRow.salePrice
      : hasMarketRevenue
        ? Math.round(activeRow.marketRevenue / (1 - taxRate / 100))
        : 0;
  const taxPaid = hasMarketRevenue ? Math.max(0, grossRevenue - activeRow.marketRevenue) : 0;

  const itemStats =
    item?.stats && typeof item.stats === "object"
      ? Object.entries(item.stats).filter(([, value]) => value !== null && value !== 0 && value !== "")
      : [];
  const itemRequirements =
    item?.requirements && typeof item.requirements === "object"
      ? Object.entries(item.requirements).filter(([, value]) => value !== null && value !== "")
      : [];
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
  const findSourceEntries = useMemo(() => extractFindSources(item?.where_to_find), [item?.where_to_find]);

  const whatIfCount = Object.keys(cleanScenarioPrices).length;
  const durationLabel = formatDurationSeconds(activeRow.finalDuration);

  return (
    <ModalSheet
      isOpen
      onClose={onClose}
      title={activeRow.name}
      description={`${activeRow.skill} Lv ${activeRow.level} • ${durationLabel} per action (${activeRow.itemsPerHour.toLocaleString()}/hr)`}
      maxWidth="xl"
    >
      <div className={styles.modalBodyStack}>
        <section className={styles.modalHeroCard} aria-label="Route summary">
          <div className={styles.modalHeroTop}>
            <div className={styles.modalHeroMain}>
              <span className={styles.modalHeroThumb} aria-hidden="true">
                <GameImage
                  src={item?.image_url}
                  alt=""
                  width={40}
                  height={40}
                  sizes="40px"
                  fallback={<Icon name="items" size="sm" />}
                />
              </span>
              <div className={styles.modalHeroInfo}>
                <div className={styles.modalHeroBadges}>
                  <Badge size="sm" variant="neutral">
                    {activeRow.skill} Lv {activeRow.level}
                  </Badge>
                  {item?.quality && (
                    <Badge size="sm" variant="neutral">
                      <QualityText value={item.quality}>{formatType(item.quality)}</QualityText>
                    </Badge>
                  )}
                  <Badge
                    size="sm"
                    variant={
                      activeRow.bestSaleSource === "vendor"
                        ? "success"
                        : activeRow.bestSaleSource === "missing"
                          ? "warning"
                          : "neutral"
                    }
                  >
                    {formatPriceSource(activeRow.bestSaleSource)} sell
                  </Badge>
                </div>
                <span className={styles.modalHeroMeta}>
                  {activeRow.note || `Base ${formatDurationSeconds(activeRow.baseDuration)} -> Final ${durationLabel}`}
                </span>
              </div>
            </div>

            <div className={styles.modalActionRow}>
              <Button
                variant="secondary"
                size="sm"
                icon={<Icon name="externalLink" size="xs" aria-hidden="true" />}
                onClick={() => onOpenItem(activeRow.name)}
              >
                Item DB
              </Button>
              {activeRow.skill === "Alchemy" && (
                <Link href="/alchemy" className={styles.forgeLink} onClick={onClose}>
                  <span>Alchemy</span>
                  <Icon name="arrowRight" size="xs" aria-hidden="true" />
                </Link>
              )}
            </div>
          </div>

          <div className={styles.statStrip}>
            <Metric
              label={hasScenarioPrices ? "Try Profit/hr" : "Gold / hr"}
              value={displayProfitPerHour === null ? "Needs price" : `${formatGold(displayProfitPerHour)}g`}
              sub={activeRow.essenceActive ? "After essence" : `${activeRow.itemsPerHour.toLocaleString()} actions/hr`}
            />
            <Metric
              label="Profit Each"
              value={formatSignedGold(activeRow.profitEach)}
              sub={`Net ${formatGold(activeRow.netRevenue)}g`}
            />
            <Metric
              label="Input Cost"
              value={`${formatGold(activeRow.inputCost)}g`}
              sub={`${activeRow.ingredients.length} ingredient${activeRow.ingredients.length === 1 ? "" : "s"}`}
            />
            <Metric
              label="EXP / hr"
              value={formatOptionalNumber(activeRow.expPerHour)}
              sub={activeRow.expPerSecond !== null ? `${activeRow.expPerSecond.toFixed(2)} EXP/s` : "No EXP data"}
            />
          </div>
        </section>

        <Tabs defaultValue="breakdown" variant="pill">
          <TabList aria-label="Skill strategy sections">
            <Tab value="breakdown">Breakdown</Tab>
            <Tab value="scenario" badge={whatIfCount > 0 ? whatIfCount : undefined}>
              What-If Prices
            </Tab>
            <Tab value="item">Item &amp; Sources</Tab>
          </TabList>

          <TabPanel value="breakdown">
            <div className={styles.modalTabBody}>
              {(activeRow.inputMissing.length > 0 || activeRow.liquidityRisk || activeRow.priceSwingRisk) && (
                <Banner variant="warning">
                  {[
                    activeRow.inputMissing.length > 0 ? `Missing prices: ${activeRow.inputMissing.join(", ")}` : "",
                    activeRow.liquidityRisk ? activeRow.liquidityNote : "",
                    activeRow.priceSwingRisk ? activeRow.priceSwingNote : "",
                  ]
                    .filter(Boolean)
                    .join(" • ")}
                </Banner>
              )}

              <div className={styles.modalGrid}>
                <section className={styles.modalPanel} aria-label="Revenue and profit calculation">
                  <div className={styles.modalPanelTitle}>
                    <Icon name="info" size="sm" aria-hidden="true" />
                    <span>Revenue &amp; Margin</span>
                  </div>
                  <div className={styles.calcRows}>
                    <CalcRow
                      label={hasScenarioPrices ? "Try/market gross" : "Market gross"}
                      value={hasMarketRevenue ? `${formatGold(grossRevenue)}g` : "No market"}
                      muted={!hasMarketRevenue}
                    />
                    <CalcRow
                      label={`Market tax (${taxRate}%)`}
                      value={hasMarketRevenue ? `-${formatGold(taxPaid)}g` : "0g"}
                      muted={!hasMarketRevenue}
                    />
                    <CalcRow
                      label="Market net"
                      value={`${formatGold(activeRow.marketRevenue)}g`}
                      muted={activeRow.marketRevenue <= 0}
                    />
                    <CalcRow
                      label="Vendor net"
                      value={`${formatGold(activeRow.vendorRevenue)}g`}
                      muted={activeRow.vendorRevenue <= 0}
                    />
                    <CalcRow
                      label={(settings.saleMode || "best") === "best" ? "Best sell path" : "Selected sell path"}
                      value={formatPriceSource(activeRow.bestSaleSource)}
                      tone={activeRow.bestSaleSource === "vendor" ? "good" : undefined}
                    />
                    <CalcRow label="Net revenue used" value={`${formatGold(activeRow.netRevenue)}g`} />
                    <CalcRow label="Input cost" value={`-${formatGold(activeRow.inputCost)}g`} />
                    <CalcRow
                      label="Profit each"
                      value={formatSignedGold(activeRow.profitEach)}
                      tone={activeRow.profitEach >= 0 ? "good" : "bad"}
                    />
                    <CalcRow
                      label={activeRow.essenceActive ? "Gross profit/hr (pre-essence)" : "Gold per hour"}
                      value={`${formatGold(activeRow.profitPerHour)}g`}
                      tone={activeRow.profitPerHour >= 0 ? "good" : "bad"}
                    />
                    {activeRow.essenceActive && (
                      <>
                        <CalcRow label="Base route profit/hr" value={`${formatGold(baseRouteRow.profitPerHour)}g`} />
                        <CalcRow
                          label="Essence effect"
                          value={formatEssenceBuff({
                            efficiency: activeRow.essenceEfficiencyBonus,
                            experience: activeRow.essenceExperienceBonus,
                          })}
                        />
                        <CalcRow
                          label="Cost per start / hr"
                          value={
                            activeRow.essenceNeedsPrice
                              ? "Needs price"
                              : `${formatGold(activeRow.essenceCostPerStart)}g / ${formatGold(activeRow.essenceCostPerHour || 0)}g`
                          }
                          muted={activeRow.essenceNeedsPrice}
                        />
                        <CalcRow
                          label="Net with essence"
                          value={
                            activeRow.profitWithEssencePerHour === null
                              ? "Needs price/data"
                              : `${formatGold(activeRow.profitWithEssencePerHour)}g`
                          }
                          tone={
                            activeRow.profitWithEssencePerHour === null
                              ? undefined
                              : activeRow.profitWithEssencePerHour >= 0
                                ? "good"
                                : "bad"
                          }
                          muted={activeRow.profitWithEssencePerHour === null}
                        />
                      </>
                    )}
                  </div>

                  <div className={styles.formula}>
                    {activeRow.essenceActive && activeRow.profitWithEssencePerHour !== null
                      ? `(${formatGold(activeRow.netRevenue)}g net - ${formatGold(activeRow.inputCost)}g input) x ${activeRow.itemsPerHour.toLocaleString()}/hr - ${formatGold(activeRow.essenceCostPerHour || 0)}g essence = ${formatGold(activeRow.profitWithEssencePerHour)}g/hr`
                      : activeRow.essenceActive
                        ? `Base route is ${formatGold(baseRouteRow.profitPerHour)}g/hr. Set an essence price to rank net yield.`
                        : `(${formatGold(activeRow.netRevenue)}g net - ${formatGold(activeRow.inputCost)}g input) x ${activeRow.itemsPerHour.toLocaleString()}/hr = ${formatGold(activeRow.profitPerHour)}g/hr`}
                  </div>
                </section>

                <section className={styles.modalPanel} aria-label="Materials and speed breakdown">
                  <div className={styles.modalPanelTitle}>
                    <Icon name="items" size="sm" aria-hidden="true" />
                    <span>Materials &amp; Speed</span>
                  </div>

                  <div className={styles.materialList}>
                    {activeRow.ingredients.length === 0 ? (
                      <div className={styles.materialLine}>
                        <span>Zero material cost</span>
                        <strong>0g</strong>
                      </div>
                    ) : (
                      activeRow.ingredientCosts.map((ingredient) => {
                        const ingredientImg = allItemsDb?.[ingredient.name]?.image_url;
                        return (
                          <button
                            className={styles.materialLine}
                            key={ingredient.name}
                            onClick={() => onOpenItem(ingredient.name)}
                            type="button"
                          >
                            <span className={styles.materialMain}>
                              <span className={styles.materialThumb} aria-hidden="true">
                                <GameImage
                                  src={ingredientImg}
                                  alt=""
                                  width={24}
                                  height={24}
                                  sizes="24px"
                                  fallback={<Icon name="items" size="xs" />}
                                />
                              </span>
                              <span className={styles.materialName}>
                                <strong>
                                  {ingredient.quantity}x {ingredient.name}
                                </strong>
                                <small>
                                  {formatGold(ingredient.unitPrice)}g ea • {formatPriceSource(ingredient.source)}
                                </small>
                              </span>
                            </span>
                            <strong className={styles.currencyReadout}>
                              <GoldIcon size={12} />
                              <span>{formatGold(ingredient.totalPrice)}g</span>
                            </strong>
                          </button>
                        );
                      })
                    )}
                  </div>

                  <div className={styles.modalTotal}>
                    <span>Total input cost</span>
                    <strong className={styles.currencyReadout}>
                      <GoldIcon size={12} />
                      <span>{formatGold(activeRow.inputCost)}g</span>
                    </strong>
                  </div>

                  <div className={styles.calcRows}>
                    <CalcRow label="Final action time" value={durationLabel} />
                    <CalcRow label="Actions per hour" value={activeRow.itemsPerHour.toLocaleString()} />
                    {activeRow.toolBonus > 0 && <CalcRow label="Tool efficiency" value={`+${activeRow.toolBonus}%`} />}
                    {activeRow.housingWindowHours > 0 && (
                      <>
                        <CalcRow label="Housing bonus" value={`+${formatHours(activeRow.housingWindowHours)}`} />
                        <CalcRow
                          label="Gold during housing bonus"
                          value={`${formatGold(activeRow.profitPerHousingWindow)}g`}
                          tone={activeRow.profitPerHousingWindow >= 0 ? "good" : "bad"}
                        />
                      </>
                    )}
                    <CalcRow label="Stable 3d volume" value={activeRow.stableVolume3d.toLocaleString()} />
                    <CalcRow
                      label="Raw 3d volume"
                      value={activeRow.volume3d.toLocaleString()}
                      muted={activeRow.stableVolume3d === activeRow.volume3d}
                    />
                  </div>
                </section>
              </div>
            </div>
          </TabPanel>

          <TabPanel value="scenario">
            <div className={styles.modalTabBody}>
              <div className={styles.tryPriceHeader}>
                <div>
                  <strong>Try Buy &amp; Sell Prices</strong>
                  <span>
                    Test market sell prices and bulk-buy material costs safely without overwriting saved custom prices.
                  </span>
                </div>
                <small>
                  {canTrySellPrice ? "1 output" : "Fixed output"}
                  {editableInputCount > 0 ? ` + ${editableInputCount} material${editableInputCount === 1 ? "" : "s"}` : ""}
                </small>
              </div>

              {hasScenarioPrices && (
                <div className={styles.tryPriceSummary}>
                  <div className={styles.tryPriceSummaryCell}>
                    <span>With try prices</span>
                    <strong
                      className={
                        displayProfitPerHour === null
                          ? styles.mutedValue
                          : rankedProfitPerHour >= 0
                            ? styles.goodValue
                            : styles.badValue
                      }
                    >
                      {displayProfitPerHour === null ? "Needs price/data" : `${formatGold(displayProfitPerHour)}g/hr`}
                    </strong>
                  </div>
                  <div className={styles.tryPriceSummaryCell}>
                    <span>Change</span>
                    <strong
                      className={
                        profitPerHourDelta === null
                          ? styles.mutedValue
                          : profitPerHourDelta >= 0
                            ? styles.goodValue
                            : styles.badValue
                      }
                    >
                      {profitPerHourDelta === null ? "Needs price/data" : `${formatSignedGold(profitPerHourDelta)}/hr`}
                    </strong>
                  </div>
                  <div className={styles.tryPriceSummaryCell}>
                    <span>Profit each</span>
                    <strong className={activeRow.profitEach >= 0 ? styles.goodValue : styles.badValue}>
                      {formatSignedGold(activeRow.profitEach)}
                    </strong>
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
                    <span className={styles.materialMain}>
                      <span className={styles.materialThumb} aria-hidden="true">
                        <GameImage
                          src={item?.image_url}
                          alt=""
                          width={24}
                          height={24}
                          sizes="24px"
                          fallback={<Icon name="items" size="xs" />}
                        />
                      </span>
                      <span className={styles.materialName}>
                        <strong>1x {activeRow.name} (Output)</strong>
                        <small>
                          Current {formatGold(baseSale.value)}g ea - {formatPriceSource(baseSale.source)}
                        </small>
                      </span>
                    </span>
                    <strong className={styles.currencyReadout}>
                      <GoldIcon size={12} />
                      <span>{formatGold(activeRow.netRevenue)}g net</span>
                    </strong>
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

                {activeRow.ingredientCosts.map((ingredient) => {
                  const baseIngredient = baseIngredientCosts.get(ingredient.name) || ingredient;
                  const ingredientImg = allItemsDb?.[ingredient.name]?.image_url;
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
                        <span className={styles.materialMain}>
                          <span className={styles.materialThumb} aria-hidden="true">
                            <GameImage
                              src={ingredientImg}
                              alt=""
                              width={24}
                              height={24}
                              sizes="24px"
                              fallback={<Icon name="items" size="xs" />}
                            />
                          </span>
                          <span className={styles.materialName}>
                            <strong>{ingredient.quantity}x {ingredient.name}</strong>
                            <small>Current {formatGold(baseIngredient.unitPrice)}g ea - {formatPriceSource(baseIngredient.source)}</small>
                          </span>
                        </span>
                        <strong className={styles.currencyReadout}>
                          <GoldIcon size={12} />
                          <span>{formatGold(ingredient.totalPrice)}g</span>
                        </strong>
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
                                : maxUnitForBreakEven > 0
                                  ? `${formatGold(maxUnitForBreakEven)}g ea`
                                  : "Not profitable"}
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
                          : sharedBreakEvenBudget > 0
                            ? `${formatGold(sharedBreakEvenBudget)}g`
                            : "Not profitable"}
                      </strong>
                    </div>
                    <div>
                      <span>Target combined cost</span>
                      <strong className={sharedTargetBudget === null ? "" : sharedTargetBudget > 0 ? styles.goodValue : styles.badValue}>
                        {sharedTargetBudget === null
                          ? targetNeedsEssencePrice
                            ? "Needs essence price"
                            : "Set target"
                          : sharedTargetBudget > 0
                            ? `${formatGold(sharedTargetBudget)}g`
                            : "Not possible"}
                      </strong>
                    </div>
                  </div>
                  <div className={styles.sharedScenarioGrid}>
                    {sharedInputs.map(({ ingredient }) => {
                      const breakEvenUnit =
                        sharedBreakEvenRatio === null ? null : Math.floor(ingredient.unitPrice * sharedBreakEvenRatio);
                      const targetUnit =
                        sharedTargetRatio === null ? null : Math.floor(ingredient.unitPrice * sharedTargetRatio);
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
                  <Button variant="ghost" size="sm" onClick={() => setScenarioPrices({})}>
                    Clear try prices
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setPreferences({
                        customPrices: {
                          ...preferences.customPrices,
                          ...Object.fromEntries(
                            Object.entries(cleanScenarioPrices).map(([name, price]) => [name, Math.round(price)]),
                          ),
                        },
                      });
                      setScenarioSaved(true);
                    }}
                  >
                    Save as custom prices
                  </Button>
                  {scenarioSaved && <span className={styles.scenarioSaved}>Saved to custom prices</span>}
                </div>
              )}
            </div>
          </TabPanel>

          <TabPanel value="item">
            <div className={styles.modalTabBody}>
              <div className={styles.itemDetailHeader}>
                <span className={styles.itemDetailThumb} aria-hidden="true">
                  <GameImage
                    src={item?.image_url}
                    alt=""
                    width={38}
                    height={38}
                    sizes="38px"
                    fallback={<Icon name="items" size="sm" />}
                  />
                </span>
                <div>
                  <strong>{activeRow.name}</strong>
                  <span>{item?.description || activeRow.note || "No item description available in the local database."}</span>
                </div>
              </div>

              <div className={styles.detailGrid}>
                <DetailPill label="Base Time" value={formatDurationSeconds(activeRow.baseDuration)} />
                <DetailPill label="Final Time" value={durationLabel} />
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
                <DetailPill label="Stable Vol" value={activeRow.stableVolume3d.toLocaleString()} muted={activeRow.stableVolume3d <= 0} />
                <DetailPill label="Raw 3d Vol" value={activeRow.volume3d.toLocaleString()} muted={activeRow.stableVolume3d === activeRow.volume3d} />
              </div>

              {(itemRequirements.length > 0 ||
                itemStats.length > 0 ||
                itemEffects.length > 0 ||
                findSourceEntries.length > 0 ||
                item?.health_restore ||
                item?.hunger_restore) && (
                <div className={styles.extraDetailGrid}>
                  {itemRequirements.length > 0 && <DetailList title="Requirements" entries={itemRequirements} />}
                  {itemStats.length > 0 && <DetailList title="Stats" entries={itemStats} />}
                  {itemEffects.length > 0 && <DetailList title="Effects" entries={itemEffects} />}
                  {(item?.health_restore || item?.hunger_restore) && (
                    <DetailList title="Restoration" entries={restorationEntries} />
                  )}
                  {findSourceEntries.length > 0 && <DetailList title="Where To Find" entries={findSourceEntries} />}
                </div>
              )}
            </div>
          </TabPanel>
        </Tabs>
      </div>
    </ModalSheet>
  );
}

// Re-export with legacy alias for backward compatibility
export const SkillStrategyModal = SkillProfitStrategyModal;
