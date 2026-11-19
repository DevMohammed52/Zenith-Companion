"use client";

import React from "react";
import { Plus } from "lucide-react";
import type { MythicRecipe, MythicRecommendedRecipe } from "../types";
import styles from "../page.module.css";

export function MythicRecommendedRail({
  recommendedPreview,
  addToLab,
}: {
  recommendedPreview: MythicRecommendedRecipe[];
  addToLab: (recipe: MythicRecipe) => void;
}) {
  return (
    <section className={styles.quickAddRail} aria-label="Recommended mythic projects">
      <div>
        <span>Recommended to review</span>
        <strong>Add another recipe from current market data</strong>
      </div>
      <div className={styles.quickAddList}>
        {recommendedPreview.map(({ recipe, missingInputs, liquidity, complete }) => (
          <button
            key={recipe.resultName}
            type="button"
            className={styles.quickAddChip}
            onClick={() => addToLab(recipe)}
            aria-label={`Pin ${recipe.resultName}. ${
              complete ? "Prices complete" : `${missingInputs} missing input prices`
            }. ${liquidity.label}.`}
          >
            <Plus size={13} />
            <span>{recipe.resultName}</span>
            <em>{complete ? "Ready" : "Needs prices"}</em>
          </button>
        ))}
      </div>
    </section>
  );
}
