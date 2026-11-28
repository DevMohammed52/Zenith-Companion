"use client";

import LoreThreadPanel from "@/components/LoreThreadPanel";
import { GameImage } from "@/components/GameImage";
import { GoldIcon, ShardIcon } from "@/components/GoldIcon";
import QualityText from "@/components/QualityText";
import { Badge, Banner, Icon, ModalSheet, type BadgeVariant } from "@/components/ui";
import { formatGoldUnit, formatHours, formatNumber, formatSignedGold } from "@/lib/format";
import type { DungeonState } from "../hooks/useDungeonState";
import {
  DROP_VALUATION_LABELS,
  type DungeonDropValuationMode,
  getReadinessText,
  getValuePathLabel,
} from "../types";
import styles from "../Dungeons.module.css";

function getReadinessVariant(ready: boolean, hasProfile: boolean): BadgeVariant {
  if (ready) return "success";
  if (hasProfile) return "warning";
  return "neutral";
}

export interface DungeonDetailsModalProps {
  state: DungeonState;
}

export function DungeonDetailsModal({ state }: DungeonDetailsModalProps) {
  const {
    selectedDungeon,
    closeDungeon,
    activeProfile,
    selectedDungeonLoreNames,
    openLoreThread,
    openItemByName,
    prefetchItem,
  } = state;

  const sortedLoot = selectedDungeon
    ? [...(selectedDungeon.lootDetails || [])].sort((a: any, b: any) => (b.expectedVal || 0) - (a.expectedVal || 0))
    : [];

  return (
    <ModalSheet
      isOpen={Boolean(selectedDungeon)}
      onClose={closeDungeon}
      title={selectedDungeon?.name || "Dungeon Details"}
      description={
        selectedDungeon
          ? `${selectedDungeon.location?.name || "Unknown"} | Difficulty ${selectedDungeon.difficulty || 0} | ${selectedDungeon.durationMins}m`
          : undefined
      }
      maxWidth="xl"
    >
      {selectedDungeon ? (
        <div className={styles.modalBodyStack}>
          <div className={styles.modalHero}>
            <span className={styles.modalAvatar} aria-hidden="true">
              <GameImage
                src={selectedDungeon.image_url}
                alt=""
                width={50}
                height={50}
                sizes="50px"
                fallback={<Icon name="dungeon" size="xl" />}
              />
            </span>
            <div className={styles.modalTags}>
              <span>
                <Icon name="mapPin" size="xs" aria-hidden="true" />{" "}
                {selectedDungeon.location?.name || "Unknown"}
              </span>
              <Badge size="sm" variant="neutral">
                Difficulty {selectedDungeon.difficulty || 0}
              </Badge>
              <Badge size="sm" variant="neutral">
                Lv. {selectedDungeon.level_required || 0}
              </Badge>
              <Badge size="sm" variant={getReadinessVariant(selectedDungeon.profileReady, Boolean(activeProfile))}>
                {getReadinessText(selectedDungeon, Boolean(activeProfile))}
              </Badge>
              {selectedDungeon.isSeasonal && (
                <Badge size="sm" variant="neutral">
                  {selectedDungeon.eventActive ? "Event active" : "Seasonal event"}
                </Badge>
              )}
            </div>
          </div>

          {selectedDungeon.isSeasonal && (
            <Banner variant="info" icon="info">
              Seasonal event dungeon{selectedDungeon.eventActive ? " (live right now)" : " (currently off-season)"}.{" "}
              Rare mythic drops can rotate across campaign reruns.
            </Banner>
          )}

          <div className={styles.modalStatStrip}>
            <div className={styles.statCell}>
              <span className={styles.statLabel}>Entry Cost</span>
              <strong className={`${styles.statValue} ${styles.profitNegative}`}>
                <GoldIcon size={13} />
                <span>-{formatGoldUnit(selectedDungeon.entryCost)}</span>
              </strong>
              <span className={styles.statHint}>Per run fee</span>
            </div>
            <div className={styles.statCell}>
              <span className={styles.statLabel}>EV / Run</span>
              <strong
                className={`${styles.statValue} ${
                  selectedDungeon.netProfitPerRun >= 0 ? styles.profitPositive : styles.profitNegative
                }`}
              >
                <GoldIcon size={13} />
                <span>{formatSignedGold(selectedDungeon.netProfitPerRun)}</span>
              </strong>
              <span className={styles.statHint}>After entry fee</span>
            </div>
            <div className={styles.statCell}>
              <span className={styles.statLabel}>Entry / Shard</span>
              <strong className={styles.statValue}>
                {selectedDungeon.shardCount > 0 && selectedDungeon.shardValue > 0 ? (
                  <>
                    <GoldIcon size={13} />
                    <span>{formatGoldUnit(selectedDungeon.shardValue)}</span>
                  </>
                ) : (
                  <span className={styles.fieldMeta}>No shards</span>
                )}
              </strong>
              <span className={styles.statHint}>
                {selectedDungeon.shardCount > 0 ? `${formatNumber(selectedDungeon.shardCount)} shards/run` : "Lv 1–65 give none"}
              </span>
            </div>
            <div className={styles.statCell}>
              <span className={styles.statLabel}>Action Net</span>
              <strong
                className={`${styles.statValue} ${
                  selectedDungeon.idleActionNetProfit >= 0 ? styles.profitPositive : styles.profitNegative
                }`}
              >
                <GoldIcon size={13} />
                <span>{formatSignedGold(selectedDungeon.idleActionNetProfit)}</span>
              </strong>
              <span className={styles.statHint}>{selectedDungeon.runsInIdleAction} queued runs</span>
            </div>
          </div>

          <div className={styles.detailGrid}>
            <section className={styles.detailGroup}>
              <h3 className={styles.detailGroupHeading}>
                <Icon name="defense" size="sm" aria-hidden="true" />
                <span>Profile Readiness</span>
              </h3>
              <div className={styles.detailRow}>
                <span>Status</span>
                <strong>{getReadinessText(selectedDungeon, Boolean(activeProfile))}</strong>
              </div>
              <div className={styles.detailRow}>
                <span>Profile combat stats</span>
                <strong>{formatNumber(selectedDungeon.profileDungeonStats)}</strong>
              </div>
              <div className={styles.detailRow}>
                <span>Required stats (70% min)</span>
                <strong>{formatNumber(selectedDungeon.requiredDungeonStats)}</strong>
              </div>
              <div className={styles.detailRow}>
                <span>Dungeoneering level</span>
                <strong>
                  {selectedDungeon.profileDungeoneering || 0} / {selectedDungeon.level_required || 0}
                </strong>
              </div>
            </section>

            <section className={styles.detailGroup}>
              <h3 className={styles.detailGroupHeading}>
                <Icon name="timer" size="sm" aria-hidden="true" />
                <span>Idle Action Plan</span>
              </h3>
              <div className={styles.detailRow}>
                <span>Action limit</span>
                <strong>{selectedDungeon.idleActionLimitHours.toFixed(1)}h</strong>
              </div>
              <div className={styles.detailRow}>
                <span>Housing bonus</span>
                <strong>{formatHours(selectedDungeon.housingDungeonHours || 0)}</strong>
              </div>
              <div className={styles.detailRow}>
                <span>Runs fit</span>
                <strong>
                  {selectedDungeon.runsInIdleAction} ({selectedDungeon.dailyRunsByPlaytime}/day cap)
                </strong>
              </div>
              <div className={styles.detailRow}>
                <span>Effective / base time</span>
                <strong>
                  {selectedDungeon.idleActionEffectiveHours.toFixed(1)}h /{" "}
                  {selectedDungeon.idleActionBaseHours.toFixed(1)}h
                </strong>
              </div>
              <div className={styles.detailRow}>
                <span>Unused gap</span>
                <strong>{selectedDungeon.idleActionGapHours.toFixed(1)}h</strong>
              </div>
            </section>

            <section className={styles.detailGroup}>
              <h3 className={styles.detailGroupHeading}>
                <Icon name="magic" size="sm" aria-hidden="true" />
                <span>XP, Shards &amp; Modifiers</span>
              </h3>
              <div className={styles.detailRow}>
                <span>Combat / Dungeoneering XP</span>
                <strong>
                  {formatNumber(selectedDungeon.combatExp)} / {formatNumber(selectedDungeon.dungeoneeringExp)}
                </strong>
              </div>
              {selectedDungeon.bonusMasteryExp?.map((bonus) => (
                <div className={styles.detailRow} key={bonus.skill}>
                  <span>{bonus.skill} XP</span>
                  <strong>{formatNumber(bonus.amount)}</strong>
                </div>
              ))}
              <div className={styles.detailRow}>
                <span>Shards per run</span>
                <strong style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                  {selectedDungeon.shardCount > 0 ? (
                    <>
                      <ShardIcon size={13} />
                      <span>{formatNumber(selectedDungeon.shardCount)}</span>
                    </>
                  ) : (
                    <span>None</span>
                  )}
                </strong>
              </div>
              <div className={styles.detailRow}>
                <span>Completion progress</span>
                <strong>
                  {selectedDungeon.completedRuns || 0} / {selectedDungeon.completionRequirement || 0} (
                  {selectedDungeon.completionMagicFindActive ? "+1% active" : "locked"})
                </strong>
              </div>
              <div className={styles.detailRow}>
                <span>Total completion MF</span>
                <strong>
                  +{selectedDungeon.completedDungeonBonus}% (+{selectedDungeon.eventCompletionMagicFindBonus || 0}%
                  event)
                </strong>
              </div>
              <div className={styles.detailRow}>
                <span>Active item speed / MF</span>
                <strong>
                  +{selectedDungeon.itemEfficiencyBonus}% / +{selectedDungeon.itemMagicFindBonus + selectedDungeon.equippedSpecialMagicFindBonus}%
                </strong>
              </div>
            </section>

            <section className={styles.detailGroup}>
              <h3 className={styles.detailGroupHeading}>
                <Icon name="gold" size="sm" aria-hidden="true" />
                <span>Cost Model</span>
              </h3>
              <div className={styles.detailRow}>
                <span>Queued action cost</span>
                <strong>{formatGoldUnit(selectedDungeon.idleActionCost)}</strong>
              </div>
              <div className={styles.detailRow}>
                <span>Drop valuation mode</span>
                <strong>{DROP_VALUATION_LABELS[selectedDungeon.dropValuationMode as DungeonDropValuationMode]}</strong>
              </div>
              <div className={styles.detailRow}>
                <span>Loot EV / Entry Cost</span>
                <strong>
                  {formatGoldUnit(selectedDungeon.lootEv)} / {formatGoldUnit(selectedDungeon.entryCost)}
                </strong>
              </div>
              <div className={styles.detailRow}>
                <span>Effective speed / MF</span>
                <strong>
                  {selectedDungeon.dungeonEfficiency}% /{" "}
                  {selectedDungeon.includeMagicFindEv ? `${selectedDungeon.dungeonMagicFind}%` : "Off"}
                </strong>
              </div>
              <div className={styles.detailRow}>
                <span>Runs per drop</span>
                <strong>{selectedDungeon.runsToDrop === Infinity ? "—" : selectedDungeon.runsToDrop.toFixed(1)}</strong>
              </div>
              <p className={styles.detailNote}>
                Shards are bonus rewards on top of gold EV and are not counted as gold. Craft paths use modeled market
                output minus material cost.
              </p>
            </section>
          </div>

          {selectedDungeon.marketSensitiveDropCount > 0 && (
            <Banner variant="warning" icon="warning">
              This EV includes {selectedDungeon.marketSensitiveDropCount} low-volume gear or mythic{" "}
              {selectedDungeon.marketSensitiveDropCount === 1 ? "drop" : "drops"}; modeled market value may sell slowly.
            </Banner>
          )}

          <LoreThreadPanel
            names={selectedDungeonLoreNames}
            title="Dungeon Lore Thread"
            onOpenThread={openLoreThread}
          />

          <h3 className={styles.lootHeading}>
            <Icon name="items" size="sm" aria-hidden="true" />
            <span>Loot Table ({sortedLoot.length})</span>
          </h3>

          <div className={styles.lootList}>
            {sortedLoot.map((drop: any, index: number) => (
              <button
                key={`${drop.name}-${index}`}
                type="button"
                className={styles.lootRowBtn}
                onClick={() => openItemByName(drop.name)}
                onMouseEnter={() => prefetchItem(drop.name)}
              >
                <div className={styles.lootTopRow}>
                  <div className={styles.lootMain}>
                    <span className={styles.lootIcon} aria-hidden="true">
                      <GameImage
                        src={drop.image_url}
                        alt=""
                        width={30}
                        height={30}
                        sizes="30px"
                        fallback={<Icon name="items" size="sm" />}
                      />
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <div className={styles.pickerPrimary}>
                        {drop.name}
                        {(Number(drop.quantity) || 1) > 1 && ` x${drop.quantity}`}
                      </div>
                      <div className={styles.cellSubline}>
                        <span>
                          {drop.adjustedChancePercent !== drop.baseChancePercent
                            ? `${drop.baseChancePercent}% → ${drop.adjustedChancePercent.toFixed(2)}%`
                            : `${drop.chance}% drop`}
                        </span>
                        <span aria-hidden="true">|</span>
                        <QualityText value={drop.quality}>{drop.quality || "Unknown"}</QualityText>
                      </div>
                    </div>
                  </div>

                  <div className={styles.lootValueCol}>
                    <span className={styles.currencyReadout} style={{ color: "var(--text-accent)" }}>
                      <GoldIcon size={13} />
                      <span>{formatGoldUnit(drop.expectedVal || 0)} EV</span>
                    </span>
                    <span className={styles.cellSubline}>
                      <span>
                        {getValuePathLabel(drop.valueBreakdown?.chosenPath)} {formatGoldUnit(drop.trueValue || 0)}
                        {drop.marketPriceInfo?.adjusted ? " safe" : ""}
                      </span>
                      <Icon name="externalLink" size="xs" aria-hidden="true" />
                    </span>
                    {(drop.marketSensitive || drop.chestAdjusted) && (
                      <span className={styles.detailNote} style={{ marginTop: 0 }}>
                        {drop.valuationModeApplied || drop.chestAdjusted
                          ? `${drop.valuationLabel}. ${drop.valuationNote || "Sensitive loot value adjusted."}`
                          : drop.valuationNote}
                      </span>
                    )}
                    {drop.valueBreakdown?.recipe && !drop.valuationModeApplied && (
                      <span className={styles.detailNote} style={{ marginTop: 0 }}>
                        Output {formatGoldUnit(drop.valueBreakdown.recipe.resultValue)} − Mats{" "}
                        {formatGoldUnit(drop.valueBreakdown.recipe.materialCost)}
                      </span>
                    )}
                  </div>
                </div>

                {drop.valueBreakdown?.chest && (
                  <div className={styles.chestBreakdown}>
                    <div className={styles.chestRow}>
                      <strong style={{ color: "var(--text-primary)" }}>Alchemy chest breakdown</strong>
                      <strong>{formatGoldUnit(drop.valueBreakdown.chest.expectedValue)} total</strong>
                    </div>
                    {[...drop.valueBreakdown.chest.drops]
                      .sort((a: any, b: any) => (b.expectedValue || 0) - (a.expectedValue || 0))
                      .slice(0, 6)
                      .map((chestDrop: any) => (
                        <div className={styles.chestRow} key={`${drop.name}-${chestDrop.name}`}>
                          <span>
                            {chestDrop.name}{" "}
                            <small style={{ color: "var(--text-muted)" }}>
                              ({getValuePathLabel(chestDrop.path)})
                            </small>
                          </span>
                          <span>
                            {formatGoldUnit(chestDrop.expectedValue)} ({Number(chestDrop.chance || 0)}% ×{" "}
                            {formatGoldUnit(chestDrop.value || 0)})
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </ModalSheet>
  );
}

export default DungeonDetailsModal;
