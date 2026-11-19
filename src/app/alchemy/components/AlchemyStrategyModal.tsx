"use client";

import React, { useRef, useState } from "react";
import { AlertTriangle, Eye, Info, Target, X } from "lucide-react";
import { useModalA11y } from "@/lib/use-modal-a11y";
import type { AlchemyRow } from "../types";
import { formatDuration, formatGold, formatSignedGold } from "../utils/alchemy-helpers";
import { PathBadge } from "./AlchemyBadges";

export function AlchemyStrategyModal({
  row,
  marketTaxRate,
  activeHours,
  ownedCostMode,
  onClose,
  onOpenItem,
  onToggleOwned,
}: {
  row: AlchemyRow;
  marketTaxRate: number;
  activeHours: number;
  ownedCostMode: boolean;
  onClose: () => void;
  onOpenItem: (name: string) => void;
  onToggleOwned: (materialName: string) => void;
}) {
  const dialogRef = useModalA11y<HTMLDivElement>(true, onClose);
  const backdropPointerStarted = useRef(false);
  const [targetGoldPerHour, setTargetGoldPerHour] = useState("");
  const target = Number(targetGoldPerHour);
  const targetPerCraft =
    Number.isFinite(target) && target > 0 && row.craftsPerHour > 0
      ? target / row.craftsPerHour
      : null;
  const sharedInputs = row.ingredientCosts
    .map((ingredient) => {
      const usedTotal = ownedCostMode && ingredient.owned ? 0 : ingredient.totalPrice;
      return { ingredient, usedTotal };
    })
    .filter(({ ingredient, usedTotal }) => ingredient.unitPrice > 0 && usedTotal > 0);
  const sharedInputCost = sharedInputs.reduce((sum, entry) => sum + entry.usedTotal, 0);
  const sharedFixedCost = row.cost - sharedInputCost;
  const sharedBreakEvenBudget = row.bestRevenue - sharedFixedCost;
  const sharedTargetBudget =
    targetPerCraft === null ? null : row.bestRevenue - sharedFixedCost - targetPerCraft;
  const sharedBreakEvenRatio =
    sharedInputCost > 0 && sharedBreakEvenBudget > 0
      ? sharedBreakEvenBudget / sharedInputCost
      : null;
  const sharedTargetRatio =
    sharedInputCost > 0 && sharedTargetBudget !== null && sharedTargetBudget > 0
      ? sharedTargetBudget / sharedInputCost
      : null;
  const sharedBreakEvenLabel =
    sharedBreakEvenRatio === null
      ? "No margin"
      : sharedBreakEvenRatio >= 1
        ? `+${Math.round((sharedBreakEvenRatio - 1) * 100)}% room`
        : `${Math.round((1 - sharedBreakEvenRatio) * 100)}% lower`;

  return (
    <div
      className="modal-overlay alchemy-strategy-overlay"
      onClick={(event) => {
        if (event.target === event.currentTarget && backdropPointerStarted.current) {
          onClose();
        }
        backdropPointerStarted.current = false;
      }}
      onPointerDown={(event) => {
        backdropPointerStarted.current = event.target === event.currentTarget;
      }}
    >
      <div
        aria-labelledby="alchemy-strategy-title"
        aria-modal="true"
        className="modal-content alchemy-strategy-modal"
        onClick={(event) => event.stopPropagation()}
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
      >
        <div className="modal-header">
          <h2 id="alchemy-strategy-title">
            <button
              aria-label={`Open ${row.name} item details`}
              onClick={() => onOpenItem(row.name)}
              style={{
                background: "none",
                border: 0,
                color: "inherit",
                cursor: "pointer",
                font: "inherit",
                padding: 0,
                textAlign: "left",
              }}
              type="button"
            >
              {row.name} Strategy
            </button>
          </h2>
          <button
            aria-label="Close alchemy strategy"
            className="close-btn"
            onClick={onClose}
            type="button"
          >
            <X size={20} />
          </button>
        </div>
        <div className="modal-body">
          <div className="alchemy-modal-kpi-grid">
            <div>
              <span>Cost</span>
              <strong className="mono">{formatGold(row.cost)}g</strong>
            </div>
            <div>
              <span>Return</span>
              <strong className="mono">{formatGold(row.bestRevenue)}g</strong>
            </div>
            <div>
              <span>Profit / pc</span>
              <strong className={`mono ${row.profit >= 0 ? "success-value" : "danger-value"}`}>
                {formatSignedGold(row.profit)}
              </strong>
            </div>
            <div>
              <span>Profit / hr</span>
              <strong
                className={`mono ${row.profitPerHour >= 0 ? "success-value" : "danger-value"}`}
              >
                {formatSignedGold(row.profitPerHour)}
              </strong>
            </div>
          </div>
          <div className="alchemy-modal-grid">
            <section className="alchemy-modal-panel">
              <div className="alchemy-modal-panel-title">
                <Target size={16} /> Inputs
              </div>
              <label className="alchemy-target-profit-field">
                <span>Target profit / hr</span>
                <input
                  aria-label="Target alchemy profit per hour"
                  inputMode="numeric"
                  min={0}
                  placeholder="Optional"
                  type="number"
                  value={targetGoldPerHour}
                  onChange={(event) => setTargetGoldPerHour(event.target.value)}
                />
              </label>
              {targetPerCraft !== null && (
                <div className="alchemy-target-profit-note">
                  {formatGold(targetPerCraft)}g target profit per craft.
                </div>
              )}
              {sharedInputs.length > 1 && (
                <div className="alchemy-shared-scenario">
                  <div className="alchemy-shared-header">
                    <div>
                      <strong>Combined materials</strong>
                      <span>Total input cost: {formatGold(sharedInputCost, 3)}g</span>
                    </div>
                    <small>{sharedBreakEvenLabel}</small>
                  </div>
                  <div className="alchemy-shared-summary">
                    <div>
                      <span>Break-even total</span>
                      <strong className={sharedBreakEvenBudget > 0 ? "" : "danger-value"}>
                        {sharedBreakEvenBudget > 0
                          ? `${formatGold(sharedBreakEvenBudget, 3)}g`
                          : "Not profitable"}
                      </strong>
                    </div>
                    <div>
                      <span>Target total</span>
                      <strong
                        className={
                          sharedTargetBudget === null || sharedTargetBudget > 0
                            ? ""
                            : "danger-value"
                        }
                      >
                        {sharedTargetBudget === null
                          ? "Set target"
                          : sharedTargetBudget > 0
                            ? `${formatGold(sharedTargetBudget, 3)}g`
                            : "Not possible"}
                      </strong>
                    </div>
                  </div>
                  <div className="alchemy-shared-grid">
                    {sharedInputs.map(({ ingredient }) => {
                      const breakEvenUnit =
                        sharedBreakEvenRatio === null
                          ? null
                          : Math.floor(ingredient.unitPrice * sharedBreakEvenRatio);
                      const targetUnit =
                        sharedTargetRatio === null
                          ? null
                          : Math.floor(ingredient.unitPrice * sharedTargetRatio);
                      return (
                        <div key={ingredient.name} className="alchemy-break-even-line">
                          <span>{ingredient.name}</span>
                          <strong
                            className={
                              breakEvenUnit !== null && breakEvenUnit > 0 ? "" : "danger-value"
                            }
                          >
                            {breakEvenUnit !== null && breakEvenUnit > 0
                              ? `${formatGold(breakEvenUnit)}g ea`
                              : "No room"}
                          </strong>
                          {targetPerCraft !== null && (
                            <em
                              className={
                                targetUnit !== null && targetUnit > 0 ? "" : "danger-value"
                              }
                            >
                              Target{" "}
                              {targetUnit !== null && targetUnit > 0
                                ? `${formatGold(targetUnit)}g ea`
                                : "not possible"}
                            </em>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              <div className="alchemy-material-list">
                {row.ingredientCosts.map((ingredient) => {
                  const quantity = Math.max(ingredient.quantity, 1);
                  const ingredientCostUsed =
                    ownedCostMode && ingredient.owned ? 0 : ingredient.totalPrice;
                  const otherCost = row.cost - ingredientCostUsed;
                  const maxUnitForBreakEven = Math.floor((row.bestRevenue - otherCost) / quantity);
                  const maxUnitForTarget =
                    targetPerCraft === null
                      ? null
                      : Math.floor((row.bestRevenue - otherCost - targetPerCraft) / quantity);
                  return (
                    <div key={ingredient.name} className="alchemy-material-card">
                      <div className="alchemy-material-row">
                        <span className="alchemy-material-name">
                          <label className="alchemy-owned-check">
                            <input
                              aria-label={`Mark ${ingredient.name} as owned`}
                              type="checkbox"
                              checked={ingredient.owned}
                              onChange={() => onToggleOwned(ingredient.name)}
                            />
                            <span>{ingredient.quantity}x</span>
                          </label>{" "}
                          <button
                            type="button"
                            className="alchemy-material-button hover-underline"
                            onClick={() => onOpenItem(ingredient.name)}
                          >
                            {ingredient.name}
                          </button>
                        </span>
                        <span className="alchemy-material-price mono">
                          <span>{formatGold(ingredient.unitPrice, 3)} ea</span>
                          <span>{"->"}</span>
                          <strong>
                            {ownedCostMode && ingredient.owned
                              ? "Owned"
                              : `${formatGold(ingredient.totalPrice, 3)}g`}
                          </strong>
                        </span>
                      </div>
                      <div className="alchemy-break-even-grid">
                        <div className="alchemy-break-even-line">
                          <span>Break-even max</span>
                          <strong className={maxUnitForBreakEven > 0 ? "" : "danger-value"}>
                            {maxUnitForBreakEven > 0
                              ? `${formatGold(maxUnitForBreakEven)}g ea`
                              : "Not profitable"}
                          </strong>
                        </div>
                        {maxUnitForTarget !== null && (
                          <div className="alchemy-break-even-line">
                            <span>Target max</span>
                            <strong className={maxUnitForTarget > 0 ? "" : "danger-value"}>
                              {maxUnitForTarget > 0
                                ? `${formatGold(maxUnitForTarget)}g ea`
                                : "Not possible"}
                            </strong>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div className="alchemy-modal-total">
                  <span>Material cost</span>
                  <strong className="mono">{formatGold(row.materialCost, 3)}g</strong>
                </div>
                <div className="alchemy-modal-total">
                  <span>Cash material cost</span>
                  <strong className="mono">{formatGold(row.cashMaterialCost, 3)}g</strong>
                </div>
                <div className="alchemy-modal-total">
                  <span>Vial cost</span>
                  <strong className="mono">{formatGold(row.vialCost)}g</strong>
                </div>
                {row.recipeCostShare > 0 && (
                  <div className="alchemy-modal-total">
                    <span>Recipe cost share</span>
                    <strong className="mono">{formatGold(row.recipeCostShare, 3)}g</strong>
                  </div>
                )}
              </div>
            </section>

            <section className="alchemy-modal-panel">
              <div className="alchemy-modal-panel-title">
                <Info size={16} /> Sale Options
              </div>
              <div className="alchemy-math-list">
                <div className="alchemy-math-row">
                  <span>Market gross</span>
                  <strong className="mono">{formatGold(row.marketGross, 3)}g</strong>
                </div>
                <div className="alchemy-math-row">
                  <span>Market tax ({Math.round(marketTaxRate * 100)}%)</span>
                  <strong className="mono">-{formatGold(row.marketTax, 3)}g</strong>
                </div>
                <div className="alchemy-math-row">
                  <span>Market net</span>
                  <strong className="mono">{formatGold(row.marketNet, 3)}g</strong>
                </div>
                <div className="alchemy-math-row">
                  <span>Vendor net</span>
                  <strong className="mono">{formatGold(row.vendorNet, 3)}g</strong>
                </div>
                <div className="alchemy-math-row">
                  <span>Raw materials net</span>
                  <strong className="mono">{formatGold(row.liquidationNet, 3)}g</strong>
                </div>
                <div className="alchemy-math-divider"></div>
                <div className="alchemy-math-row">
                  <span>Best path</span>
                  <PathBadge action={row.action} />
                </div>
                <div className="alchemy-math-row">
                  <span>Best revenue</span>
                  <strong className="mono accent-value">
                    {formatGold(row.bestRevenue, 3)}g
                  </strong>
                </div>
                <div className="alchemy-math-row">
                  <span>Cost used</span>
                  <strong className="mono">{formatGold(row.cost, 3)}g</strong>
                </div>
                <div className="alchemy-math-row">
                  <span>Profit / pc</span>
                  <strong className={`mono ${row.profit >= 0 ? "success-value" : "danger-value"}`}>
                    {formatSignedGold(row.profit, 3)}
                  </strong>
                </div>
                <div className="alchemy-math-row">
                  <span>Opportunity profit</span>
                  <strong
                    className={`mono ${
                      row.opportunityProfit >= 0 ? "success-value" : "danger-value"
                    }`}
                  >
                    {formatSignedGold(row.opportunityProfit, 3)}
                  </strong>
                </div>
                <div className="alchemy-math-row">
                  <span>Craft time</span>
                  <strong className="mono">
                    {formatDuration(row.time)}
                    {row.efficiencyBonus > 0
                      ? ` (${formatDuration(row.baseTime)} base, +${row.efficiencyBonus}% efficiency)`
                      : ""}
                  </strong>
                </div>
                <div className="alchemy-math-row">
                  <span>Crafts/hr</span>
                  <strong className="mono">{row.craftsPerHour.toFixed(2)}</strong>
                </div>
                <div className="alchemy-math-row">
                  <span>Daily profit ({activeHours}h)</span>
                  <strong
                    className={`mono ${row.dailyProfit >= 0 ? "success-value" : "danger-value"}`}
                  >
                    {formatSignedGold(row.dailyProfit, 2)}
                  </strong>
                </div>
                <div className="alchemy-formula-line">{row.formula}</div>
                <div className="alchemy-liquidity-row">
                  <span>Stable liquidity</span>
                  <strong>
                    {formatGold(row.stableVol_3)} <small>sold pace</small>
                  </strong>
                </div>
                <div className="alchemy-liquidity-row">
                  <span>Raw 3-day sold</span>
                  <strong>
                    {formatGold(row.vol_3)} <small>sold</small>
                  </strong>
                </div>
                {row.sellThroughRisk && (
                  <p className="alchemy-reason">
                    <AlertTriangle size={14} /> {row.sellThroughNote}
                  </p>
                )}
                {row.liquidityRisk && (
                  <p className="alchemy-reason">
                    <AlertTriangle size={14} /> {row.liquidityNote}
                  </p>
                )}
                <p className="alchemy-reason">
                  <Eye size={14} /> {row.reason}
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
