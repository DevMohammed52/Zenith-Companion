import type { MarketPriceDatum } from "@/lib/market-pricing";
import { getSafeMarketValue } from "@/lib/market-pricing";
import { getQualityRank } from "@/lib/quality";
import type { CharacterProfile } from "@/lib/profiles";
import {
  ARMOR_SLOTS,
  COMBAT_TYPES,
  evaluateScore,
  getPrice,
  requirementStatus,
  type CombatStyle,
  type GearItem,
  type GearType,
  type Priority,
} from "../types";

export type TierMode = "base" | "optimal" | "max";

export interface UpgradeMaterialLine {
  hashedId: string;
  name: string;
  quantityPerStep: number;
  unitPrice: number | null;
  imageUrl?: string;
}

export interface UpgradeCostSummary {
  stepCost: number;
  totalStoneCost: number;
  hasAllPrices: boolean;
  requiresSoulstone: boolean;
  materials: Array<{
    hashedId: string;
    name: string;
    quantity: number;
    unitPrice: number | null;
    totalCost: number | null;
    imageUrl?: string;
  }>;
}

export interface OptimalTierAnalysis {
  item: GearItem;
  optimalTier: number;
  maxTier: number;
  reason: string;
  costTag: "Stones only" | "High Soulstone cost" | "Single tier";
  stepCost: number | null;
  scoreAtBase: number;
  scoreAtOptimal: number;
  scoreAtMax: number;
  totalInvestedAtOptimal: number | null;
  nextBetterItemName: string | null;
  nextBetterItemPrice: number | null;
}

export interface EquippedSlotBaseline {
  slotKey: string;
  gearType: GearType;
  label: string;
  item: GearItem | null;
  tier: number;
  stats: Record<string, number>;
  score: number;
}

export interface NextUpgradeMove {
  id: string;
  kind: "upgrade" | "equip";
  slotKey: string;
  slotLabelText: string;
  gearType: GearType;
  targetItem: GearItem;
  fromItem: GearItem | null;
  fromTier: number;
  toTier: number;
  scoreGain: number;
  totalCost: number | null;
  goldPerPoint: number | null;
  stoneCostOnly: number;
  missingPriceNote: string | null;
  statDeltas: Record<string, number>;
  eligible: boolean;
  unmet: string[];
  reason: string;
  isOptimalStop: boolean;
}

const SLOT_LABELS_FRIENDLY: Record<string, string> = {
  weapon: "Main Weapon",
  offhandWeapon: "Offhand Dagger",
  bow: "Bow",
  shield: "Shield",
  helmet: "Helmet",
  chestplate: "Chestplate",
  greaves: "Greaves",
  boots: "Boots",
  gauntlets: "Gauntlets",
};

const UPGRADE_STONE_FALLBACK_IMAGES: Record<string, string> = {
  "Weapon Upgrade Stone": "https://cdn.idle-mmo.com/uploaded/skins/IVVOGOYCwrTqLN3o2HyUZWemFBrhfE-metad2VhcG9uX3VwZ3JhZGVfc3RvbmUucG5n-.png",
  "Shield Upgrade Stone": "https://cdn.idle-mmo.com/uploaded/skins/yxJpHcGtUdeoACZ67olh1PNbwJLrkl-metac2hpZWxkX3VwZ3JhZGVfc3RvbmUucG5n-.png",
  "Helmet Upgrade Stone": "https://cdn.idle-mmo.com/uploaded/skins/W4uNiENI2HpwzrlNANy37uHfLakFfw-metaaGVsbWV0X3VwZ3JhZGVfc3RvbmUucG5n-.png",
  "Chestplate Upgrade Stone": "https://cdn.idle-mmo.com/uploaded/skins/UTKmNQrVG2Q96B7TxI5vZoSt2TPwMj-metaY2hlc3RwbGF0ZV91cGdyYWRlX3N0b25lLnBuZw==-.png",
  "Greaves Upgrade Stone": "https://cdn.idle-mmo.com/uploaded/skins/3q0Q4y2B8A6Q3X9Z9Q9q3Z8W4kL2jH-metaz3JlYXZlc191cGdyYWRlX3N0b25lLnBuZw==-.png",
  "Boots Upgrade Stone": "https://cdn.idle-mmo.com/uploaded/skins/zodAbqQ5X6oZ66dfuaWBH3RuHqvelS-metaYm9vdHNfdXBncmFkZV9zdG9uZS5wbmc=-.png",
  "Gauntlets Upgrade Stone": "https://cdn.idle-mmo.com/uploaded/skins/3OtNfDxvwelVztXtOwMx4DcMEyMciX-metaZ2F1bnRsZXRfdXBncmFkZV9zdG9uZS5wbmc=-.png",
  "Dragon Soulstone": "https://cdn.idle-mmo.com/uploaded/skins/01HXVFKQKPC4N8XM0RN3X9CSPH.png",
};

export function normalizeCombatCatalog(
  allItemsDb: Record<string, any> | null | undefined,
  fallbackItems: GearItem[] = [],
): GearItem[] {
  const deduped = new Map<string, GearItem>();

  if (allItemsDb && typeof allItemsDb === "object") {
    for (const raw of Object.values(allItemsDb)) {
      if (!raw || typeof raw !== "object") continue;
      const type = String(raw.type || "").toUpperCase();
      if (!COMBAT_TYPES.has(type as GearType)) continue;
      const stats = raw.stats && typeof raw.stats === "object" ? raw.stats : null;
      if (!stats || Object.keys(stats).length === 0) continue;

      const item: GearItem = {
        hashed_id: String(raw.hashed_id || raw.id || raw.name),
        name: String(raw.name || ""),
        type,
        quality: String(raw.quality || "STANDARD"),
        image_url: raw.image_url ? String(raw.image_url) : undefined,
        vendor_price: raw.vendor_price != null ? Number(raw.vendor_price) : null,
        is_tradeable: typeof raw.is_tradeable === "boolean" ? raw.is_tradeable : undefined,
        combat_req: raw.combat_req != null ? Number(raw.combat_req) : raw.requirements?.combat ?? null,
        requirements: raw.requirements || null,
        stats,
        tier_modifiers: raw.tier_modifiers || null,
        max_tier: Number(raw.max_tier || 1),
        upgrade_requirements: Array.isArray(raw.upgrade_requirements) ? raw.upgrade_requirements : [],
      };
      if (item.name) deduped.set(item.name.toLowerCase(), item);
    }
  }

  for (const fallback of fallbackItems) {
    const type = String(fallback.type || "").toUpperCase();
    if (!COMBAT_TYPES.has(type as GearType)) continue;
    const key = String(fallback.name || "").toLowerCase();
    // Skip legacy US spelling duplicates when canonical Armour exists
    if (
      (key === "dreadbane armor" && deduped.has("dreadbane armour")) ||
      (key === "soulguard armor" && deduped.has("soulguard armour"))
    ) {
      continue;
    }
    if (!deduped.has(key)) {
      deduped.set(key, fallback);
    }
  }

  return Array.from(deduped.values());
}

export function calculateGearStatsAtTier(item: GearItem | undefined, tierValue: number): Record<string, number> {
  if (!item?.stats) return {};
  const maxTier = Math.max(1, Number(item.max_tier || 1));
  const tier = Math.min(maxTier, Math.max(1, Math.round(Number(tierValue || 1))));
  const upgrades = Math.max(0, tier - 1);
  const result: Record<string, number> = {};
  for (const [stat, value] of Object.entries(item.stats)) {
    result[stat] = Number(value || 0);
  }
  for (const [stat, mod] of Object.entries(item.tier_modifiers || {})) {
    result[stat] = (result[stat] || 0) + Number(mod || 0) * upgrades;
  }
  return result;
}

export function getUpgradeMaterialLines(
  item: GearItem | undefined,
  marketData: unknown,
  allItemsDb?: Record<string, any> | null,
): UpgradeMaterialLine[] {
  if (!item?.upgrade_requirements?.length) return [];
  const marketLookup = marketData as Record<string, MarketPriceDatum | undefined> | null | undefined;
  return item.upgrade_requirements.map((req) => {
    const safePrice = getSafeMarketValue(marketLookup?.[req.item_name]);
    const unitPrice = Number.isFinite(Number(safePrice)) && Number(safePrice) > 0 ? Number(safePrice) : null;
    const dbItem = allItemsDb
      ? allItemsDb[req.hashed_item_id] ||
        Object.values(allItemsDb).find((entry) => entry?.name === req.item_name)
      : null;
    const imageUrl = dbItem?.image_url || UPGRADE_STONE_FALLBACK_IMAGES[req.item_name];
    return {
      hashedId: req.hashed_item_id,
      name: req.item_name,
      quantityPerStep: Number(req.quantity || 0),
      unitPrice,
      imageUrl,
    };
  });
}

export function calculateUpgradeCostBetweenTiers(
  item: GearItem | undefined,
  fromTier: number,
  toTier: number,
  marketData: unknown,
  allItemsDb?: Record<string, any> | null,
): UpgradeCostSummary {
  const steps = Math.max(0, Math.round(toTier) - Math.round(fromTier));
  const lines = getUpgradeMaterialLines(item, marketData, allItemsDb);
  const requiresSoulstone = lines.some((line) => line.name.toLowerCase().includes("soulstone"));
  let stepCost = 0;
  let hasAllPrices = lines.length > 0;

  const materials = lines.map((line) => {
    const quantity = line.quantityPerStep * steps;
    if (line.unitPrice === null) {
      hasAllPrices = false;
    } else {
      stepCost += line.unitPrice * line.quantityPerStep;
    }
    return {
      hashedId: line.hashedId,
      name: line.name,
      quantity,
      unitPrice: line.unitPrice,
      totalCost: line.unitPrice !== null ? line.unitPrice * quantity : null,
      imageUrl: line.imageUrl,
    };
  });

  if (lines.length === 0) {
    hasAllPrices = true;
  }

  return {
    stepCost,
    totalStoneCost: stepCost * steps,
    hasAllPrices,
    requiresSoulstone,
    materials,
  };
}

export function computeOptimalTierAnalysis(
  item: GearItem,
  sameTypeItems: GearItem[],
  priority: Priority,
  marketData: unknown,
  allItemsDb?: Record<string, any> | null,
): OptimalTierAnalysis {
  const maxTier = Math.max(1, Number(item.max_tier || 1));
  const baseStats = calculateGearStatsAtTier(item, 1);
  const maxStats = calculateGearStatsAtTier(item, maxTier);
  const scoreAtBase = evaluateScore(baseStats, priority);
  const scoreAtMax = evaluateScore(maxStats, priority);
  const itemPriceObj = getPrice(item, marketData);
  const itemBasePrice = itemPriceObj.value;
  const stepSummary = calculateUpgradeCostBetweenTiers(item, 1, 2, marketData, allItemsDb);
  const stepCost = stepSummary.hasAllPrices && stepSummary.stepCost > 0 ? stepSummary.stepCost : null;

  if (maxTier <= 1 || !item.tier_modifiers || Object.keys(item.tier_modifiers).length === 0) {
    return {
      item,
      optimalTier: 1,
      maxTier,
      reason: "Single-tier gear (cannot be upgraded).",
      costTag: "Single tier",
      stepCost: null,
      scoreAtBase,
      scoreAtOptimal: scoreAtBase,
      scoreAtMax: scoreAtBase,
      totalInvestedAtOptimal: itemBasePrice,
      nextBetterItemName: null,
      nextBetterItemPrice: null,
    };
  }

  // Cheapest strictly stronger item in the same slot that can be bought with gold on market
  const pricedStrongerPeers = sameTypeItems
    .filter((peer) => peer.hashed_id !== item.hashed_id)
    .map((peer) => {
      const peerPrice = getPrice(peer, marketData);
      const peerBaseScore = evaluateScore(calculateGearStatsAtTier(peer, 1), priority);
      return {
        peer,
        peerBaseScore,
        peerPrice: peerPrice.label === "Market" ? peerPrice.value : null,
      };
    })
    .filter((entry) => entry.peerPrice !== null && entry.peerBaseScore > scoreAtBase)
    .sort((a, b) => (a.peerPrice ?? Number.MAX_SAFE_INTEGER) - (b.peerPrice ?? Number.MAX_SAFE_INTEGER));

  const nextBetter = pricedStrongerPeers[0] ?? null;

  // If upgrading does not use Dragon Soulstones (Standard -> Legendary), stone steps are dramatically
  // cheaper per stat point than buying an un-upgraded Mythic, unless cumulative buy + upgrade
  // directly exceeds buying the next better item outright for lower score.
  if (!stepSummary.requiresSoulstone) {
    let bestTier = maxTier;
    if (stepCost !== null && itemBasePrice !== null && nextBetter?.peerPrice != null) {
      for (let t = 2; t <= maxTier; t += 1) {
        const totalCost = itemBasePrice + (t - 1) * stepCost;
        const scoreAtT = evaluateScore(calculateGearStatsAtTier(item, t), priority);
        if (totalCost >= nextBetter.peerPrice && scoreAtT <= nextBetter.peerBaseScore) {
          bestTier = t - 1;
          break;
        }
      }
    }
    const scoreAtOpt = evaluateScore(calculateGearStatsAtTier(item, bestTier), priority);
    const totalInvested =
      itemBasePrice !== null && stepCost !== null
        ? itemBasePrice + (bestTier - 1) * stepCost
        : null;

    let reason = `Upgrade to T${bestTier} (stones only, no Soulstone cost).`;
    if (bestTier < maxTier && nextBetter) {
      reason = `Stop at T${bestTier}; pushing past T${bestTier} costs more than buying ${nextBetter.peer.name} T1.`;
    } else if (nextBetter && scoreAtOpt >= nextBetter.peerBaseScore) {
      reason = `T${bestTier} surpasses ${nextBetter.peer.name} T1 while keeping cheap upgrade stones.`;
    }

    return {
      item,
      optimalTier: bestTier,
      maxTier,
      reason,
      costTag: "Stones only",
      stepCost,
      scoreAtBase,
      scoreAtOptimal: scoreAtOpt,
      scoreAtMax,
      totalInvestedAtOptimal: totalInvested,
      nextBetterItemName: nextBetter?.peer.name ?? null,
      nextBetterItemPrice: nextBetter?.peerPrice ?? null,
    };
  }

  // Mythic gear consumes 1x Dragon Soulstone (~336k+) per upgrade step.
  // Stop before cumulative cost exceeds buying the next stronger Mythic at T1 unless already near endgame BiS.
  let bestMythicTier = maxTier;
  if (stepCost !== null && nextBetter?.peerPrice != null) {
    const startCost = itemBasePrice ?? 0;
    const budgetGap = Math.max(0, nextBetter.peerPrice - startCost);
    const affordableStepsBeforeSwap = Math.floor(budgetGap / stepCost);
    // If an affordable T <= maxTier never cleanly surpasses the next Mythic before costing more, cap before swap
    const capped = Math.min(maxTier, 1 + affordableStepsBeforeSwap);
    const scoreAtCapped = evaluateScore(calculateGearStatsAtTier(item, capped), priority);
    if (capped < maxTier && (itemBasePrice === null || startCost < nextBetter.peerPrice)) {
      bestMythicTier = Math.max(1, capped);
      if (bestMythicTier === 1 && scoreAtCapped <= nextBetter.peerBaseScore) {
        bestMythicTier = 1;
      }
    }
  }

  const scoreAtOptimal = evaluateScore(calculateGearStatsAtTier(item, bestMythicTier), priority);
  const totalInvestedAtOptimal =
    itemBasePrice !== null && stepCost !== null
      ? itemBasePrice + (bestMythicTier - 1) * stepCost
      : null;

  let mythicReason = `Endgame bracket: invest Dragon Soulstones up to T${maxTier}.`;
  if (nextBetter && bestMythicTier === 1) {
    mythicReason = `Keep at T1 and save gold for ${nextBetter.peer.name} (~${Math.round((nextBetter.peerPrice || 0) / 1000).toLocaleString()}k).`;
  } else if (nextBetter && bestMythicTier < maxTier) {
    mythicReason = `Cap at T${bestMythicTier} before Soulstone cost catches ${nextBetter.peer.name} T1.`;
  }

  return {
    item,
    optimalTier: bestMythicTier,
    maxTier,
    reason: mythicReason,
    costTag: "High Soulstone cost",
    stepCost,
    scoreAtBase,
    scoreAtOptimal,
    scoreAtMax,
    totalInvestedAtOptimal,
    nextBetterItemName: nextBetter?.peer.name ?? null,
    nextBetterItemPrice: nextBetter?.peerPrice ?? null,
  };
}

export function getActiveEquippedBaselines(
  profile: CharacterProfile | null,
  combatStyle: CombatStyle,
  catalogByName: Record<string, GearItem | undefined>,
  priority: Priority,
): EquippedSlotBaseline[] {
  const weaponDefs: Array<{ slotKey: string; gearType: GearType }> =
    combatStyle === "dualDaggers"
      ? [
          { slotKey: "weapon", gearType: "DAGGER" },
          { slotKey: "offhandWeapon", gearType: "DAGGER" },
        ]
      : combatStyle === "bow"
        ? [{ slotKey: "bow", gearType: "BOW" }]
        : [
            { slotKey: "weapon", gearType: "SWORD" },
            { slotKey: "shield", gearType: "SHIELD" },
          ];

  const armorDefs: Array<{ slotKey: string; gearType: GearType }> = ARMOR_SLOTS.map((type) => ({
    slotKey: type.toLowerCase(),
    gearType: type,
  }));

  return [...weaponDefs, ...armorDefs].map(({ slotKey, gearType }) => {
    const equippedName = profile?.gear?.[slotKey as keyof typeof profile.gear] || "";
    const item = catalogByName[equippedName.toLowerCase()] || null;
    const rawTier = Number(profile?.gearTiers?.[slotKey] || 1);
    const maxTier = Math.max(1, Number(item?.max_tier || 1));
    const tier = item ? Math.min(maxTier, Math.max(1, rawTier)) : 1;
    const stats = item ? calculateGearStatsAtTier(item, tier) : {};
    return {
      slotKey,
      gearType,
      label: SLOT_LABELS_FRIENDLY[slotKey] || slotKey,
      item,
      tier,
      stats,
      score: item ? evaluateScore(stats, priority) : 0,
    };
  });
}

export function buildNextBestUpgrades(params: {
  baselines: EquippedSlotBaseline[];
  allItems: GearItem[];
  optimalByItemId: Record<string, OptimalTierAnalysis>;
  levels: Record<string, number>;
  priority: Priority;
  marketData: unknown;
  allItemsDb?: Record<string, any> | null;
  includeLocked?: boolean;
  maxBudget?: number | null;
}): NextUpgradeMove[] {
  const {
    baselines,
    allItems,
    optimalByItemId,
    levels,
    priority,
    marketData,
    allItemsDb,
    includeLocked = false,
    maxBudget = null,
  } = params;

  const moves: NextUpgradeMove[] = [];

  for (const base of baselines) {
    const slotItems = allItems.filter((item) => String(item.type).toUpperCase() === base.gearType);

    // 1. Upgrade owned item in this slot (immediate +1 step AND optimal target if higher)
    if (base.item) {
      const owned = base.item;
      const maxTier = Math.max(1, Number(owned.max_tier || 1));
      const opt = optimalByItemId[owned.hashed_id];
      const targetTiers = new Set<number>();
      if (base.tier < maxTier) {
        targetTiers.add(base.tier + 1);
        if (opt && opt.optimalTier > base.tier) targetTiers.add(opt.optimalTier);
        if (maxTier > base.tier) targetTiers.add(maxTier);
      }

      for (const targetTier of targetTiers) {
        const nextStats = calculateGearStatsAtTier(owned, targetTier);
        const nextScore = evaluateScore(nextStats, priority);
        const scoreGain = nextScore - base.score;
        if (scoreGain <= 0) continue;

        const upgradeSummary = calculateUpgradeCostBetweenTiers(owned, base.tier, targetTier, marketData, allItemsDb);
        const totalCost = upgradeSummary.hasAllPrices ? upgradeSummary.totalStoneCost : null;
        if (maxBudget !== null && totalCost !== null && totalCost > maxBudget) continue;

        const statDeltas: Record<string, number> = {};
        for (const [k, v] of Object.entries(nextStats)) {
          const delta = Number(v || 0) - Number(base.stats[k] || 0);
          if (delta !== 0) statDeltas[k] = delta;
        }

    const isOptimalStop = Boolean(opt && targetTier === opt.optimalTier);
    let reason = `Tier +1 upgrade (${upgradeSummary.requiresSoulstone ? "stones + Soulstone" : "stones only"})`;
    if (targetTier !== base.tier + 1) {
      reason = isOptimalStop
        ? opt!.reason
        : `Upgrade to max T${targetTier}`;
    }

    moves.push({
      id: `upgrade:${base.slotKey}:${owned.hashed_id}:T${targetTier}`,
      kind: "upgrade",
      slotKey: base.slotKey,
      slotLabelText: base.label,
      gearType: base.gearType,
      targetItem: owned,
      fromItem: owned,
      fromTier: base.tier,
      toTier: targetTier,
      scoreGain,
      totalCost,
      goldPerPoint: totalCost !== null && scoreGain > 0 ? totalCost / scoreGain : null,
      stoneCostOnly: upgradeSummary.totalStoneCost,
      missingPriceNote: upgradeSummary.hasAllPrices ? null : "Missing stone price",
      statDeltas,
      eligible: requirementStatus(owned, levels).length === 0,
      unmet: requirementStatus(owned, levels),
      reason,
      isOptimalStop,
    });
      }
    }

    // 2. Equip / Buy candidate items at T1 and at their Optimal Tier
    for (const candidate of slotItems) {
      if (base.item && candidate.hashed_id === base.item.hashed_id) continue;
      const unmet = requirementStatus(candidate, levels);
      const eligible = unmet.length === 0;
      if (!includeLocked && !eligible) continue;

      const opt = optimalByItemId[candidate.hashed_id];
      const tiersToEval = new Set<number>([1]);
      if (opt && opt.optimalTier > 1) tiersToEval.add(opt.optimalTier);

      const priceInfo = getPrice(candidate, marketData);

      for (const targetTier of tiersToEval) {
        const nextStats = calculateGearStatsAtTier(candidate, targetTier);
        const nextScore = evaluateScore(nextStats, priority);
        const scoreGain = nextScore - base.score;
        if (scoreGain <= 0) continue;

        const upgradeSummary = calculateUpgradeCostBetweenTiers(candidate, 1, targetTier, marketData, allItemsDb);
        // Only treat live market buy prices as acquisition cost; vendor_price is sell-to-NPC value
        const buyCost = priceInfo.label === "Market" ? priceInfo.value : null;
        const missingPriceNote =
          buyCost === null
            ? "No market price"
            : !upgradeSummary.hasAllPrices
              ? "Missing stone price"
              : null;
        const totalCost =
          buyCost !== null && upgradeSummary.hasAllPrices ? buyCost + upgradeSummary.totalStoneCost : null;

        if (maxBudget !== null && totalCost !== null && totalCost > maxBudget) continue;

        const statDeltas: Record<string, number> = {};
        const allKeys = new Set([...Object.keys(nextStats), ...Object.keys(base.stats)]);
        for (const k of allKeys) {
          const delta = Number(nextStats[k] || 0) - Number(base.stats[k] || 0);
          if (delta !== 0) statDeltas[k] = delta;
        }

        moves.push({
          id: `equip:${base.slotKey}:${candidate.hashed_id}:T${targetTier}`,
          kind: "equip",
          slotKey: base.slotKey,
          slotLabelText: base.label,
          gearType: base.gearType,
          targetItem: candidate,
          fromItem: base.item,
          fromTier: base.item ? base.tier : 0,
          toTier: targetTier,
          scoreGain,
          totalCost,
          goldPerPoint: totalCost !== null && scoreGain > 0 ? totalCost / scoreGain : null,
          stoneCostOnly: upgradeSummary.totalStoneCost,
          missingPriceNote,
          statDeltas,
          eligible,
          unmet,
          reason:
            targetTier > 1
              ? `Buy ${candidate.name} and upgrade to optimal T${targetTier}`
              : base.item
                ? `Upgrade from ${base.item.name} T${base.tier} to ${candidate.name} T1`
                : `Fill empty ${base.label} slot with ${candidate.name}`,
          isOptimalStop: Boolean(opt && targetTier === opt.optimalTier && targetTier > 1),
        });
      }
    }
  }

  return moves;
}

export function buildPerSlotBestUpgrades(params: {
  baselines: EquippedSlotBaseline[];
  moves: NextUpgradeMove[];
  sortBy: "efficiency" | "gain" | "cost";
}): Array<{ baseline: EquippedSlotBaseline; bestMove: NextUpgradeMove | null }> {
  const { baselines, moves, sortBy } = params;

  const comparator = (a: NextUpgradeMove, b: NextUpgradeMove) => {
    if (sortBy === "gain") {
      return (
        b.scoreGain - a.scoreGain ||
        (a.totalCost ?? Number.MAX_SAFE_INTEGER) - (b.totalCost ?? Number.MAX_SAFE_INTEGER)
      );
    }
    if (sortBy === "cost") {
      return (
        (a.totalCost ?? Number.MAX_SAFE_INTEGER) - (b.totalCost ?? Number.MAX_SAFE_INTEGER) ||
        b.scoreGain - a.scoreGain
      );
    }
    const aGpp = a.goldPerPoint !== null ? Math.round(a.goldPerPoint) : Number.MAX_SAFE_INTEGER;
    const bGpp = b.goldPerPoint !== null ? Math.round(b.goldPerPoint) : Number.MAX_SAFE_INTEGER;
    return aGpp - bGpp || b.scoreGain - a.scoreGain;
  };

  return baselines.map((baseline) => {
    const slotMoves = moves
      .filter((m) => m.slotKey === baseline.slotKey)
      .sort(comparator);
    return {
      baseline,
      bestMove: slotMoves[0] || null,
    };
  });
}

export function getQualityRankValue(quality: string) {
  return getQualityRank(quality);
}
