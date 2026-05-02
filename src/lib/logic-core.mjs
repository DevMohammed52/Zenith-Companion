/**
 * Shared core logic for Zenith Companion (ESM)
 * This file is used by both the Next.js app and the maintenance scripts.
 */

/**
 * Determines how many times a recipe can be used based on its type and quality.
 */
export function getRecipeUses(item) {
  const name = item.name || "";
  const skill = (item.recipe?.skill || item.produced_from?.skill || "").toUpperCase();
  const quality = item.recipe_quality || item.produced_from?.recipe_quality || item.quality || "STANDARD";
  
  // Forge recipes are always 1-time use
  if (skill === 'FORGING' || skill === 'SMITHING') {
    return 1;
  }
  
  // Alchemy logic
  if (skill === 'ALCHEMY' || name.toLowerCase().includes('essence') || name.toLowerCase().includes('elixir')) {
    if (quality === 'MYTHIC') {
      return 30;
    }
    return 'Infinite'; 
  }
  
  // Default for other skills (Cooking, etc.)
  return 1;
}

/**
 * Normalizes item names for recipe linking
 */
export function normalizeProductName(name) {
  return name
    .replace(/^Recipe:\s*/i, '')
    .replace(/\s*Recipe$/i, '')
    .replace(/\s*\(Untradable\)$/i, '')
    .trim();
}
