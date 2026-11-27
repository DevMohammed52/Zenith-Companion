"use client";

import { GameImage } from "@/components/GameImage";
import { GoldIcon } from "@/components/GoldIcon";
import {
  Badge,
  Button,
  EmptyState,
  Icon,
  SegmentedControl,
} from "@/components/ui";
import {
  RECIPE_COST_MODE_HELP,
  type MythicLabSummary,
  type MythicProjectRow,
  type MythicRecipe,
  type MythicRecipeCostMode,
  type MythicRecommendedRecipe,
} from "../types";
import { formatGold, formatSignedGold } from "../utils/mythic-helpers";
import { MythicProjectCard } from "./MythicProjectCard";
import styles from "../page.module.css";

interface MythicPinnedPanelProps {
  activeRows: MythicProjectRow[];
  recommendedPreview: MythicRecommendedRecipe[];
  labSummary: MythicLabSummary;
  recipeCostMode: MythicRecipeCostMode;
  setRecipeCostMode: (mode: MythicRecipeCostMode) => void;
  expandedProjectNames: string[];
  taxNetPercent: number;
  taxRate: number;
  effectiveBartering: number;
  onBrowseCatalog: () => void;
  onPinRecipe: (recipe: MythicRecipe) => void;
  onRemoveProject: (resultName: string) => void;
  onToggleDetails: (resultName: string) => void;
  onOpenItem: (name: string) => void;
  onUpdateRecipePrice: (resultName: string, raw: string) => void;
  onUpdateMaterialPrice: (resultName: string, materialName: string, raw: string) => void;
  onUpdateSellPrice: (resultName: string, raw: string) => void;
  onSetRecipeUses: (recipe: MythicRecipe, value: string | number) => void;
}

export function MythicPinnedPanel({
  activeRows,
  recommendedPreview,
  labSummary,
  recipeCostMode,
  setRecipeCostMode,
  expandedProjectNames,
  taxNetPercent,
  taxRate,
  effectiveBartering,
  onBrowseCatalog,
  onPinRecipe,
  onRemoveProject,
  onToggleDetails,
  onOpenItem,
  onUpdateRecipePrice,
  onUpdateMaterialPrice,
  onUpdateSellPrice,
  onSetRecipeUses,
}: MythicPinnedPanelProps) {
  return (
    <div className={styles.sectionStack}>
      <section className={styles.pinnedControlBar} aria-label="Pinned recipe controls">
        <div className={styles.pinnedControlLeft}>
          <div className={styles.pinnedModeRow}>
            <span className={styles.fieldLabel}>Recipe Cost Mode</span>
            <SegmentedControl
              ariaLabel="Recipe cost amortization mode"
              size="sm"
              value={recipeCostMode}
              onChange={(val) => setRecipeCostMode(val as MythicRecipeCostMode)}
              options={[
                { value: "full", label: "Full (30u)" },
                { value: "remaining", label: "Remaining uses" },
                { value: "owned", label: "Owned" },
              ]}
            />
          </div>
          <p className={styles.recipeSubline}>{RECIPE_COST_MODE_HELP[recipeCostMode]}</p>
        </div>

        <div className={styles.pinnedControlRight}>
          <div className={styles.pinnedTotalsStrip}>
            <div className={styles.metricStripCell}>
              <span className={styles.metricLabel}>Remaining Profit</span>
              <span
                className={`${styles.metricValue} ${
                  activeRows.length === 0
                    ? ""
                    : labSummary.totalPotentialProfit >= 0
                      ? "text-success"
                      : "text-danger"
                }`}
              >
                <GoldIcon size={13} />
                <strong>{formatSignedGold(labSummary.totalPotentialProfit)}</strong>
              </span>
            </div>
            <div className={styles.metricStripCell}>
              <span className={styles.metricLabel}>Remaining EXP</span>
              <span className={styles.metricValue}>
                {formatGold(labSummary.totalRemainingExp)} XP
              </span>
            </div>
          </div>

          <Button variant="secondary" size="sm" onClick={onBrowseCatalog}>
            <Icon name="plus" size="xs" aria-hidden="true" />
            <span>Browse 21 Recipes</span>
          </Button>
        </div>
      </section>

      {activeRows.length > 0 && recommendedPreview.length > 0 && (
        <section className={styles.quickPinRail} aria-label="Profitable mythic recipes to pin">
          <span className={styles.quickPinLabel}>Quick pin profitable</span>
          <div className={styles.quickPinChips}>
            {recommendedPreview.map(({ recipe, profitPerHour, complete }) => (
              <button
                key={recipe.resultName}
                type="button"
                className={styles.quickPinChip}
                onClick={() => onPinRecipe(recipe)}
                aria-label={`Pin ${recipe.resultName}`}
              >
                {recipe.imageUrl && (
                  <GameImage
                    src={recipe.imageUrl}
                    alt=""
                    width={20}
                    height={20}
                    className={styles.quickPinThumb}
                  />
                )}
                <span>{recipe.resultName}</span>
                {complete ? (
                  <Badge size="sm" variant={profitPerHour >= 0 ? "success" : "warning"}>
                    {formatSignedGold(profitPerHour)}/hr
                  </Badge>
                ) : (
                  <Badge size="sm" variant="warning">
                    Needs prices
                  </Badge>
                )}
                <Icon name="plus" size="xs" aria-hidden="true" />
              </button>
            ))}
          </div>
        </section>
      )}

      {activeRows.length === 0 ? (
        <div className={styles.emptyStack}>
          <EmptyState
            icon="alchemy"
            title="No active Mythic recipes pinned"
            description="Pin a Level 90 recipe from the 21-recipe catalog or pick one below to track remaining uses, override custom buy/sell prices, and model remaining batch profit."
            action={{
              label: "Browse All 21 Recipes",
              icon: "search",
              onClick: onBrowseCatalog,
            }}
          />

          {recommendedPreview.length > 0 && (
            <section className={styles.recommendedGridWrap} aria-label="Top Mythic recipes by profit">
              <div className={styles.subSectionHead}>
                <Icon name="skillProfit" size="sm" aria-hidden="true" />
                <span>Top candidates ranked by Profit / Hr</span>
              </div>
              <div className={styles.recommendedGrid}>
                {recommendedPreview.map(({ recipe, profitPerHour, complete, liquidity }) => (
                  <button
                    key={recipe.resultName}
                    type="button"
                    className={styles.recommendedCardBtn}
                    onClick={() => onPinRecipe(recipe)}
                  >
                    <div className={styles.recommendedCardLeft}>
                      {recipe.imageUrl && (
                        <GameImage
                          src={recipe.imageUrl}
                          alt={recipe.resultName}
                          width={34}
                          height={34}
                          className={styles.tableRecipeIcon}
                        />
                      )}
                      <div className={styles.tableRecipeText}>
                        <strong>{recipe.resultName}</strong>
                        <span className={styles.recipeSubline}>
                          {recipe.maxUses} uses | {liquidity.label}
                        </span>
                      </div>
                    </div>
                    <div className={styles.recommendedCardRight}>
                      {complete ? (
                        <span
                          className={`${styles.goldValue} ${
                            profitPerHour >= 0 ? "text-success" : "text-danger"
                          }`}
                        >
                          <GoldIcon size={12} />
                          <strong>{formatSignedGold(profitPerHour)}/hr</strong>
                        </span>
                      ) : (
                        <Badge size="sm" variant="warning">
                          Needs prices
                        </Badge>
                      )}
                      <span className={styles.pinCue}>
                        <Icon name="plus" size="xs" aria-hidden="true" />
                        <span>Pin</span>
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>
      ) : (
        <div className={styles.projectsStack}>
          {activeRows.map((row) => (
            <MythicProjectCard
              key={row.recipe.resultName}
              row={row}
              isProjectExpanded={expandedProjectNames.includes(row.recipe.resultName)}
              taxNetPercent={taxNetPercent}
              taxRate={taxRate}
              effectiveBartering={effectiveBartering}
              onRemove={onRemoveProject}
              onToggleDetails={onToggleDetails}
              onOpenItem={onOpenItem}
              onUpdateRecipePrice={onUpdateRecipePrice}
              onUpdateMaterialPrice={onUpdateMaterialPrice}
              onUpdateSellPrice={onUpdateSellPrice}
              onSetRecipeUses={onSetRecipeUses}
            />
          ))}
        </div>
      )}
    </div>
  );
}
