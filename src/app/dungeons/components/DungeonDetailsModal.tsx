"use client";

import Image from "next/image";
import {
  Clock,
  Coins,
  ExternalLink,
  MapPin,
  PackageOpen,
  ShieldCheck,
  Sparkles,
  Target,
  X,
  Zap,
} from "lucide-react";
import QualityText from "@/components/QualityText";
import LoreThreadPanel from "@/components/LoreThreadPanel";
import { formatGoldUnit, formatHours, formatNumber, formatSignedGold } from "@/lib/format";
import type { DungeonState } from "../hooks/useDungeonState";
import {
  DROP_VALUATION_LABELS,
  type DungeonDropValuationMode,
  getReadinessText,
  getValuePathLabel,
} from "../types";

export interface DungeonDetailsModalProps {
  state: DungeonState;
}

export function DungeonDetailsModal({ state }: DungeonDetailsModalProps) {
  const {
    selectedDungeon,
    closeDungeon,
    dungeonDialogRef,
    activeProfile,
    selectedDungeonLoreNames,
    openLoreThread,
    openItemByName,
    prefetchItem,
  } = state;

  if (!selectedDungeon) return null;

  return (
    <div className="modal-overlay dungeon-modal-overlay" onClick={closeDungeon}>
      <div
        aria-labelledby="dungeon-details-title"
        aria-modal="true"
        className="modal-content dungeon-modal"
        onClick={(event) => event.stopPropagation()}
        ref={dungeonDialogRef}
        role="dialog"
        tabIndex={-1}
      >
        <div className="modal-header">
          <div className="dungeon-modal-title">
            {selectedDungeon.image_url && (
              <Image src={selectedDungeon.image_url} alt="" width={52} height={52} unoptimized />
            )}
            <div>
              <h2 id="dungeon-details-title">{selectedDungeon.name}</h2>
              <div className="dungeon-modal-tags">
                <span><MapPin size={12} /> {selectedDungeon.location?.name || "Unknown"}</span>
                <span><Zap size={12} /> Difficulty {selectedDungeon.difficulty}</span>
                <span><Clock size={12} /> {selectedDungeon.durationMins}m</span>
              </div>
            </div>
          </div>
          <button
            className="close-btn"
            type="button"
            aria-label="Close dungeon details"
            onClick={closeDungeon}
          >
            <X size={20} />
          </button>
        </div>
        <div className="modal-body">
          <div className="stats-grid dungeon-modal-stats">
            <div className="stat-card">
              <div className="stat-label">Entry Cost</div>
              <div className="stat-value" style={{ color: "#f87171" }}>
                -{formatGoldUnit(selectedDungeon.entryCost)}
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-label">EV / Run</div>
              <div
                className="stat-value"
                style={{ color: selectedDungeon.netProfitPerRun >= 0 ? "var(--text-success)" : "#f87171" }}
              >
                {formatSignedGold(selectedDungeon.netProfitPerRun)}
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Gold / Shard</div>
              <div className="stat-value">
                {selectedDungeon.shardValue > 0 ? formatGoldUnit(selectedDungeon.shardValue) : "-"}
              </div>
            </div>
            <div className="stat-card highlight">
              <div className="stat-label">Action Net</div>
              <div
                className="stat-value"
                style={{ color: selectedDungeon.idleActionNetProfit >= 0 ? "var(--text-success)" : "#f87171" }}
              >
                {formatSignedGold(selectedDungeon.idleActionNetProfit)}
              </div>
            </div>
          </div>

          <div className="dungeon-modal-grid">
            <section className="dungeon-modal-panel">
              <h3><ShieldCheck size={15} /> Profile Readiness</h3>
              <div className="dungeon-detail-row">
                <span>Status</span>
                <strong>{getReadinessText(selectedDungeon, Boolean(activeProfile))}</strong>
              </div>
              <div className="dungeon-detail-row">
                <span>Profile stats</span>
                <strong>{formatNumber(selectedDungeon.profileDungeonStats)}</strong>
              </div>
              <div className="dungeon-detail-row">
                <span>Required stats</span>
                <strong>{formatNumber(selectedDungeon.requiredDungeonStats)}</strong>
              </div>
              <div className="dungeon-detail-row">
                <span>Dungeoneering</span>
                <strong>{selectedDungeon.profileDungeoneering || 0} / {selectedDungeon.level_required || 0}</strong>
              </div>
            </section>

            <section className="dungeon-modal-panel">
              <h3><Target size={15} /> Idle Action Plan</h3>
              <div className="dungeon-detail-row">
                <span>Action limit</span>
                <strong>{selectedDungeon.idleActionLimitHours.toFixed(1)}h</strong>
              </div>
              <div className="dungeon-detail-row">
                <span>Housing bonus</span>
                <strong>{formatHours(selectedDungeon.housingDungeonHours || 0)}</strong>
              </div>
              <div className="dungeon-detail-row">
                <span>Playtime</span>
                <strong>{selectedDungeon.playtimeHours.toFixed(1)}h/day</strong>
              </div>
              <div className="dungeon-detail-row">
                <span>Runs fit</span>
                <strong>{selectedDungeon.runsInIdleAction}</strong>
              </div>
              <div className="dungeon-detail-row">
                <span>Daily repeat capacity</span>
                <strong>{selectedDungeon.dailyRunsByPlaytime} runs in {selectedDungeon.actionsNeededForDailyRuns} actions</strong>
              </div>
              <div className="dungeon-detail-row">
                <span>Base time used</span>
                <strong>{selectedDungeon.idleActionBaseHours.toFixed(1)}h</strong>
              </div>
              <div className="dungeon-detail-row">
                <span>Effective time used</span>
                <strong>{selectedDungeon.idleActionEffectiveHours.toFixed(1)}h</strong>
              </div>
              <div className="dungeon-detail-row">
                <span>Action gap</span>
                <strong>{selectedDungeon.idleActionGapHours.toFixed(1)}h</strong>
              </div>
            </section>

            <section className="dungeon-modal-panel">
              <h3><Sparkles size={15} /> Rewards</h3>
              <div className="dungeon-detail-row">
                <span>Combat EXP</span>
                <strong>{formatNumber(selectedDungeon.combatExp)}</strong>
              </div>
              <div className="dungeon-detail-row">
                <span>Dungeoneering EXP</span>
                <strong>{formatNumber(selectedDungeon.dungeoneeringExp)}</strong>
              </div>
              <div className="dungeon-detail-row">
                <span>Shards</span>
                <strong>{formatNumber(selectedDungeon.shardCount)}</strong>
              </div>
              <div className="dungeon-detail-row">
                <span>Gold / shard</span>
                <strong>{selectedDungeon.shardValue > 0 ? `${formatGoldUnit(selectedDungeon.shardValue)} each` : "-"}</strong>
              </div>
              <p className="dungeon-model-note">Gold per shard = entry cost / shards from dungeon data.</p>
              <div className="dungeon-detail-row">
                <span>Completion requirement</span>
                <strong>{selectedDungeon.completedRuns || 0} / {selectedDungeon.completionRequirement || 0}</strong>
              </div>
              <div className="dungeon-detail-row">
                <span>This dungeon MF</span>
                <strong>{selectedDungeon.completionMagicFindActive ? "+1% active" : "Not active"}</strong>
              </div>
              <div className="dungeon-detail-row">
                <span>Total completion MF</span>
                <strong>+{selectedDungeon.completedDungeonBonus}%</strong>
              </div>
              <div className="dungeon-detail-row">
                <span>Limited-time MF</span>
                <strong>+{selectedDungeon.eventCompletionMagicFindBonus || 0}%</strong>
              </div>
              <div className="dungeon-detail-row">
                <span>Item speed</span>
                <strong>
                  {selectedDungeon.itemEfficiencyBonus > 0
                    ? `+${selectedDungeon.itemEfficiencyBonus}%${selectedDungeon.dungeonEfficiencyItemName ? ` (${selectedDungeon.dungeonEfficiencyItemName})` : ""}`
                    : "None"}
                </strong>
              </div>
              <div className="dungeon-detail-row">
                <span>Temporary item MF</span>
                <strong>
                  {selectedDungeon.itemMagicFindBonus > 0
                    ? `+${selectedDungeon.itemMagicFindBonus}%${selectedDungeon.dungeonMagicFindItemName ? ` (${selectedDungeon.dungeonMagicFindItemName})` : ""}`
                    : "None"}
                </strong>
              </div>
              <div className="dungeon-detail-row">
                <span>Equipped special MF</span>
                <strong>
                  {selectedDungeon.equippedSpecialMagicFindBonus > 0
                    ? `+${selectedDungeon.equippedSpecialMagicFindBonus}%${selectedDungeon.equippedSpecialName ? ` (${selectedDungeon.equippedSpecialName})` : ""}`
                    : "None"}
                </strong>
              </div>
            </section>

            <section className="dungeon-modal-panel">
              <h3><Coins size={15} /> Cost Model</h3>
              <p className="dungeon-model-note">Craft paths are modeled value and may require your own skill/materials or a trusted service.</p>
              {selectedDungeon.marketSensitiveDropCount > 0 && (
                <p className="dungeon-model-note risk">
                  This EV includes {selectedDungeon.marketSensitiveDropCount} sensitive drop{selectedDungeon.marketSensitiveDropCount === 1 ? "" : "s"}; modeled market value may not sell quickly.
                </p>
              )}
              <div className="dungeon-detail-row">
                <span>Queued action entry cost</span>
                <strong>{formatGoldUnit(selectedDungeon.idleActionCost)}</strong>
              </div>
              <div className="dungeon-detail-row">
                <span>Drop value mode</span>
                <strong>{DROP_VALUATION_LABELS[selectedDungeon.dropValuationMode as DungeonDropValuationMode]}</strong>
              </div>
              <div className="dungeon-detail-row">
                <span>Sensitive drops</span>
                <strong>{selectedDungeon.marketSensitiveDropCount > 0 ? `${selectedDungeon.marketSensitiveDropCount} checked` : "None"}</strong>
              </div>
              <div className="dungeon-detail-row">
                <span>Loot EV / run</span>
                <strong>{formatGoldUnit(selectedDungeon.lootEv)}</strong>
              </div>
              <div className="dungeon-detail-row">
                <span>Shard EV / run</span>
                <strong>
                  {selectedDungeon.shardValue > 0
                    ? `${formatGoldUnit(selectedDungeon.shardEv)} (${formatGoldUnit(selectedDungeon.entryCost)} / ${formatNumber(selectedDungeon.shardCount)} shards)`
                    : "-"}
                </strong>
              </div>
              <div className="dungeon-detail-row">
                <span>Gross EV / run</span>
                <strong>{formatGoldUnit(selectedDungeon.ev)}</strong>
              </div>
              <div className="dungeon-detail-row">
                <span>Dungeon MF in EV</span>
                <strong>{selectedDungeon.includeMagicFindEv ? `${selectedDungeon.dungeonMagicFind}%` : "Off"}</strong>
              </div>
              <div className="dungeon-detail-row">
                <span>Effective speed</span>
                <strong>{selectedDungeon.dungeonEfficiency}%</strong>
              </div>
              <div className="dungeon-detail-row">
                <span>Runs / any drop</span>
                <strong>{selectedDungeon.runsToDrop === Infinity ? "-" : selectedDungeon.runsToDrop.toFixed(1)}</strong>
              </div>
            </section>
          </div>

          <LoreThreadPanel names={selectedDungeonLoreNames} title="Dungeon Lore Thread" onOpenThread={openLoreThread} />

          <h3 className="dungeon-loot-heading"><PackageOpen size={16} /> Loot Table</h3>
          <div className="dungeon-loot-list">
            {[...(selectedDungeon.lootDetails || [])]
              .sort((a: any, b: any) => (b.expectedVal || 0) - (a.expectedVal || 0))
              .map((drop: any, index: number) => (
                <button
                  key={`${drop.name}-${index}`}
                  type="button"
                  className="dungeon-loot-row"
                  onClick={() => openItemByName(drop.name)}
                  onMouseEnter={() => prefetchItem(drop.name)}
                >
                  <div className="dungeon-loot-main">
                    {drop.image_url && <Image src={drop.image_url} alt="" width={34} height={34} unoptimized />}
                    <div>
                      <strong>
                        {drop.name}
                        {(Number(drop.quantity) || 1) > 1 && <span> x{drop.quantity}</span>}
                      </strong>
                      <small>
                        {drop.adjustedChancePercent !== drop.baseChancePercent
                          ? `${drop.baseChancePercent}% -> ${drop.adjustedChancePercent.toFixed(2)}%`
                          : `${drop.chance}% drop`}{" "}
                        - <QualityText value={drop.quality}>{drop.quality || "Unknown"}</QualityText>
                      </small>
                    </div>
                  </div>
                  <div className="dungeon-loot-value">
                    <strong>{formatGoldUnit(drop.expectedVal || 0)}</strong>
                    <span>
                      {getValuePathLabel(drop.valueBreakdown?.chosenPath)} {formatGoldUnit(drop.trueValue || 0)}
                      {drop.marketPriceInfo?.adjusted ? " safe" : ""} <ExternalLink size={10} />
                    </span>
                    {(drop.marketSensitive || drop.chestAdjusted) && (
                      <small className={`dungeon-market-note ${drop.manualMissingValue ? "risk" : drop.marketLiquidity?.tone || "none"}`}>
                        {drop.valuationModeApplied || drop.chestAdjusted
                          ? `${drop.valuationLabel}. ${drop.valuationNote || "Sensitive loot value adjusted."}`
                          : drop.valuationNote}
                      </small>
                    )}
                    {drop.valueBreakdown?.recipe && !drop.valuationModeApplied && (
                      <small>
                        Crafted item value: {formatGoldUnit(drop.valueBreakdown.recipe.resultValue)}
                        {" - "}
                        material cost {formatGoldUnit(drop.valueBreakdown.recipe.materialCost)}
                      </small>
                    )}
                    {drop.valueBreakdown?.chest && (
                      <small>
                        Chest contents EV: {formatGoldUnit(drop.valueBreakdown.chest.expectedValue)}
                      </small>
                    )}
                  </div>
                  {drop.valueBreakdown?.chest && (
                    <div className="dungeon-chest-breakdown" onClick={(event) => event.stopPropagation()}>
                      <div className="dungeon-chest-summary">
                        <span>
                          <strong>Alchemy chest breakdown</strong>
                          <small>Each row is chance x quantity x best item value.</small>
                        </span>
                        <em>{formatGoldUnit(drop.valueBreakdown.chest.expectedValue)} total</em>
                      </div>
                      {[...drop.valueBreakdown.chest.drops]
                        .sort((a: any, b: any) => (b.expectedValue || 0) - (a.expectedValue || 0))
                        .slice(0, 6)
                        .map((chestDrop: any) => (
                          <div className="dungeon-chest-row" key={`${drop.name}-${chestDrop.name}`}>
                            <span>
                              <strong>{chestDrop.name}</strong>
                              <small>
                                {getValuePathLabel(chestDrop.path)}
                                {chestDrop.valuationModeApplied ? ` - ${chestDrop.valuationLabel}` : ""}
                              </small>
                            </span>
                            <span>
                              <em>{formatGoldUnit(chestDrop.expectedValue)}</em>
                              <small>
                                {Number(chestDrop.chance || 0)}% x {(Number(chestDrop.quantity) || 1) > 1 ? `${chestDrop.quantity} x ` : ""}{formatGoldUnit(chestDrop.value || 0)}
                              </small>
                            </span>
                          </div>
                        ))}
                    </div>
                  )}
                </button>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DungeonDetailsModal;
