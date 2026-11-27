"use client";

import { GameImage } from "@/components/GameImage";
import { GoldIcon } from "@/components/GoldIcon";
import QualityText from "@/components/QualityText";
import {
  Badge,
  Banner,
  Button,
  Card,
  Icon,
  NumberInput,
} from "@/components/ui";
import type { MythicProjectRow, MythicRecipe } from "../types";
import {
  formatCraftWindow,
  formatGold,
  formatSignedGold,
  formatSource,
  getBestPathLabel,
  getBestPathVariant,
  getLiquidityBadgeVariant,
} from "../utils/mythic-helpers";
import styles from "../page.module.css";

interface MythicProjectCardProps {
  row: MythicProjectRow;
  isProjectExpanded: boolean;
  taxNetPercent: number;
  taxRate: number;
  effectiveBartering: number;
  onRemove: (resultName: string) => void;
  onToggleDetails: (resultName: string) => void;
  onOpenItem: (name: string) => void;
  onUpdateRecipePrice: (resultName: string, raw: string) => void;
  onUpdateMaterialPrice: (resultName: string, materialName: string, raw: string) => void;
  onUpdateSellPrice: (resultName: string, raw: string) => void;
  onSetRecipeUses: (recipe: MythicRecipe, value: string | number) => void;
}

export function MythicProjectCard({
  row,
  isProjectExpanded,
  taxNetPercent,
  taxRate,
  effectiveBartering,
  onRemove,
  onToggleDetails,
  onOpenItem,
  onUpdateRecipePrice,
  onUpdateMaterialPrice,
  onUpdateSellPrice,
  onSetRecipeUses,
}: MythicProjectCardProps) {
  const detailsId = `mythic-project-${row.recipe.resultName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")}-details`;

  return (
    <Card className={`${styles.projectCard} ${isProjectExpanded ? styles.projectExpanded : ""}`}>
      <div className={styles.projectHeader}>
        <div className={styles.projectIdentity}>
          {row.recipe.imageUrl && (
            <GameImage
              src={row.recipe.imageUrl}
              alt={row.recipe.resultName}
              width={48}
              height={48}
              className={styles.projectArt}
            />
          )}
          <div className={styles.projectTitleBlock}>
            <div className={styles.projectTitleRow}>
              <button
                type="button"
                className={styles.projectTitleBtn}
                onClick={() => onOpenItem(row.recipe.resultName)}
              >
                <QualityText value={row.recipe.resultQuality}>{row.recipe.resultName}</QualityText>
              </button>
              <button
                type="button"
                className={styles.projectScrollLink}
                onClick={() => onOpenItem(row.recipe.recipeName)}
              >
                {row.recipe.recipeName}
              </button>
            </div>
            <div className={styles.inlineGroup}>
              <Badge size="sm" variant="mythic">
                Lv {row.recipe.level}
              </Badge>
              <Badge size="sm" variant="neutral">
                {formatCraftWindow(row.craftTimeSeconds)} / craft
              </Badge>
              <Badge size="sm" variant={getLiquidityBadgeVariant(row.outputLiquidity.tone)}>
                {row.outputLiquidity.label} ({row.stableVol_3.toLocaleString()} 3d)
              </Badge>
              <Badge size="sm" variant="refined">
                +{formatGold(row.alchemyExpEach)} Alchemy | +{formatGold(row.speedExpPerCraft)} Speed
              </Badge>
            </div>
          </div>
        </div>

        <div className={styles.projectHeaderRight}>
          <div className={styles.projectRateBox}>
            <span className={`${styles.goldValue} ${row.profitPerHour >= 0 ? "text-success" : "text-danger"}`}>
              <GoldIcon size={14} />
              <strong>{formatSignedGold(row.profitPerHour)}/hr</strong>
            </span>
            <span className={styles.recipeSubline}>{formatSignedGold(row.profit)}/craft</span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className={styles.iconSquareBtn}
            aria-label={`Remove ${row.recipe.resultName} project`}
            onClick={() => onRemove(row.recipe.resultName)}
          >
            <Icon name="close" size="sm" aria-hidden="true" />
          </Button>
        </div>
      </div>

      <div className={styles.mobileCardSummary} aria-label={`${row.recipe.resultName} project summary`}>
        <div className={styles.metricStripCell}>
          <span className={styles.metricLabel}>Remaining</span>
          <span
            className={`${styles.metricValue} ${
              row.totalRemainingProfit >= 0 ? "text-success" : "text-danger"
            }`}
          >
            <GoldIcon size={12} />
            <span>{formatSignedGold(row.totalRemainingProfit)}</span>
          </span>
        </div>
        <div className={styles.metricStripCell}>
          <span className={styles.metricLabel}>Best Path</span>
          <span className={styles.metricValue}>{getBestPathLabel(row.bestPath)}</span>
        </div>
        <div className={styles.metricStripCell}>
          <span className={styles.metricLabel}>EXP / Hr</span>
          <span className={styles.metricValue}>{formatGold(row.expPerHour)}/hr</span>
        </div>
      </div>

      <Button
        variant="secondary"
        size="sm"
        className={styles.mobileDetailsToggle}
        aria-expanded={isProjectExpanded}
        aria-controls={detailsId}
        onClick={() => onToggleDetails(row.recipe.resultName)}
      >
        <span>{isProjectExpanded ? "Hide ledger & overrides" : "Edit recipe uses & prices"}</span>
        <Icon
          name={isProjectExpanded ? "chevronUp" : "chevronDown"}
          size="sm"
          aria-hidden="true"
        />
      </Button>

      <div className={styles.projectDetailsCollapse} id={detailsId}>
        <div className={styles.projectDetailsInner}>
          <div className={styles.projectLedgerGrid}>
            <section className={styles.projectColumn}>
              <div className={styles.subSection}>
                <div className={styles.subSectionHead}>
                  <Icon name="lore" size="sm" aria-hidden="true" />
                  <span>Recipe Overhead &amp; Uses</span>
                </div>

                <div className={styles.overheadInputsGrid}>
                  <div className={styles.fieldBlock}>
                    <div className={styles.fieldLabelRow}>
                      <span className={styles.fieldLabel}>Recipe Acquisition Price</span>
                      <Badge size="sm" variant={row.recipePrice > 0 ? "neutral" : "warning"}>
                        {formatSource(row.recipePriceSource)}
                      </Badge>
                    </div>
                    <div className={styles.inlineInputRow}>
                      <input
                        type="number"
                        inputMode="numeric"
                        min="0"
                        className={styles.inlinePriceInput}
                        aria-label={`Recipe acquisition price for ${row.recipe.recipeName}`}
                        placeholder={
                          row.recipePrice > 0 ? row.recipePrice.toLocaleString() : "No market data"
                        }
                        value={row.localRecipePrice ?? ""}
                        onChange={(e) => onUpdateRecipePrice(row.recipe.resultName, e.target.value)}
                      />
                      <span className={styles.inputUnitTag}>
                        <GoldIcon size={12} />
                        <span>{formatGold(row.recipeCostPerCraft, 1)}g/ea</span>
                      </span>
                    </div>
                  </div>

                  <div className={styles.usesStepperWrap}>
                    <NumberInput
                      label={`Uses Remaining (max ${row.recipe.maxUses})`}
                      min={1}
                      max={row.recipe.maxUses}
                      step={1}
                      showSteppers
                      ariaLabel={`Uses remaining for ${row.recipe.resultName}`}
                      value={row.usesLeft}
                      onChange={(val) => onSetRecipeUses(row.recipe, val)}
                    />
                  </div>
                </div>
              </div>

              <div className={styles.subSection}>
                <div className={styles.subSectionHead}>
                  <Icon name="items" size="sm" aria-hidden="true" />
                  <span>Material Ledger</span>
                  <span className={styles.subSectionTotal}>
                    <GoldIcon size={12} />
                    <span>{formatGold(row.materialCost, 1)}g / craft</span>
                  </span>
                </div>

                <div className={styles.materialsList}>
                  {row.materialBreakdown.map((material) => (
                    <div key={material.name} className={styles.materialRow}>
                      <div className={styles.materialIdentity}>
                        {material.imageUrl && (
                          <GameImage
                            src={material.imageUrl}
                            alt={material.name}
                            width={28}
                            height={28}
                            className={styles.materialThumb}
                          />
                        )}
                        <span className={styles.materialQty}>{material.qty}x</span>
                        <button
                          type="button"
                          className={styles.tableItemBtn}
                          onClick={() => onOpenItem(material.name)}
                        >
                          <QualityText value={material.quality || "STANDARD"}>
                            {material.name}
                          </QualityText>
                        </button>
                      </div>

                      <div className={styles.materialPriceControls}>
                        <Badge size="sm" variant={material.unitPrice > 0 ? "neutral" : "warning"}>
                          {formatSource(material.priceSource)}
                        </Badge>
                        <input
                          type="number"
                          inputMode="numeric"
                          min="0"
                          className={styles.materialPriceInput}
                          aria-label={`Custom unit price for ${material.name}`}
                          placeholder={
                            material.unitPrice > 0 ? material.unitPrice.toLocaleString() : "Missing"
                          }
                          value={material.localPrice ?? ""}
                          onChange={(e) =>
                            onUpdateMaterialPrice(row.recipe.resultName, material.name, e.target.value)
                          }
                        />
                        <span className={styles.materialSubtotal}>
                          <GoldIcon size={12} />
                          <span>{formatGold(material.total, 1)}g</span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className={styles.projectColumn}>
              <div className={styles.subSection}>
                <div className={styles.subSectionHead}>
                  <Icon name="gold" size="sm" aria-hidden="true" />
                  <span>Revenue &amp; Yield</span>
                </div>

                {row.marketWarnings.length > 0 && (
                  <Banner variant="warning">
                    <strong>{row.marketWarnings.join(", ")}:</strong> {row.outputLiquidity.note}
                  </Banner>
                )}

                <div className={styles.revenueGrid}>
                  <div className={styles.revenueBox}>
                    <div className={styles.fieldLabelRow}>
                      <span className={styles.fieldLabel}>Gross Sell Price</span>
                      <Badge size="sm" variant={row.marketGross > 0 ? "neutral" : "warning"}>
                        {formatSource(row.marketPriceSource)}
                      </Badge>
                    </div>
                    <div className={styles.inlineInputRow}>
                      <input
                        type="number"
                        inputMode="numeric"
                        min="0"
                        className={styles.inlinePriceInput}
                        aria-label={`Gross sell price for ${row.recipe.resultName}`}
                        placeholder={
                          row.marketGross > 0 ? row.marketGross.toLocaleString() : "No market data"
                        }
                        value={row.localSellPrice ?? ""}
                        onChange={(e) => onUpdateSellPrice(row.recipe.resultName, e.target.value)}
                      />
                      <span className={styles.inputUnitTag}>
                        <GoldIcon size={12} />
                        <span>{taxNetPercent}% net: {formatGold(row.revenue)}g</span>
                      </span>
                    </div>
                  </div>

                  <div
                    className={`${styles.vendorBox} ${
                      row.bestPath === "VENDOR" ? styles.vendorOptimal : ""
                    }`}
                  >
                    <div className={styles.vendorMeta}>
                      <span className={styles.fieldLabel}>
                        Vendor (+{effectiveBartering.toFixed(1).replace(/\.0$/, "")}% bartering)
                      </span>
                      <span className={styles.recipeSubline}>
                        Market tax is {Math.round(taxRate * 100)}%
                      </span>
                    </div>
                    <span className={styles.goldValue}>
                      <GoldIcon size={13} />
                      <strong>{formatGold(row.vendorRevenue)}g</strong>
                    </span>
                  </div>
                </div>

                <div className={styles.projectSummaryStrip}>
                  <div className={styles.metricStripCell}>
                    <span className={styles.metricLabel}>Best Path</span>
                    <span className={styles.metricValue}>
                      <Badge size="sm" variant={getBestPathVariant(row.bestPath)}>
                        {getBestPathLabel(row.bestPath)}
                      </Badge>
                    </span>
                  </div>
                  <div className={styles.metricStripCell}>
                    <span className={styles.metricLabel}>ROI</span>
                    <span
                      className={`${styles.metricValue} ${
                        row.roi >= 0 ? "text-success" : "text-danger"
                      }`}
                    >
                      {row.roi.toFixed(1)}%
                    </span>
                  </div>
                  <div className={styles.metricStripCell}>
                    <span className={styles.metricLabel}>EXP / Hr</span>
                    <span className={styles.metricValue}>{formatGold(row.expPerHour)}/hr</span>
                  </div>
                  <div className={styles.metricStripCell}>
                    <span className={styles.metricLabel}>Remaining ({row.usesLeft} uses)</span>
                    <span
                      className={`${styles.metricValue} ${
                        row.totalRemainingProfit >= 0 ? "text-success" : "text-danger"
                      }`}
                    >
                      <GoldIcon size={13} />
                      <strong>{formatSignedGold(row.totalRemainingProfit)}</strong>
                    </span>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </Card>
  );
}
