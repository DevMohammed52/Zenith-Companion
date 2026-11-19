"use client";

import React from "react";
import Image from "next/image";
import { Hammer, Plus } from "lucide-react";
import type { MythicRecipe, MythicRecommendedRecipe } from "../types";
import styles from "../page.module.css";

export function MythicEmptyBench({
  onOpenSearch,
  recommendedRecipes,
  recommendedPreview,
  addToLab,
}: {
  onOpenSearch: () => void;
  recommendedRecipes: MythicRecommendedRecipe[];
  recommendedPreview: MythicRecommendedRecipe[];
  addToLab: (recipe: MythicRecipe) => void;
}) {
  return (
    <div className={styles.emptyBench}>
      <div className={styles.emptyIcon}>
        <Hammer size={48} />
      </div>
      <h2>No Active Projects</h2>
      <p>
        Pin a mythic alchemy recipe to evaluate materials, recipe cost, market/vendor revenue, and
        remaining-use value.
      </p>
      <button type="button" className={styles.emptyAddBtn} onClick={onOpenSearch}>
        <Plus size={18} /> Add Your First Recipe
      </button>
      {recommendedRecipes.length > 0 && (
        <div className={styles.recipeIndex} aria-label="Recommended mythic recipes to review">
          <span className={styles.recipeIndexLabel}>Recommended to review</span>
          {recommendedPreview.map(
            ({ recipe, outputPrice, recipePrice, missingInputs, liquidity, complete }) => (
              <button
                key={recipe.resultName}
                type="button"
                className={styles.recipeIndexRow}
                onClick={() => addToLab(recipe)}
                aria-label={`Pin ${recipe.resultName}. ${
                  complete ? "Prices complete" : `${missingInputs} missing input prices`
                }. ${liquidity.label}.`}
              >
                {recipe.imageUrl ? (
                  <Image
                    src={recipe.imageUrl}
                    alt=""
                    width={38}
                    height={38}
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <span className={styles.recipeIndexFallback} />
                )}
                <span>
                  <strong>{recipe.resultName}</strong>
                  <small>
                    Lvl {recipe.level} - {recipe.maxUses} uses - {liquidity.label}
                  </small>
                </span>
                <em>
                  {complete
                    ? "Ready"
                    : outputPrice.price <= 0 || recipePrice.price <= 0
                      ? "Needs prices"
                      : `${missingInputs} missing`}
                </em>
              </button>
            ),
          )}
        </div>
      )}
    </div>
  );
}
