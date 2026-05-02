import { getRecipeUses, normalizeProductName } from './logic-core.mjs';

export { getRecipeUses, normalizeProductName };

export interface RecipeIngredient {
  name?: string;
  item_name?: string;
  amount?: number;
  quantity?: number;
  price?: number;
}

/**
 * Calculates the total material cost for a recipe.
 */
export function calculateMaterialCost(ingredients: RecipeIngredient[]): number {
  return ingredients.reduce((total, ing) => {
    const price = ing.price || 0;
    const amount = ing.amount || ing.quantity || 1;
    return total + (price * amount);
  }, 0);
}
