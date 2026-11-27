"use client";

import React from "react";
import {
  Badge,
  Button,
  EmptyState,
  NumberInput,
  SegmentedControl,
  Select,
  Tag,
} from "@/components/ui";
import { Icon } from "@/components/ui/Icon";
import { GameImage } from "@/components/GameImage";
import { GoldIcon } from "@/components/GoldIcon";
import QualityText from "@/components/QualityText";
import { formatStatName } from "@/lib/profile-calculations";
import {
  SLOT_ICON_NAMES,
  formatCompactGold,
  qualityBadgeVariant,
  type AdvisorSortKey,
} from "../types";
import type { UseBisStateResult } from "../hooks/useBisState";
import styles from "../page.module.css";

interface BisUpgradesTabProps {
  state: UseBisStateResult;
}

const BUDGET_PRESETS = [
  { id: "all", label: "Any budget" },
  { id: "500k", label: "<= 500K" },
  { id: "2m", label: "<= 2M" },
  { id: "5m", label: "<= 5M" },
  { id: "custom", label: "Custom" },
];

export function BisUpgradesTab({ state }: BisUpgradesTabProps) {
  return (
    <>
      <section className={styles.upgradesToolbar} aria-label="Next upgrade controls">
        <SegmentedControl
          value={state.advisorKindFilter}
          onChange={(val) => state.setAdvisorKindFilter(val as "all" | "upgrade" | "equip")}
          options={[
            { value: "all", label: "All Moves" },
            { value: "upgrade", label: "Upgrade Owned" },
            { value: "equip", label: "Buy New" },
          ]}
          ariaLabel="Upgrade source"
        />

        <Select
          aria-label="Rank slot upgrades by"
          value={state.advisorSort}
          onChange={(val) => state.setAdvisorSort(val as AdvisorSortKey)}
          options={[
            { value: "efficiency", label: "Best Gold / Stat" },
            { value: "gain", label: "Biggest Stat Gain" },
            { value: "cost", label: "Lowest Gold Cost" },
          ]}
        />

        <div className={styles.budgetChipsWrap} aria-label="Gold budget filter">
          {BUDGET_PRESETS.map((preset) => (
            <Tag
              key={preset.id}
              label={preset.label}
              selected={state.advisorBudget === preset.id}
              onSelect={() => state.setAdvisorBudget(preset.id)}
            />
          ))}
          {state.advisorBudget === "custom" && (
            <div className={styles.customBudgetInput}>
              <NumberInput
                aria-label="Custom gold budget"
                value={state.advisorCustomBudget}
                min={0}
                step={100000}
                onChange={state.setAdvisorCustomBudget}
              />
            </div>
          )}
        </div>

        <Tag
          label="Show locked"
          selected={state.advisorIncludeLocked}
          onSelect={() => state.setAdvisorIncludeLocked((prev) => !prev)}
        />
      </section>

      {state.actionableUpgradeCount === 0 ? (
        <EmptyState
          variant="no-data"
          title="All slots are already optimal"
          description="Raise your gold budget, switch move types, or show higher-level gear in filters above."
          action={{
            label: "Reset Upgrade Filters",
            onClick: () => {
              state.setAdvisorKindFilter("all");
              state.setAdvisorBudget("all");
              state.setAdvisorIncludeLocked(false);
            },
          }}
        />
      ) : (
        <div className={styles.upgradeSlotList} role="list" aria-label="Best next upgrade per equipment slot">
          {state.perSlotUpgrades.map(({ baseline, bestMove }) => {
            if (!bestMove) {
              return (
                <article key={baseline.slotKey} className={styles.upgradeRow} role="listitem">
                  <div className={styles.upgradeSlotCol}>
                    <span className={styles.upgradeSlotHeading}>
                      <Icon name={SLOT_ICON_NAMES[baseline.gearType]} size="sm" aria-hidden="true" />
                      {baseline.label}
                    </span>
                    <span className={styles.upgradeCurrentName}>
                      {baseline.item ? `${baseline.item.name} T${baseline.tier}` : "Empty slot"}
                    </span>
                  </div>
                  <div className={styles.upgradeMoveCol}>
                    <span className={styles.upgradeReason}>
                      No stronger affordable move under your current filters.
                    </span>
                  </div>
                  <div />
                  <div />
                  <div />
                </article>
              );
            }

            const statGains = Object.entries(bestMove.statDeltas)
              .filter(([, val]) => val !== 0)
              .slice(0, 4);
            const totalStatDiff = Object.values(bestMove.statDeltas).reduce((s, v) => s + v, 0);
            const goldPerRealStat =
              bestMove.totalCost !== null && totalStatDiff > 0
                ? bestMove.totalCost / totalStatDiff
                : bestMove.goldPerPoint;

            return (
              <article key={baseline.slotKey} className={styles.upgradeRow} role="listitem">
                <div className={styles.upgradeSlotCol}>
                  <span className={styles.upgradeSlotHeading}>
                    <Icon name={SLOT_ICON_NAMES[baseline.gearType]} size="sm" aria-hidden="true" />
                    {baseline.label}
                  </span>
                  <span className={styles.upgradeCurrentName}>
                    {baseline.item ? `Now: ${baseline.item.name} T${baseline.tier}` : "Now: Empty slot"}
                  </span>
                </div>

                <div className={styles.upgradeMoveCol}>
                  <GameImage
                    src={bestMove.targetItem.image_url}
                    alt=""
                    width={36}
                    height={36}
                    className={styles.itemThumb}
                  />
                  <div className={styles.itemNameBlock}>
                    <div className={styles.upgradeMoveTitle}>
                      <QualityText value={bestMove.targetItem.quality} className={styles.itemNameText}>
                        {bestMove.targetItem.name}
                      </QualityText>
                      <Badge variant={qualityBadgeVariant(bestMove.targetItem.quality)} size="sm">
                        {bestMove.kind === "upgrade"
                          ? `T${bestMove.fromTier} to T${bestMove.toTier}`
                          : `Equip T${bestMove.toTier}`}
                      </Badge>
                      {bestMove.isOptimalStop && (
                        <Badge variant="refined" size="sm">Optimal Tier</Badge>
                      )}
                      {!bestMove.eligible && (
                        <Badge variant="danger" size="sm">Needs {bestMove.unmet[0]}</Badge>
                      )}
                    </div>
                    <span className={styles.upgradeReason}>{bestMove.reason}</span>
                  </div>
                </div>

                <div className={styles.statGainRow}>
                  {statGains.map(([stat, val]) => (
                    <span
                      key={stat}
                      className={`${styles.statGainChip} ${val < 0 ? styles.statGainChipNegative : ""}`}
                    >
                      {val > 0 ? "+" : ""}
                      {val} {formatStatName(stat)}
                    </span>
                  ))}
                </div>

                <div className={styles.upgradeCostCol}>
                  <span className={styles.goldCell}>
                    {bestMove.totalCost !== null ? (
                      <>
                        <GoldIcon size={13} />
                        {formatCompactGold(bestMove.totalCost)}
                      </>
                    ) : (
                      bestMove.missingPriceNote || "No price"
                    )}
                  </span>
                  <span className={styles.mutedCell} style={{ fontSize: "0.78rem" }}>
                    {goldPerRealStat !== null
                      ? `${formatCompactGold(goldPerRealStat)} / stat`
                      : "Unpriced"}
                  </span>
                </div>

                <div className={styles.upgradeActions}>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => state.openCompareFor(bestMove.targetItem, bestMove.toTier, bestMove.slotKey)}
                  >
                    Inspect
                  </Button>
                  {state.activeProfile && (
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={
                        !bestMove.eligible ||
                        (baseline.item?.hashed_id === bestMove.targetItem.hashed_id &&
                          baseline.tier === bestMove.toTier)
                      }
                      onClick={() => state.saveGearToSlot(bestMove.targetItem, bestMove.toTier, bestMove.slotKey)}
                    >
                      {baseline.item?.hashed_id === bestMove.targetItem.hashed_id &&
                      baseline.tier === bestMove.toTier
                        ? "Saved"
                        : "Save"}
                    </Button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
