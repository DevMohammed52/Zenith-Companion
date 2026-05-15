import { getMarketLiquidity, getSafeMarketPrice, type MarketLiquidityInfo, type MarketPriceDatum } from "@/lib/market-pricing";

export type ForgeQuality = "REFINED" | "PREMIUM" | "EPIC" | "LEGENDARY" | "MYTHIC" | string;

export type ForgeDbItem = {
  hashed_id?: string;
  name?: string;
  description?: string;
  image_url?: string;
  type?: string;
  quality?: ForgeQuality;
  vendor_price?: number;
  is_tradeable?: boolean;
  recipe?: {
    skill?: string;
    level_required?: number;
    max_uses?: number;
    experience?: number;
    materials?: Array<{
      hashed_item_id?: string;
      item_name?: string;
      quantity?: number;
    }>;
    result?: {
      hashed_item_id?: string;
      item_name?: string;
    };
  } | null;
  where_to_find?: {
    dungeons?: Array<{ id?: number; name?: string }>;
    bosses?: Array<{ id?: number; name?: string }>;
    enemies?: Array<{ id?: number; name?: string }>;
  } | Array<unknown> | null;
};

export type ForgeItemLookup = Record<string, ForgeDbItem>;
export type ForgeMarketData = Record<string, MarketPriceDatum>;

export type ForgePlannerSettings = {
  customPrices?: Record<string, number>;
  membership?: boolean;
  barteringBoost?: number;
};

export type ForgePlannerLine = {
  recipeName: string;
  quantity: number;
  ownedRecipes: number;
};

export type ForgePlannerOwnedMaterials = Record<string, number>;

export type ForgePriceSource = "custom" | "market" | "vendor" | "missing";

export type ForgePrice = {
  value: number;
  source: ForgePriceSource;
  adjusted?: boolean;
};

export type ForgeRecipeOption = {
  recipeName: string;
  resultName: string;
  quality: ForgeQuality;
  levelRequired: number;
  maxUses: number;
  imageUrl: string;
  resultImageUrl: string;
  resultType: string;
  isTradeable: boolean;
  description: string;
  materials: Array<{
    name: string;
    quantity: number;
    imageUrl: string;
    quality: ForgeQuality;
    sourceSummary: string;
  }>;
  sourceSummary: string;
  searchText: string;
};

export type ForgeMaterialNeed = {
  name: string;
  imageUrl: string;
  quality: ForgeQuality;
  required: number;
  owned: number;
  missing: number;
  unitPrice: number;
  totalCost: number;
  source: ForgePriceSource;
  adjusted?: boolean;
  sourceSummary: string;
};

export type ForgeRecipeNeed = {
  recipeName: string;
  imageUrl: string;
  quality: ForgeQuality;
  requiredCrafts: number;
  maxUses: number;
  copiesNeeded: number;
  ownedCopies: number;
  missingCopies: number;
  unitPrice: number;
  totalCost: number;
  source: ForgePriceSource;
  adjusted?: boolean;
  sourceSummary: string;
};

export type ForgePlanEntry = {
  key: string;
  recipe: ForgeRecipeOption;
  quantity: number;
  ownedRecipes: number;
  recipeCopiesNeeded: number;
  recipeCopiesMissing: number;
  materialCost: number;
  recipeCost: number;
  totalMissingCost: number;
  outputMarketEach: number;
  outputVendorEach: number;
  outputValueEach: number;
  outputValueTotal: number;
  outputSource: "market" | "vendor" | "missing";
  liquidity: MarketLiquidityInfo;
  warnings: string[];
  materials: ForgeMaterialNeed[];
};

export type ForgePlannerSummary = {
  entries: ForgePlanEntry[];
  materialNeeds: ForgeMaterialNeed[];
  recipeNeeds: ForgeRecipeNeed[];
  totalCrafts: number;
  totalMissingCost: number;
  totalOutputValue: number;
  projectedNet: number;
  missingMaterialTypes: number;
  missingRecipeCopies: number;
  warnings: string[];
};

const QUALITY_RANK: Record<string, number> = {
  MYTHIC: 5,
  LEGENDARY: 4,
  EPIC: 3,
  PREMIUM: 2,
  REFINED: 1,
  STANDARD: 0,
};

export const FORGE_PLANNER_STORAGE_KEY = "zenith_forge_planner_v1";
export const FORGE_PLANNER_MAX_QTY = 999_999;

export function sanitizeForgeQuantity(value: unknown) {
  if (value === "") return "";
  const parsed = Math.floor(Number(value));
  if (!Number.isFinite(parsed) || parsed <= 0) return 0;
  return Math.min(parsed, FORGE_PLANNER_MAX_QTY);
}

export function sanitizeForgePlannerLines(value: unknown): ForgePlannerLine[] {
  if (!Array.isArray(value)) return [];
  return value.reduce<ForgePlannerLine[]>((next, line) => {
    if (!line || typeof line !== "object") return next;
    const input = line as Partial<ForgePlannerLine>;
    const recipeName = typeof input.recipeName === "string" ? input.recipeName.trim() : "";
    const quantity = sanitizeForgeQuantity(input.quantity);
    const ownedRecipes = sanitizeForgeQuantity(input.ownedRecipes);
    if (!recipeName) return next;
    next.push({
      recipeName,
      quantity: Number(quantity),
      ownedRecipes: ownedRecipes === "" ? 0 : Number(ownedRecipes || 0),
    });
    return next;
  }, []);
}

export function sanitizeForgeOwnedMaterials(value: unknown): ForgePlannerOwnedMaterials {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.entries(value).reduce<ForgePlannerOwnedMaterials>((next, [name, qty]) => {
    const clean = sanitizeForgeQuantity(qty);
    if (clean === "" || Number(clean) <= 0) return next;
    next[name] = Number(clean);
    return next;
  }, {});
}

export function buildForgeRecipeOptions(items: ForgeItemLookup | null | undefined): ForgeRecipeOption[] {
  if (!items) return [];
  const values = Object.values(items);
  return values
    .filter((item) => item.type === "RECIPE" && item.recipe?.skill === "Forge" && item.recipe.result?.item_name)
    .map((recipeItem) => {
      const resultName = recipeItem.recipe?.result?.item_name || "";
      const resultItem = items[resultName] || {};
      const materials = (recipeItem.recipe?.materials || [])
        .filter((material) => material.item_name && Number(material.quantity || 0) > 0)
        .map((material) => {
          const dbItem = items[material.item_name || ""] || {};
          return {
            name: material.item_name || "",
            quantity: Number(material.quantity || 0),
            imageUrl: dbItem.image_url || "",
            quality: dbItem.quality || "STANDARD",
            sourceSummary: summarizeSources(dbItem),
          };
        });
      const sourceSummary = summarizeSources(recipeItem);
      const resultType = resultItem.type || "";
      const quality = recipeItem.quality || resultItem.quality || "STANDARD";
      return {
        recipeName: recipeItem.name || "",
        resultName,
        quality,
        levelRequired: Number(recipeItem.recipe?.level_required || 0),
        maxUses: Math.max(1, Number(recipeItem.recipe?.max_uses || 1)),
        imageUrl: recipeItem.image_url || "",
        resultImageUrl: resultItem.image_url || recipeItem.image_url || "",
        resultType,
        isTradeable: recipeItem.is_tradeable !== false,
        description: recipeItem.description || "",
        materials,
        sourceSummary,
        searchText: [
          recipeItem.name,
          resultName,
          quality,
          resultType,
          `level ${recipeItem.recipe?.level_required || 0}`,
          sourceSummary,
          materials.map((material) => material.name).join(" "),
        ].join(" ").toLowerCase(),
      };
    })
    .filter((option) => option.recipeName && option.resultName && option.materials.length > 0)
    .sort((a, b) => {
      const qualityDelta = (QUALITY_RANK[b.quality] || 0) - (QUALITY_RANK[a.quality] || 0);
      return qualityDelta || b.levelRequired - a.levelRequired || a.resultName.localeCompare(b.resultName);
    });
}

export function calculateForgePlanner(
  lines: unknown,
  ownedMaterials: ForgePlannerOwnedMaterials,
  recipes: ForgeRecipeOption[],
  marketData: ForgeMarketData | null | undefined,
  items: ForgeItemLookup | null | undefined,
  settings: ForgePlannerSettings,
): ForgePlannerSummary {
  const recipesByName = new Map(recipes.map((recipe) => [recipe.recipeName, recipe]));
  const cleanLines = sanitizeForgePlannerLines(lines);
  const cleanOwnedMaterials = sanitizeForgeOwnedMaterials(ownedMaterials);
  const taxMultiplier = settings.membership ? 0.88 : 0.85;
  const barteringMultiplier = 1 + (Number(settings.barteringBoost || 0) / 100);
  const materialTotals = new Map<string, { required: number; recipeNames: string[] }>();
  const recipeNeeds = new Map<string, ForgeRecipeNeed>();
  const entries: ForgePlanEntry[] = [];
  const warnings = new Set<string>();

  for (const line of cleanLines) {
    const recipe = recipesByName.get(line.recipeName);
    if (!recipe) {
      warnings.add(`Unknown recipe skipped: ${line.recipeName}`);
      continue;
    }

    const materialRows = recipe.materials.map((material) => {
      const current = materialTotals.get(material.name) || { required: 0, recipeNames: [] };
      materialTotals.set(material.name, {
        required: current.required + material.quantity * line.quantity,
        recipeNames: current.recipeNames.includes(recipe.resultName)
          ? current.recipeNames
          : [...current.recipeNames, recipe.resultName],
      });
      const owned = Number(cleanOwnedMaterials[material.name] || 0);
      const missing = Math.max(0, material.quantity * line.quantity - owned);
      const price = getForgeAcquisitionPrice(material.name, marketData, items, settings.customPrices || {});
      return {
        name: material.name,
        imageUrl: material.imageUrl,
        quality: material.quality,
        required: material.quantity * line.quantity,
        owned,
        missing,
        unitPrice: price.value,
        totalCost: missing * price.value,
        source: price.source,
        adjusted: price.adjusted,
        sourceSummary: material.sourceSummary,
      };
    });

    const copiesNeeded = Math.ceil(line.quantity / recipe.maxUses);
    const copiesMissing = Math.max(0, copiesNeeded - line.ownedRecipes);
    const recipePrice = getForgeAcquisitionPrice(recipe.recipeName, marketData, items, settings.customPrices || {});
    const currentRecipeNeed = recipeNeeds.get(recipe.recipeName);
    recipeNeeds.set(recipe.recipeName, {
      recipeName: recipe.recipeName,
      imageUrl: recipe.imageUrl,
      quality: recipe.quality,
      requiredCrafts: (currentRecipeNeed?.requiredCrafts || 0) + line.quantity,
      maxUses: recipe.maxUses,
      copiesNeeded: (currentRecipeNeed?.copiesNeeded || 0) + copiesNeeded,
      ownedCopies: (currentRecipeNeed?.ownedCopies || 0) + line.ownedRecipes,
      missingCopies: (currentRecipeNeed?.missingCopies || 0) + copiesMissing,
      unitPrice: recipePrice.value,
      totalCost: (currentRecipeNeed?.totalCost || 0) + copiesMissing * recipePrice.value,
      source: recipePrice.source,
      adjusted: recipePrice.adjusted,
      sourceSummary: recipe.sourceSummary,
    });

    const resultMarket = getSafeMarketPrice(marketData?.[recipe.resultName]);
    const resultVendor = Number(items?.[recipe.resultName]?.vendor_price || marketData?.[recipe.resultName]?.vendor_price || 0) * barteringMultiplier;
    const outputMarketEach = recipe.isTradeable && resultMarket.value > 0 ? resultMarket.value * taxMultiplier : 0;
    const outputVendorEach = resultVendor > 0 ? resultVendor : 0;
    const outputSource = outputMarketEach <= 0 && outputVendorEach <= 0 ? "missing" : outputVendorEach > outputMarketEach ? "vendor" : "market";
    const outputValueEach = outputSource === "vendor" ? outputVendorEach : outputMarketEach;
    const materialCost = materialRows.reduce((sum, row) => sum + row.totalCost, 0);
    const recipeCost = copiesMissing * recipePrice.value;
    const entryWarnings: string[] = [];
    const liquidity = getMarketLiquidity(marketData?.[recipe.resultName]);

    for (const row of materialRows) {
      if (row.missing > 0 && row.source === "missing") entryWarnings.push(`Missing price for ${row.name}`);
      if (row.adjusted) entryWarnings.push(`${row.name} uses guarded market price`);
    }
    if (copiesMissing > 0 && recipePrice.source === "missing") entryWarnings.push("Recipe copy has no usable price");
    if (recipePrice.adjusted) entryWarnings.push("Recipe copy uses guarded market price");
    if (outputSource === "market" && liquidity.tone === "thin") entryWarnings.push("Output market is thin");
    if (outputSource === "market" && liquidity.tone === "risk") entryWarnings.push("Output market has spike risk");
    if (outputSource === "missing") entryWarnings.push("Output has no market/vendor value");
    entryWarnings.forEach((warning) => warnings.add(`${recipe.resultName}: ${warning}`));

    entries.push({
      key: `${recipe.recipeName}:${entries.length}`,
      recipe,
      quantity: line.quantity,
      ownedRecipes: line.ownedRecipes,
      recipeCopiesNeeded: copiesNeeded,
      recipeCopiesMissing: copiesMissing,
      materialCost,
      recipeCost,
      totalMissingCost: materialCost + recipeCost,
      outputMarketEach,
      outputVendorEach,
      outputValueEach,
      outputValueTotal: outputValueEach * line.quantity,
      outputSource,
      liquidity,
      warnings: Array.from(new Set(entryWarnings)),
      materials: materialRows,
    });
  }

  const materialNeeds = Array.from(materialTotals.entries()).map(([name, total]) => {
    const dbItem = items?.[name] || {};
    const owned = Number(cleanOwnedMaterials[name] || 0);
    const missing = Math.max(0, total.required - owned);
    const price = getForgeAcquisitionPrice(name, marketData, items, settings.customPrices || {});
    return {
      name,
      imageUrl: dbItem.image_url || "",
      quality: dbItem.quality || "STANDARD",
      required: total.required,
      owned,
      missing,
      unitPrice: price.value,
      totalCost: missing * price.value,
      source: price.source,
      adjusted: price.adjusted,
      sourceSummary: summarizeSources(dbItem),
    };
  }).sort((a, b) => b.totalCost - a.totalCost || b.missing - a.missing || a.name.localeCompare(b.name));

  const recipeRows = Array.from(recipeNeeds.values())
    .map((row) => ({
      ...row,
      missingCopies: Math.max(0, row.copiesNeeded - row.ownedCopies),
      totalCost: Math.max(0, row.copiesNeeded - row.ownedCopies) * row.unitPrice,
    }))
    .sort((a, b) => b.totalCost - a.totalCost || b.missingCopies - a.missingCopies || a.recipeName.localeCompare(b.recipeName));

  const totalMissingCost = entries.reduce((sum, entry) => sum + entry.totalMissingCost, 0);
  const totalOutputValue = entries.reduce((sum, entry) => sum + entry.outputValueTotal, 0);

  return {
    entries,
    materialNeeds,
    recipeNeeds: recipeRows,
    totalCrafts: entries.reduce((sum, entry) => sum + entry.quantity, 0),
    totalMissingCost,
    totalOutputValue,
    projectedNet: totalOutputValue - totalMissingCost,
    missingMaterialTypes: materialNeeds.filter((row) => row.missing > 0).length,
    missingRecipeCopies: recipeRows.reduce((sum, row) => sum + row.missingCopies, 0),
    warnings: Array.from(warnings),
  };
}

export function getForgeAcquisitionPrice(
  name: string,
  marketData: ForgeMarketData | null | undefined,
  items: ForgeItemLookup | null | undefined,
  customPrices: Record<string, number>,
): ForgePrice {
  const custom = Number(customPrices?.[name] || 0);
  if (custom > 0) return { value: custom, source: "custom" };
  const market = getSafeMarketPrice(marketData?.[name]);
  if (market.value > 0) return { value: market.value, source: "market", adjusted: market.adjusted };
  const vendor = Number(items?.[name]?.vendor_price || marketData?.[name]?.vendor_price || 0);
  if (vendor > 0) return { value: vendor, source: "vendor" };
  return { value: 0, source: "missing" };
}

function summarizeSources(item: ForgeDbItem | undefined) {
  if (!item) return "No source data";
  const where = item.where_to_find;
  if (!where || Array.isArray(where)) return "No source data";
  const chunks: string[] = [];
  if (Array.isArray(where.dungeons) && where.dungeons.length) chunks.push(`${where.dungeons.map((source) => source.name).filter(Boolean).join(", ")}`);
  if (Array.isArray(where.bosses) && where.bosses.length) chunks.push(`${where.bosses.map((source) => source.name).filter(Boolean).join(", ")}`);
  if (Array.isArray(where.enemies) && where.enemies.length) chunks.push(`${where.enemies.map((source) => source.name).filter(Boolean).join(", ")}`);
  return chunks.join(" | ") || "No source data";
}
