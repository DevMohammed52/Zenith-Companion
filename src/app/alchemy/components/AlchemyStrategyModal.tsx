"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GameImage } from "@/components/GameImage";
import { GoldIcon } from "@/components/GoldIcon";
import QualityText from "@/components/QualityText";
import {
  Badge,
  Button,
  Checkbox,
  Icon,
  ModalSheet,
  NumberInput,
  Tab,
  TabList,
  TabPanel,
  Tabs,
} from "@/components/ui";
import {
  calculateCraftingBreakEven,
  formatDuration,
  formatGold,
  formatSignedGold,
  getActionLabel,
} from "@/lib/alchemy-profit";
import type { AlchemyRow } from "../types";
import { getActionVariant } from "../utils/alchemy-helpers";
import styles from "../page.module.css";

interface AlchemyStrategyModalProps {
  row: AlchemyRow | null;
  marketTaxRate: number;
  sessionHours: number;
  ownedCostMode: boolean;
  onClose: () => void;
  onOpenItem: (name: string) => void;
  onToggleOwned: (materialName: string) => void;
  onAddToQueue: (name: string, qty: number) => void;
}

export function AlchemyStrategyModal({
  row,
  marketTaxRate,
  sessionHours,
  ownedCostMode,
  onClose,
  onOpenItem,
  onToggleOwned,
  onAddToQueue,
}: AlchemyStrategyModalProps) {
  const [activeTab, setActiveTab] = useState("inputs");
  const [targetGoldPerHour, setTargetGoldPerHour] = useState("");
  const [batchQty, setBatchQty] = useState<number>(10);

  useEffect(() => {
    if (!row) return;
    setActiveTab("inputs");
    setTargetGoldPerHour("");
    setBatchQty(Math.max(1, row.craftsPerSession || Math.round(row.craftsPerHour) || 10));
  }, [row?.name, row?.craftsPerHour, row?.craftsPerSession]);

  if (!row) {
    return (
      <ModalSheet isOpen={false} onClose={onClose} title="Alchemy Strategy" maxWidth="lg">
        {null}
      </ModalSheet>
    );
  }

  const parsedTarget = targetGoldPerHour.trim() === "" ? null : Number(targetGoldPerHour);
  const breakEven = calculateCraftingBreakEven(row, ownedCostMode, parsedTarget);

  const hourPresetQty = Math.max(1, Math.round(row.craftsPerHour) || 1);
  const sessionPresetQty = Math.max(1, row.craftsPerSession || hourPresetQty);
  const batchCost = (row.cost - row.vialCost) * batchQty + row.vialCost * batchQty;
  const batchProfit = row.profit * batchQty;
  const batchAlchemyExp = Math.round(row.alchemyExpEach * batchQty);
  const batchSpeedExp = Math.round(row.baseSpeedExp * batchQty);
  const batchHours = (row.time * batchQty) / 3600;

  return (
    <ModalSheet
      isOpen={Boolean(row)}
      onClose={onClose}
      maxWidth="lg"
      title={
        <div className={styles.modalHeaderTitle}>
          <div className={styles.itemThumbLg}>
            {row.imageUrl ? (
              <GameImage src={row.imageUrl} alt={row.name} width={34} height={34} sizes="34px" />
            ) : (
              <Icon name="alchemy" size="md" aria-hidden="true" />
            )}
          </div>
          <div className={styles.recipeMeta}>
            <button
              type="button"
              className={styles.recipeNameBtn}
              onClick={() => onOpenItem(row.name)}
              aria-label={`Open ${row.name} item details`}
            >
              <QualityText value={row.quality}>{row.name}</QualityText>
            </button>
            <div className={styles.inlineGroup}>
              <span className={styles.recipeSubline}>Lv {row.level}</span>
              <span className={styles.hairlineDivider} aria-hidden="true" />
              <span className={styles.recipeSubline}>{formatDuration(row.time)} / craft</span>
              <span className={styles.hairlineDivider} aria-hidden="true" />
              <span className={styles.recipeSubline}>Tap name for item details</span>
            </div>
          </div>
        </div>
      }
    >
      <div className={styles.modalBody}>
        <div className={styles.modalSummaryStrip}>
          <div className={styles.modalSummaryCell}>
            <span className={styles.cardMetricLabel}>Cost</span>
            <strong className={styles.cardMetricVal}>
              <GoldIcon size={12} />
              {formatGold(row.cost, 1)}g
            </strong>
          </div>
          <div className={styles.modalSummaryCell}>
            <span className={styles.cardMetricLabel}>Best Return</span>
            <strong className={styles.cardMetricVal}>
              <GoldIcon size={12} />
              {formatGold(row.bestRevenue, 1)}g
            </strong>
          </div>
          <div className={styles.modalSummaryCell}>
            <span className={styles.cardMetricLabel}>Profit / pc</span>
            <strong
              className={`${styles.cardMetricVal} ${
                row.profit >= 0 ? styles.positive : styles.negative
              }`}
            >
              {formatSignedGold(row.profit, 1)}
            </strong>
          </div>
          <div className={styles.modalSummaryCell}>
            <span className={styles.cardMetricLabel}>Profit / Hr</span>
            <strong
              className={`${styles.cardMetricVal} ${
                row.profitPerHour >= 0 ? styles.positive : styles.negative
              }`}
            >
              {formatSignedGold(row.profitPerHour)}
            </strong>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} variant="underline">
          <TabList aria-label="Strategy details sections">
            <Tab value="inputs">Inputs</Tab>
            <Tab value="paths">Paths &amp; EXP</Tab>
            <Tab value="batch">Batch Queue</Tab>
          </TabList>

          <TabPanel value="inputs">
            <div className={styles.modalPanel}>
              <div className={styles.popoverRow}>
                <NumberInput
                  label="Target Profit / Hr (gold)"
                  prefix={<GoldIcon size={13} />}
                  min={0}
                  step={500}
                  showSteppers={false}
                  value={parsedTarget ?? 0}
                  onChange={(val) => setTargetGoldPerHour(val > 0 ? String(val) : "")}
                />
                <div className={styles.fieldBlock}>
                  <span className={styles.fieldLabel}>Crafting Break-Even Target</span>
                  <div className={styles.noteBlock}>
                    Solving against max craft return ({formatGold(breakEven.craftRevenue, 1)}g from{" "}
                    {row.marketNet >= row.vendorNet ? "Market net" : "Vendor"}).
                  </div>
                </div>
              </div>

              <div className={styles.ingredientList}>
                {breakEven.perIngredient.map(
                  ({ ingredient, maxUnitForBreakEven, maxUnitForTarget }) => (
                    <div key={ingredient.name} className={styles.ingredientRow}>
                      <div className={styles.ingredientIdentity}>
                        <Checkbox
                          aria-label={`Mark ${ingredient.name} as owned`}
                          label={<span className={styles.srOnly}>Owned</span>}
                          checked={ingredient.owned}
                          onChange={() => onToggleOwned(ingredient.name)}
                        />
                        <div className={styles.itemThumb}>
                          {ingredient.imageUrl ? (
                            <GameImage
                              src={ingredient.imageUrl}
                              alt={ingredient.name}
                              width={24}
                              height={24}
                              sizes="24px"
                            />
                          ) : (
                            <Icon name="items" size="xs" aria-hidden="true" />
                          )}
                        </div>
                        <div className={styles.recipeMeta}>
                          <button
                            type="button"
                            className={styles.recipeNameBtn}
                            onClick={() => onOpenItem(ingredient.name)}
                          >
                            {ingredient.quantity}x{" "}
                            <QualityText value={ingredient.quality || "STANDARD"}>
                              {ingredient.name}
                            </QualityText>
                          </button>
                          <div className={styles.inlineGroup}>
                            <span className={styles.recipeSubline}>
                              Break-even:{" "}
                              <strong className={maxUnitForBreakEven > 0 ? undefined : styles.negative}>
                                {maxUnitForBreakEven > 0
                                  ? `${formatGold(maxUnitForBreakEven)}g ea`
                                  : "Not profitable"}
                              </strong>
                            </span>
                            {maxUnitForTarget !== null && (
                              <>
                                <span className={styles.hairlineDivider} aria-hidden="true" />
                                <span className={styles.recipeSubline}>
                                  Target:{" "}
                                  <strong className={maxUnitForTarget > 0 ? undefined : styles.negative}>
                                    {maxUnitForTarget > 0
                                      ? `${formatGold(maxUnitForTarget)}g ea`
                                      : "Not possible"}
                                  </strong>
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className={styles.ingredientNumbers}>
                        <span className={styles.moneyValue}>
                          <GoldIcon size={12} />
                          {ownedCostMode && ingredient.owned
                            ? "0g (Owned)"
                            : `${formatGold(ingredient.totalPrice, 1)}g`}
                        </span>
                        <span className={styles.cellSub}>
                          {formatGold(ingredient.unitPrice, 1)}g ea ({ingredient.source})
                        </span>
                      </div>
                    </div>
                  ),
                )}

                <div className={styles.ingredientRow}>
                  <div className={styles.ingredientIdentity}>
                    <div className={styles.itemThumb}>
                      {row.vialImageUrl ? (
                        <GameImage
                          src={row.vialImageUrl}
                          alt={row.vialName}
                          width={24}
                          height={24}
                          sizes="24px"
                        />
                      ) : (
                        <Icon name="vendor" size="xs" aria-hidden="true" />
                      )}
                    </div>
                    <div className={styles.recipeMeta}>
                      <strong>1x {row.vialName}</strong>
                      <span className={styles.recipeSubline}>General Goods merchant</span>
                    </div>
                  </div>
                  <div className={styles.ingredientNumbers}>
                    <span className={styles.moneyValue}>
                      <GoldIcon size={12} />
                      {formatGold(row.vialCost)}g
                    </span>
                  </div>
                </div>
              </div>

              {breakEven.sharedInputs.length > 1 && (
                <div className={styles.mathList}>
                  <div className={styles.mathRow}>
                    <span>Combined buy budget (break-even)</span>
                    <strong className={breakEven.sharedBreakEvenBudget > 0 ? undefined : styles.negative}>
                      <GoldIcon size={12} />
                      {breakEven.sharedBreakEvenBudget > 0
                        ? `${formatGold(breakEven.sharedBreakEvenBudget, 1)}g total`
                        : "Not profitable"}
                    </strong>
                  </div>
                  {breakEven.sharedInputs.map((entry) => (
                    <div key={entry.ingredient.name} className={styles.mathRow}>
                      <span>{entry.ingredient.name}</span>
                      <strong>
                        {entry.breakEvenUnit !== null && entry.breakEvenUnit > 0
                          ? `${formatGold(entry.breakEvenUnit)}g ea`
                          : "No room"}
                        {entry.targetUnit !== null && entry.targetUnit > 0
                          ? ` (Target ${formatGold(entry.targetUnit)}g)`
                          : ""}
                      </strong>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabPanel>

          <TabPanel value="paths">
            <div className={styles.modalPanel}>
              <div className={styles.mathList}>
                <div className={styles.mathRow}>
                  <span>Market gross</span>
                  <strong>
                    <GoldIcon size={12} />
                    {formatGold(row.marketGross, 1)}g
                  </strong>
                </div>
                <div className={styles.mathRow}>
                  <span>Market tax ({Math.round(marketTaxRate * 100)}%)</span>
                  <strong>-{formatGold(row.marketTax, 1)}g</strong>
                </div>
                <div className={styles.mathRow}>
                  <span>Market net</span>
                  <strong>
                    <GoldIcon size={12} />
                    {formatGold(row.marketNet, 1)}g
                  </strong>
                </div>
                <div className={styles.mathRow}>
                  <span>Vendor net (with Bartering)</span>
                  <strong>
                    <GoldIcon size={12} />
                    {formatGold(row.vendorNet, 1)}g
                  </strong>
                </div>
                <div className={styles.mathRow}>
                  <span>Sell raw inputs net</span>
                  <strong>
                    <GoldIcon size={12} />
                    {formatGold(row.liquidationNet, 1)}g
                  </strong>
                </div>
                <div className={styles.mathDivider} />
                <div className={styles.mathRow}>
                  <span>Recommended path</span>
                  <Badge size="sm" variant={getActionVariant(row.action)}>
                    {getActionLabel(row.action)}
                  </Badge>
                </div>
                <div className={styles.mathRow}>
                  <span>Crafting profit (vs opportunity cost)</span>
                  <strong className={row.opportunityProfit >= 0 ? styles.positive : styles.negative}>
                    {formatSignedGold(row.opportunityProfit, 1)}
                  </strong>
                </div>
                <div className={styles.mathRow}>
                  <span>Craft duration</span>
                  <strong>
                    <span>{formatDuration(row.time)}</span>
                    <span className={styles.hairlineDivider} aria-hidden="true" />
                    <span>{row.craftsPerHour.toFixed(1)}/hr</span>
                    <span className={styles.hairlineDivider} aria-hidden="true" />
                    <span>{row.efficiencyBonus >= 0 ? `+${row.efficiencyBonus}%` : `${row.efficiencyBonus}%`} eff</span>
                  </strong>
                </div>
                <div className={styles.mathRow}>
                  <span>Alchemy EXP</span>
                  <strong>
                    <span>+{formatGold(Math.round(row.alchemyExpEach))} / craft</span>
                    <span className={styles.hairlineDivider} aria-hidden="true" />
                    <span>{formatGold(Math.round(row.expPerHour))}/hr</span>
                  </strong>
                </div>
                <div className={styles.mathRow}>
                  <span>Base Speed EXP</span>
                  <strong>
                    <span>+{row.baseSpeedExp} / craft</span>
                    <span className={styles.hairlineDivider} aria-hidden="true" />
                    <span>{formatGold(Math.round(row.speedExpPerHour))}/hr</span>
                  </strong>
                </div>
                <div className={styles.mathRow}>
                  <span>
                    {sessionHours}h session yield ({row.craftsPerSession} crafts)
                  </span>
                  <strong className={row.sessionProfit >= 0 ? styles.positive : styles.negative}>
                    <span>{formatSignedGold(Math.round(row.sessionProfit))}</span>
                    <span className={styles.hairlineDivider} aria-hidden="true" />
                    <span>{formatGold(row.sessionExp)} XP</span>
                  </strong>
                </div>
                <div className={styles.mathRow}>
                  <span>Stable vs Raw 3d volume</span>
                  <strong>
                    {formatGold(row.stableVol_3)} stable / {formatGold(row.vol_3)} raw
                  </strong>
                </div>
              </div>

              {row.sellThroughNote && (
                <div className={styles.noteBlock}>
                  <Icon name="warning" size="sm" aria-hidden="true" />
                  <span>{row.sellThroughNote}</span>
                </div>
              )}
              {row.liquidityRisk && (
                <div className={styles.noteBlock}>
                  <Icon name="warning" size="sm" aria-hidden="true" />
                  <span>{row.liquidityNote}</span>
                </div>
              )}
              <div className={styles.noteBlock}>
                <Icon name="info" size="sm" aria-hidden="true" />
                <span>{row.reason}</span>
              </div>
            </div>
          </TabPanel>

          <TabPanel value="batch">
            <div className={styles.modalPanel}>
              <div className={styles.popoverRow}>
                <NumberInput
                  label="Batch Quantity"
                  min={1}
                  max={999999}
                  value={batchQty}
                  onChange={(val) => setBatchQty(Math.max(1, Math.floor(val || 1)))}
                />
                <div className={styles.fieldBlock}>
                  <span className={styles.fieldLabel}>Quick Presets</span>
                  <div className={styles.batchPresetRow}>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setBatchQty(hourPresetQty)}
                    >
                      1 hr ({hourPresetQty})
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setBatchQty(sessionPresetQty)}
                    >
                      {sessionHours}h session ({sessionPresetQty})
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => setBatchQty(100)}>
                      100x
                    </Button>
                  </div>
                </div>
              </div>

              <div className={styles.mathList}>
                <div className={styles.mathRow}>
                  <span>Estimated craft duration</span>
                  <strong>{batchHours.toFixed(1)} hours</strong>
                </div>
                <div className={styles.mathRow}>
                  <span>Total batch cost</span>
                  <strong>
                    <GoldIcon size={12} />
                    {formatGold(Math.round(batchCost))}g
                  </strong>
                </div>
                <div className={styles.mathRow}>
                  <span>Projected batch profit</span>
                  <strong className={batchProfit >= 0 ? styles.positive : styles.negative}>
                    {formatSignedGold(Math.round(batchProfit))}
                  </strong>
                </div>
                <div className={styles.mathRow}>
                  <span>Total EXP earned</span>
                  <strong>
                    <span>+{formatGold(batchAlchemyExp)} Alchemy XP</span>
                    <span className={styles.hairlineDivider} aria-hidden="true" />
                    <span>+{formatGold(batchSpeedExp)} Speed XP</span>
                  </strong>
                </div>
                <div className={styles.mathDivider} />
                {row.ingredientCosts.map((ing) => (
                  <div key={ing.name} className={styles.mathRow}>
                    <span>{ing.name} needed</span>
                    <strong>{formatGold(ing.quantity * batchQty)}x</strong>
                  </div>
                ))}
                <div className={styles.mathRow}>
                  <span>{row.vialName} needed</span>
                  <strong>
                    {formatGold(batchQty)}x ({formatGold(row.vialCost * batchQty)}g merchant)
                  </strong>
                </div>
              </div>

              <div className={styles.popoverActions}>
                <Link href="/crafting" className={styles.navPillLink}>
                  <Icon name="market" size="xs" aria-hidden="true" />
                  <span>Open Crafting Queue</span>
                </Link>
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => onAddToQueue(row.name, batchQty)}
                >
                  <Icon name="plus" size="sm" aria-hidden="true" />
                  <span>Add {formatGold(batchQty)}x to Queue</span>
                </Button>
              </div>
            </div>
          </TabPanel>
        </Tabs>
      </div>
    </ModalSheet>
  );
}
