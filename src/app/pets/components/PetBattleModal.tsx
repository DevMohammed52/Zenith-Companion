"use client";

import { createPortal } from "react-dom";
import {
  BadgeInfo,
  BarChart3,
  Database,
  HeartPulse,
  Swords,
  X,
  Zap,
} from "lucide-react";
import { useModalA11y } from "@/lib/use-modal-a11y";
import { getQualityTextStyle } from "@/lib/quality";
import {
  BATTLE_PROFIT_OPTIONS,
  FOOD_OPTIONS,
  type BattleDrop,
  type BattleProfitMode,
  type BattleSelection,
  type FoodPolicy,
} from "../types";
import {
  formatGold,
  formatNumber,
  formatPercent,
  getZoneProfitValue,
  secondsToDuration,
} from "../utils/pet-helpers";
import { PetImage } from "./PetImage";

export function PetBattleModal({
  selectedBattle,
  selectedBattleDrops,
  battleProfitMode,
  foodPolicy,
  beastmaster,
  onClose,
}: {
  selectedBattle: BattleSelection;
  selectedBattleDrops: BattleDrop[];
  battleProfitMode: BattleProfitMode;
  foodPolicy: FoodPolicy;
  beastmaster: boolean;
  onClose: () => void;
}) {
  const petBattleDialogRef = useModalA11y<HTMLDivElement>(true, onClose);

  return createPortal(
    <div
      className="pet-modal-backdrop pet-battle-backdrop"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="pet-battle-modal"
        aria-labelledby="pet-battle-title"
        aria-modal="true"
        ref={petBattleDialogRef}
        role="dialog"
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          className="pet-detail-close"
          type="button"
          aria-label="Close battle details"
          onClick={onClose}
          title="Close battle details"
        >
          <X size={16} />
        </button>
        <div className="pet-detail-head">
          <PetImage pet={selectedBattle.pet} />
          <div>
            <span
              className="pet-quality-line"
              style={getQualityTextStyle(selectedBattle.pet.quality)}
            >
              Battle Samples
            </span>
            <h2 id="pet-battle-title">{selectedBattle.pet.name}</h2>
            <p>{selectedBattle.zone.zone}</p>
          </div>
        </div>
        <div className="pet-research-note">
          <BadgeInfo size={15} />
          <span>
            This is zone research for the selected scenario, not a standalone pet ROI.
            Character stats, gear, food, sleep timing, and combat zone choice drive the final
            return.
          </span>
        </div>
        <div className="pet-detail-metrics">
          <div>
            <Zap size={15} />
            <span>Battle Time</span>
            <strong>{secondsToDuration(selectedBattle.zone.battleTimeSeconds)}</strong>
          </div>
          <div>
            <Swords size={15} />
            <span>Enemies</span>
            <strong>{formatNumber(selectedBattle.zone.enemiesBattled)}</strong>
          </div>
          <div>
            <Database size={15} />
            <span>Loot Pieces</span>
            <strong>{formatNumber(selectedBattle.zone.lootPieces)}</strong>
          </div>
        </div>
        <div className="pet-source-list">
          <div>
            <span>Selected profit/hr</span>
            <strong>
              {formatGold(
                getZoneProfitValue(selectedBattle.zone, battleProfitMode, foodPolicy),
              )}
            </strong>
          </div>
          <div>
            <span>Profit/hr no sleep</span>
            <strong>{formatGold(selectedBattle.zone.expectedProfitPerHourNoSleep)}</strong>
          </div>
          <div>
            <span>Profit/hr with sleep</span>
            <strong>{formatGold(selectedBattle.zone.expectedProfitPerHourWithSleep)}</strong>
          </div>
          <div>
            <span>Healing + sleep</span>
            <strong>
              {formatGold(selectedBattle.zone.expectedProfitPerHourHealingWithSleep)}
            </strong>
          </div>
          <div>
            <span>Revenue/battle</span>
            <strong>{formatGold(selectedBattle.zone.expectedRevenuePerBattle)}</strong>
          </div>
          <div>
            <span>Profit/battle</span>
            <strong>{formatGold(selectedBattle.zone.expectedProfitPerBattle)}</strong>
          </div>
          <div>
            <span>Food cost/hr</span>
            <strong>{formatGold(selectedBattle.zone.foodCostPerHourCheapest)}</strong>
          </div>
          <div>
            <span>Profit margin</span>
            <strong>{formatPercent(selectedBattle.zone.profitMargin)}</strong>
          </div>
        </div>
        <div className="pet-detail-section">
          <h3>
            <HeartPulse size={15} /> Sleep / Stamina Cycle
          </h3>
          <div className="pet-source-list">
            <div>
              <span>Max stamina</span>
              <strong>{formatNumber(selectedBattle.zone.cycle?.maxStamina)}</strong>
            </div>
            <div>
              <span>Stamina / battle</span>
              <strong>
                {formatNumber(selectedBattle.zone.cycle?.staminaDrainPerBattle, 2)}
              </strong>
            </div>
            <div>
              <span>Stamina / hour</span>
              <strong>
                {formatNumber(selectedBattle.zone.cycle?.staminaDrainPerHour, 2)}
              </strong>
            </div>
            <div>
              <span>Battles before sleep</span>
              <strong>
                {formatNumber(selectedBattle.zone.cycle?.battlesBeforeSleep, 1)}
              </strong>
            </div>
            <div>
              <span>Zero stamina battle time</span>
              <strong>
                {secondsToDuration(
                  selectedBattle.zone.cycle?.timeBattledForZeroStaminaSeconds,
                )}
              </strong>
            </div>
            <div>
              <span>Stamina recovery</span>
              <strong>
                {secondsToDuration(
                  selectedBattle.zone.cycle?.staminaRecoveryZeroToFullSeconds,
                )}
              </strong>
            </div>
            <div>
              <span>Health recovery</span>
              <strong>
                {secondsToDuration(
                  selectedBattle.zone.cycle?.healthRecoveryZeroToFullSeconds,
                )}
              </strong>
            </div>
            <div>
              <span>Sleep/battle stamina</span>
              <strong>
                {formatNumber(selectedBattle.zone.cycle?.sleepToBattleForStamina, 2)}
              </strong>
            </div>
          </div>
        </div>
        <div className="pet-detail-section">
          <h3>
            <BarChart3 size={15} /> Expected Drop Breakdown
          </h3>
          {selectedBattleDrops.length ? (
            <div className="pet-drop-table-wrap">
              <table className="pet-drop-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Drop</th>
                    <th>Value share</th>
                    <th>Best price</th>
                    <th>Source</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedBattleDrops
                    .slice()
                    .sort(
                      (a, b) =>
                        Number(b.valueShareMaxPrice || b.valueSharePercent || 0) -
                        Number(a.valueShareMaxPrice || a.valueSharePercent || 0),
                    )
                    .slice(0, 16)
                    .map((drop, index) => (
                      <tr key={`${drop.itemName}-${drop.source}-${index}`}>
                        <td>{drop.itemName || "-"}</td>
                        <td>{formatPercent(drop.expectedDropPercent, 3)}</td>
                        <td>
                          {formatPercent(drop.valueShareMaxPrice ?? drop.valueSharePercent, 1)}
                        </td>
                        <td>
                          {formatGold(
                            drop.prices?.bestAfterTaxSellValue ??
                              drop.prices?.megaLastDayPriceAfterTax ??
                              drop.prices?.marketPrice,
                          )}
                        </td>
                        <td>
                          {drop.source === "mega_test_calculator"
                            ? "Battle sample"
                            : "Drop table"}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="pet-muted">No drop breakdown matched this zone yet.</p>
          )}
        </div>
        <div className="pet-detail-section">
          <h3>
            <BadgeInfo size={15} /> Scenario Context
          </h3>
          <div className="pet-source-list">
            <div>
              <span>Mode</span>
              <strong>
                {
                  BATTLE_PROFIT_OPTIONS.find((option) => option.value === battleProfitMode)
                    ?.label
                }
              </strong>
            </div>
            <div>
              <span>Food</span>
              <strong>{FOOD_OPTIONS.find((option) => option.value === foodPolicy)?.label}</strong>
            </div>
            <div>
              <span>Beastmaster</span>
              <strong>{beastmaster ? "+10% pet EXP" : "Off"}</strong>
            </div>
          </div>
        </div>
        <div className="pet-research-note">
          <BadgeInfo size={15} />
          <span>
            Profit shown here reflects the selected sleep and food settings. Beastmaster is
            shown as pet EXP context.
          </span>
        </div>
      </div>
    </div>,
    document.body,
  );
}
