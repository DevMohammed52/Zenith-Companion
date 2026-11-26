/**
 * Shared core logic for Zenith Companion (ESM)
 * This file is used by both the Next.js app and the maintenance scripts.
 */

/**
 * Extracts skill and stat experience from either legacy numeric or live `{ skills, stats }` recipe experience objects.
 */
export function getRecipeExperienceInfo(experience, preferredSkill = '') {
  if (typeof experience === 'number' && Number.isFinite(experience)) {
    return { skillExp: experience, stats: {}, skills: {} };
  }
  if (!experience || typeof experience !== 'object') {
    return { skillExp: 0, stats: {}, skills: {} };
  }
  const skills = experience.skills && typeof experience.skills === 'object' ? experience.skills : {};
  const stats = experience.stats && typeof experience.stats === 'object' ? experience.stats : {};
  const preferredKey = String(preferredSkill || '').trim().toLowerCase();
  let skillExp = 0;
  if (preferredKey && Number.isFinite(Number(skills[preferredKey]))) {
    skillExp = Number(skills[preferredKey]);
  } else {
    const firstSkillVal = Object.values(skills).find((v) => Number.isFinite(Number(v)));
    skillExp = firstSkillVal !== undefined ? Number(firstSkillVal) : 0;
  }
  return { skillExp, stats, skills };
}

/**
 * Determines how many times a recipe can be used based on API max_uses, type, and quality.
 */
export function getRecipeUses(item) {
  const apiMaxUses = item?.recipe?.max_uses ?? item?.produced_from?.max_uses;
  if (apiMaxUses === null) {
    return 'Infinite';
  }
  if (typeof apiMaxUses === 'number' && Number.isFinite(apiMaxUses) && apiMaxUses > 0) {
    return apiMaxUses;
  }

  const name = item.name || "";
  const skill = (item.recipe?.skill || item.produced_from?.skill || "").toUpperCase();
  const quality = item.recipe_quality || item.produced_from?.recipe_quality || item.quality || "STANDARD";
  
  // Forge recipes are always 1-time use
  if (skill === 'FORGE' || skill === 'FORGING' || skill === 'SMITHING') {
    return 1;
  }
  
  // Alchemy logic fallback when max_uses is absent or 0
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
