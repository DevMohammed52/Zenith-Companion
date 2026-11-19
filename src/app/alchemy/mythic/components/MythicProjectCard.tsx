"use client";

import React from "react";
import Image from "next/image";
import {
  AlertTriangle,
  ChevronDown,
  DollarSign,
  Hammer,
  TrendingUp,
  X,
} from "lucide-react";
import type { MythicProjectRow, MythicRecipe } from "../types";
import { formatGold, formatSignedGold, formatSource } from "../utils/mythic-helpers";
import styles from "../page.module.css";

export function MythicProjectCard({
  row,
  isProjectExpanded,
  taxNetPercent,
  taxRate,
  profileBarteringBoost,
  onRemove,
  onToggleDetails,
  onOpenItem,
  onUpdateRecipePrice,
  onUpdateMaterialPrice,
  onUpdateSellPrice,
  onSetRecipeUses,
}: {
  row: MythicProjectRow;
  isProjectExpanded: boolean;
  taxNetPercent: number;
  taxRate: number;
  profileBarteringBoost: number;
  onRemove: (resultName: string) => void;
  onToggleDetails: (resultName: string) => void;
  onOpenItem: (name: string) => void;
  onUpdateRecipePrice: (resultName: string, raw: string) => void;
  onUpdateMaterialPrice: (resultName: string, materialName: string, raw: string) => void;
  onUpdateSellPrice: (resultName: string, raw: string) => void;
  onSetRecipeUses: (recipe: MythicRecipe, raw: string) => void;
}) {
  const detailsId = `mythic-project-${row.recipe.resultName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")}-details`;

  return (
    <article
      className={`${styles.mythicCard} ${isProjectExpanded ? styles.projectExpanded : ""}`}
    >
      <button
        className={styles.removeBtn}
        onClick={() => onRemove(row.recipe.resultName)}
        aria-label={`Remove ${row.recipe.resultName} project`}
        type="button"
      >
        <X size={18} />
      </button>

      <div className={styles.cardHeader}>
        {row.recipe.imageUrl && (
          <Image
            className={styles.resultArt}
            src={row.recipe.imageUrl}
            alt=""
            width={64}
            height={64}
            loading="lazy"
            decoding="async"
          />
        )}
        <div className={styles.titleArea}>
          <button
            type="button"
            className={styles.titleButton}
            onClick={() => onOpenItem(row.recipe.resultName)}
          >
            {row.recipe.resultName}
          </button>
          <button
            type="button"
            className={styles.recipeLink}
            onClick={() => onOpenItem(row.recipe.recipeName)}
          >
            {row.recipe.recipeName}
          </button>
          <div className={styles.metaPills}>
            <span>Lvl {row.recipe.level}</span>
            <span>{row.recipe.resultQuality}</span>
            <span>{row.recipe.maxUses} uses</span>
            <span>{row.vol_3.toLocaleString()} 3d vol</span>
            <span>{row.outputLiquidity.label}</span>
          </div>
        </div>
        <div
          className={`${styles.profitBadge} ${
            row.profitPerHour >= 0 ? styles.pos : styles.neg
          }`}
        >
          <strong>{formatSignedGold(row.profitPerHour)}/hr</strong>
          <span>{formatSignedGold(row.profit)}/craft</span>
        </div>
      </div>

      <div
        className={styles.mobileCardSummary}
        aria-label={`${row.recipe.resultName} project summary`}
      >
        <div>
          <span>Remaining</span>
          <strong
            className={row.totalRemainingProfit >= 0 ? "text-success" : "text-danger"}
          >
            {formatSignedGold(row.totalRemainingProfit)}
          </strong>
        </div>
        <div>
          <span>Best path</span>
          <strong
            className={
              row.bestPath === "VENDOR"
                ? styles.pathVendor
                : row.bestPath === "MARKET"
                  ? styles.pathMarket
                  : styles.pathCustom
            }
          >
            {row.bestPath}
          </strong>
        </div>
        <div>
          <span>Warnings</span>
          <strong>{row.marketWarnings.length}</strong>
        </div>
      </div>

      <button
        type="button"
        className={styles.mobileDetailsToggle}
        aria-expanded={isProjectExpanded}
        aria-controls={detailsId}
        onClick={() => onToggleDetails(row.recipe.resultName)}
      >
        <span>{isProjectExpanded ? "Hide details" : "Show details"}</span>
        <ChevronDown size={16} aria-hidden="true" />
      </button>

      <div className={styles.cardGrid} id={detailsId}>
        <section className={styles.cardLeft}>
          <div className={styles.cardSection}>
            <div className={styles.sectionLabel}>
              <TrendingUp size={12} /> Project Overhead
            </div>
            <div className={styles.investmentInputGroup}>
              <label className={styles.inputWrapper}>
                <span>Recipe Acquisition Price</span>
                <div className={styles.inputRow}>
                  <input
                    type="number"
                    inputMode="numeric"
                    min="0"
                    aria-label={`Recipe acquisition price for ${row.recipe.recipeName}`}
                    placeholder={
                      row.recipePrice > 0
                        ? row.recipePrice.toLocaleString()
                        : "No market data"
                    }
                    value={row.localRecipePrice ?? ""}
                    onChange={(event) =>
                      onUpdateRecipePrice(row.recipe.resultName, event.target.value)
                    }
                  />
                  <span className={styles.currency}>Gold</span>
                </div>
                <div className={styles.inputHintRow}>
                  <span>{formatSource(row.recipePriceSource)}</span>
                  <span className={styles.feeSplit}>
                    {formatGold(row.recipeCostPerCraft, 2)}g / craft
                  </span>
                </div>
              </label>

              <label className={styles.usesControl}>
                <input
                  type="number"
                  inputMode="numeric"
                  min="1"
                  max={row.recipe.maxUses}
                  aria-label={`Uses remaining for ${row.recipe.resultName}`}
                  value={row.usesLeft}
                  onChange={(event) => onSetRecipeUses(row.recipe, event.target.value)}
                />
                <span>Uses remaining</span>
              </label>
            </div>
          </div>

          <div className={styles.cardSection}>
            <div className={styles.sectionLabel}>
              <Hammer size={12} /> Material Ledger
            </div>
            <div className={styles.materialsLedger}>
              {row.materialBreakdown.map((material) => (
                <div key={material.name} className={styles.ledgerRow}>
                  <div className={styles.ledgerInfo}>
                    <span className={styles.matQty}>{material.qty}x</span>
                    <button
                      type="button"
                      className={styles.matName}
                      onClick={() => onOpenItem(material.name)}
                    >
                      {material.name}
                    </button>
                  </div>
                  <div className={styles.ledgerInput}>
                    <div className={styles.inputSourceHint}>
                      {formatSource(material.priceSource)}
                    </div>
                    <input
                      type="number"
                      inputMode="numeric"
                      min="0"
                      aria-label={`Custom unit price for ${material.name}`}
                      placeholder={
                        material.unitPrice > 0 ? material.unitPrice.toLocaleString() : "Missing"
                      }
                      value={material.localPrice ?? ""}
                      onChange={(event) =>
                        onUpdateMaterialPrice(
                          row.recipe.resultName,
                          material.name,
                          event.target.value,
                        )
                      }
                    />
                    <div className={styles.ledgerTotal}>{formatGold(material.total, 2)}g</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.cardRight}>
          <div className={styles.cardSection}>
            <div className={styles.sectionLabel}>
              <DollarSign size={12} /> Revenue Strategy
            </div>
            {row.marketWarnings.length > 0 && (
              <div
                className={`${styles.marketWarningRow} ${
                  row.outputLiquidity.tone === "active"
                    ? styles.active
                    : row.outputLiquidity.tone === "steady"
                      ? styles.steady
                      : ""
                }`}
              >
                <AlertTriangle size={14} aria-hidden="true" />
                <div className={styles.marketWarningCopy}>
                  <span>{row.marketWarnings.join(" - ")}</span>
                  <small>{row.outputLiquidity.note}</small>
                </div>
              </div>
            )}
            <div className={styles.revenueManager}>
              <label className={styles.marketRevenueBox}>
                <span>Gross Sell Price</span>
                <div className={`${styles.inputRow} ${styles.compact}`}>
                  <input
                    type="number"
                    inputMode="numeric"
                    min="0"
                    aria-label={`Gross sell price for ${row.recipe.resultName}`}
                    placeholder={
                      row.marketGross > 0
                        ? row.marketGross.toLocaleString()
                        : "No market data"
                    }
                    value={row.localSellPrice ?? ""}
                    onChange={(event) =>
                      onUpdateSellPrice(row.recipe.resultName, event.target.value)
                    }
                  />
                  <span className={styles.currency}>g</span>
                </div>
                <div className={styles.marketMeta}>
                  <span>{formatSource(row.marketPriceSource)}</span>
                  <span>
                    {taxNetPercent}% Net: <b>{formatGold(row.revenue)}g</b>
                  </span>
                </div>
              </label>

              <div
                className={`${styles.vendorRevenueBox} ${
                  row.bestPath === "VENDOR" ? styles.highlight : ""
                }`}
              >
                <div>
                  <div className={styles.vendorLabel}>
                    Vendor path (+{profileBarteringBoost}% profile bartering)
                  </div>
                  <div className={styles.vendorNote}>
                    Market tax is {Math.round(taxRate * 100)}%
                  </div>
                </div>
                <div className={styles.vendorVal}>{formatGold(row.vendorRevenue)}g</div>
              </div>
            </div>
          </div>

          <div className={styles.footerStatsModern}>
            <div className={styles.statGroup}>
              <span className={styles.label}>Best Path</span>
              <span
                className={`${styles.value} ${
                  row.bestPath === "VENDOR"
                    ? styles.pathVendor
                    : row.bestPath === "MARKET"
                      ? styles.pathMarket
                      : styles.pathCustom
                }`}
              >
                {row.bestPath}
              </span>
            </div>
            <div className={styles.statGroup}>
              <span className={styles.label}>ROI</span>
              <span
                className={`${styles.value} ${
                  row.roi >= 0 ? "text-success" : "text-danger"
                }`}
              >
                {row.roi.toFixed(1)}%
              </span>
            </div>
            <div className={`${styles.statGroup} ${styles.highlight}`}>
              <span className={styles.label}>
                Remaining Project Gain ({row.usesLeft} crafts)
              </span>
              <span
                className={`${styles.value} ${styles.large} ${
                  row.totalRemainingProfit >= 0 ? "text-success" : "text-danger"
                }`}
              >
                {formatSignedGold(row.totalRemainingProfit)}
              </span>
            </div>
          </div>
        </section>
      </div>
    </article>
  );
}
