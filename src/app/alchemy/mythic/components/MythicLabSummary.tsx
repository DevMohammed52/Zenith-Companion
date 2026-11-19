"use client";

import React from "react";
import { CheckCircle2, Clock3 } from "lucide-react";
import {
  RECIPE_COST_MODE_HELP,
  type MythicLabSummary as MythicLabSummaryType,
  type MythicRecipeCostMode,
} from "../types";
import { formatSignedGold } from "../utils/mythic-helpers";
import styles from "../page.module.css";

export function MythicLabSummary({
  labSummary,
  activeRowsCount,
  mythicRecipesCount,
  recipeCostMode,
  setRecipeCostMode,
}: {
  labSummary: MythicLabSummaryType;
  activeRowsCount: number;
  mythicRecipesCount: number;
  recipeCostMode: MythicRecipeCostMode;
  setRecipeCostMode: (mode: MythicRecipeCostMode) => void;
}) {
  return (
    <div className={styles.labSummary}>
      <div className={styles.summaryCard}>
        <div className={styles.summaryKicker}>
          <CheckCircle2 size={15} /> Projected Return
        </div>
        <div className={styles.summaryContent}>
          <span className={styles.summaryLabel}>Combined Remaining Profit</span>
          <span
            className={`${styles.summaryValue} ${
              labSummary.totalPotentialProfit >= 0 ? "text-success" : "text-danger"
            }`}
          >
            {formatSignedGold(labSummary.totalPotentialProfit)}
          </span>
        </div>
        <div className={styles.summaryHint}>
          {activeRowsCount > 0 && labSummary.best
            ? `Best rate: ${labSummary.best.recipe.resultName} at ${formatSignedGold(
                labSummary.best.profitPerHour,
              )}/hr`
            : `${mythicRecipesCount} database recipes available`}
        </div>
      </div>

      <div className={styles.modeCard}>
        <span className={styles.summaryLabel}>
          <Clock3 size={14} /> Recipe Cost Mode
        </span>
        <div className={styles.modeToggle} role="group" aria-label="Recipe cost mode">
          <button
            type="button"
            aria-pressed={recipeCostMode === "full"}
            className={recipeCostMode === "full" ? styles.active : ""}
            onClick={() => setRecipeCostMode("full")}
          >
            Full recipe
          </button>
          <button
            type="button"
            aria-pressed={recipeCostMode === "remaining"}
            className={recipeCostMode === "remaining" ? styles.active : ""}
            onClick={() => setRecipeCostMode("remaining")}
          >
            Remaining uses
          </button>
          <button
            type="button"
            aria-pressed={recipeCostMode === "owned"}
            className={recipeCostMode === "owned" ? styles.active : ""}
            onClick={() => setRecipeCostMode("owned")}
          >
            Owned
          </button>
        </div>
        <p className={styles.modeHelper}>{RECIPE_COST_MODE_HELP[recipeCostMode]}</p>
      </div>
    </div>
  );
}
