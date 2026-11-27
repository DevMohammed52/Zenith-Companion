import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { assertCleanMigratedRoute } from "./helpers/route-contract-audit";
import {
  buildNextBestUpgrades,
  buildPerSlotBestUpgrades,
  calculateGearStatsAtTier,
  calculateUpgradeCostBetweenTiers,
  computeOptimalTierAnalysis,
  getActiveEquippedBaselines,
  normalizeCombatCatalog,
} from "@/app/bis/utils/bis-math";
import { formatCompactGold } from "@/app/bis/types";
import type { CharacterProfile } from "@/lib/profiles";
import {
  activeStyleSlots,
  clampTier,
  COMBAT_TYPES,
  compareBestGear,
  compareStats,
  evaluateScore,
  formatGold,
  getPrice,
  getRequirementLevel,
  normalizeCombatStyle,
  numberValue,
  profileSlotForType,
  requirementStatus,
  slotLabel,
  totalPositiveStats,
  type GearItem,
  type GearView,
} from "@/app/bis/types";

describe("/bis Architecture Contracts & Calculation Invariance", () => {
  describe("Combat Style & Slot Helpers", () => {
    it("normalizes combat style safely", () => {
      expect(normalizeCombatStyle("dualDaggers")).toBe("dualDaggers");
      expect(normalizeCombatStyle("dual_daggers")).toBe("dualDaggers");
      expect(normalizeCombatStyle("bow")).toBe("bow");
      expect(normalizeCombatStyle("swordShield")).toBe("swordShield");
      expect(normalizeCombatStyle("unknown")).toBe("swordShield");
      expect(normalizeCombatStyle(undefined)).toBe("swordShield");
    });

    it("returns correct active style slots", () => {
      const swordSlots = activeStyleSlots("swordShield");
      expect(swordSlots).toEqual(["SWORD", "SHIELD", "HELMET", "CHESTPLATE", "GREAVES", "BOOTS", "GAUNTLETS"]);

      const daggerSlots = activeStyleSlots("dualDaggers");
      expect(daggerSlots).toEqual(["DAGGER", "HELMET", "CHESTPLATE", "GREAVES", "BOOTS", "GAUNTLETS"]);

      const bowSlots = activeStyleSlots("bow");
      expect(bowSlots).toEqual(["BOW", "HELMET", "CHESTPLATE", "GREAVES", "BOOTS", "GAUNTLETS"]);
    });

    it("maps profile slots and labels correctly", () => {
      expect(profileSlotForType("SWORD")).toBe("weapon");
      expect(profileSlotForType("DAGGER")).toBe("weapon");
      expect(profileSlotForType("BOW")).toBe("bow");
      expect(profileSlotForType("SHIELD")).toBe("shield");
      expect(profileSlotForType("HELMET")).toBe("helmet");
      expect(profileSlotForType("CHESTPLATE")).toBe("chestplate");
      expect(profileSlotForType("GREAVES")).toBe("greaves");
      expect(profileSlotForType("BOOTS")).toBe("boots");
      expect(profileSlotForType("GAUNTLETS")).toBe("gauntlets");

      expect(slotLabel("SWORD")).toBe("Sword");
      expect(slotLabel("DAGGER")).toBe("Dagger");
      expect(slotLabel("BOW")).toBe("Bow");
      expect(slotLabel("SHIELD")).toBe("Shield");
      expect(slotLabel("CUSTOM")).toBe("CUSTOM");
    });

    it("verifies all combat types set", () => {
      expect(COMBAT_TYPES.has("SWORD")).toBe(true);
      expect(COMBAT_TYPES.has("DAGGER")).toBe(true);
      expect(COMBAT_TYPES.has("BOW")).toBe(true);
      expect(COMBAT_TYPES.has("SHIELD")).toBe(true);
      expect(COMBAT_TYPES.has("HELMET")).toBe(true);
      expect(COMBAT_TYPES.has("CHESTPLATE")).toBe(true);
      expect(COMBAT_TYPES.has("GREAVES")).toBe(true);
      expect(COMBAT_TYPES.has("BOOTS")).toBe(true);
      expect(COMBAT_TYPES.has("GAUNTLETS")).toBe(true);
    });
  });

  describe("Numeric Formatting & Requirements", () => {
    it("parses numeric values robustly", () => {
      expect(numberValue(42)).toBe(42);
      expect(numberValue(0)).toBe(0);
      expect(numberValue("")).toBe(0);
      expect(numberValue(undefined)).toBe(0);
      expect(numberValue(Number.NaN)).toBe(0);
    });

    it("formats gold amounts", () => {
      expect(formatGold(1000)).toBe("1,000g");
      expect(formatGold(54200)).toBe("54,200g");
      expect(formatGold(0)).toBe("-");
      expect(formatGold(-5)).toBe("-");
      expect(formatGold(null)).toBe("-");
      expect(formatGold(undefined)).toBe("-");
    });

    it("computes maximum requirement level", () => {
      const item: GearItem = {
        name: "Abyssal Helm",
        hashed_id: "abyssal_helm_1",
        type: "HELMET",
        quality: "Epic",
        requirements: {
          defence: 75,
          strength: 60,
        },
      };
      expect(getRequirementLevel(item)).toBe(75);

      const noReqItem: GearItem = {
        name: "Training Sword",
        hashed_id: "training_sword_1",
        type: "SWORD",
        quality: "Common",
        requirements: null,
      };
      expect(getRequirementLevel(noReqItem)).toBe(0);
    });

    it("evaluates requirement status and unmet requirements", () => {
      const item: GearItem = {
        name: "Colossus Plate",
        hashed_id: "colossus_plate_1",
        type: "CHESTPLATE",
        quality: "Mythic",
        combat_req: 80,
        requirements: {
          defence: 85,
          strength: 70,
        },
      };

      // Player meets everything
      expect(requirementStatus(item, { combat: 90, defence: 85, strength: 75 })).toEqual([]);

      // Player missing defence
      const unmet1 = requirementStatus(item, { combat: 85, defence: 80, strength: 70 });
      expect(unmet1).toContain("Defence 85");

      // Player missing combat and strength
      const unmet2 = requirementStatus(item, { combat: 70, defence: 85, strength: 60 });
      expect(unmet2).toContain("Strength 70");
      expect(unmet2).toContain("Combat 80");
    });
  });

  describe("Stat Scoring & Gear Comparison Invariance", () => {
    it("calculates priority-weighted scores", () => {
      const stats = {
        attack_power: 10,
        damage: 20,
        critical_chance: 5,
        protection: 15,
      };

      // Balanced: attack_power: 1, damage: 8, critical_chance: 6, protection: 0.6
      // 10*1 + 20*8 + 5*6 + 15*0.6 = 10 + 160 + 30 + 9 = 209
      expect(evaluateScore(stats, "balanced")).toBe(209);

      // Damage: attack_power: 1.25, damage: 10, critical_chance: 8, protection: 0.2
      // 10*1.25 + 20*10 + 5*8 + 15*0.2 = 12.5 + 200 + 40 + 3 = 255.5
      expect(evaluateScore(stats, "damage")).toBe(255.5);
    });

    it("sums positive stats ignoring negatives", () => {
      const stats = {
        attack_power: 50,
        damage: 100,
        movement_speed: -10,
        protection: 25,
      };
      expect(totalPositiveStats(stats)).toBe(175);
    });

    it("compares candidates against current gear stats", () => {
      const candidateStats = { attack_power: 120, protection: 40, agility: 15 };
      const currentStats = { attack_power: 100, protection: 50 };

      const comparison = compareStats(candidateStats, currentStats);
      expect(comparison).toEqual([
        { key: "agility", candidate: 15, current: 0, delta: 15 },
        { key: "attack_power", candidate: 120, current: 100, delta: 20 },
        { key: "protection", candidate: 40, current: 50, delta: -10 },
      ]);
    });

    it("clamps gear tier safely within valid range", () => {
      expect(clampTier(1, 5)).toBe(1);
      expect(clampTier(3, 5)).toBe(3);
      expect(clampTier(8, 5)).toBe(5);
      expect(clampTier(0, 5)).toBe(1);
      expect(clampTier(-2, 5)).toBe(1);
      expect(clampTier("", 5)).toBe("");
    });

    it("ranks gear items with compareBestGear", () => {
      const highReqView: GearView = {
        item: { name: "High Helm", hashed_id: "1", type: "HELMET", quality: "Epic" },
        stats: {},
        weightedStats: 100,
        statTotal: 100,
        requirementLevel: 50,
        eligible: true,
        unmet: [],
        price: 10000,
        priceLabel: "Market",
        effectiveTier: 1,
      };

      const lowReqView: GearView = {
        item: { name: "Low Helm", hashed_id: "2", type: "HELMET", quality: "Epic" },
        stats: {},
        weightedStats: 120,
        statTotal: 120,
        requirementLevel: 20,
        eligible: true,
        unmet: [],
        price: 5000,
        priceLabel: "Market",
        effectiveTier: 1,
      };

      // Higher requirement level ranks higher
      expect(compareBestGear(highReqView, lowReqView)).toBeLessThan(0);
      expect(compareBestGear(lowReqView, highReqView)).toBeGreaterThan(0);
    });

    it("resolves market vs vendor prices accurately", () => {
      const itemWithMarket: GearItem = {
        name: "Excalibur",
        hashed_id: "ex_1",
        type: "SWORD",
        quality: "Legendary",
        vendor_price: 500,
      };
      const marketData = {
        Excalibur: { price: 25000, vol_3: 10 },
      };

      const marketPrice = getPrice(itemWithMarket, marketData);
      expect(marketPrice.value).toBe(25000);
      expect(marketPrice.label).toBe("Market");

      const itemWithoutMarket: GearItem = {
        name: "Rusty Blade",
        hashed_id: "rb_1",
        type: "SWORD",
        quality: "Common",
        vendor_price: 25,
      };
      const vendorPrice = getPrice(itemWithoutMarket, {});
      expect(vendorPrice.value).toBe(25);
      expect(vendorPrice.label).toBe("Vendor");

      const itemNoPrice: GearItem = {
        name: "Bound Ring",
        hashed_id: "br_1",
        type: "SWORD",
        quality: "Common",
        vendor_price: null,
      };
      const noPrice = getPrice(itemNoPrice, null);
      expect(noPrice.value).toBe(null);
      expect(noPrice.label).toBe("No price");
    });
  });

  describe("Clean Route Architecture, 306-Item Catalog, Optimal Tier & Upgrade Advisor", () => {
    it("enforces zero style jsx, zero StateBlock, zero direct lucide-react, and concise orchestrator", () => {
      assertCleanMigratedRoute({
        routeSubpath: "bis",
        maxPageLines: 150,
      });
    });

    it("loads all 306 combat gear items from all-items-db.json including forged sets and canonical Armour names", () => {
      const dbRaw = JSON.parse(
        readFileSync(path.join(process.cwd(), "public", "all-items-db.json"), "utf8"),
      ) as Record<string, any>;
      const catalog = normalizeCombatCatalog(dbRaw);
      expect(catalog.length).toBe(306);
      expect(catalog.some((x) => x.name === "Tin Sword")).toBe(true);
      expect(catalog.some((x) => x.name === "Mystical Bow")).toBe(true);
      expect(catalog.some((x) => x.name === "Dreadbane Armour")).toBe(true);
      expect(catalog.some((x) => x.name === "Soulguard Armour")).toBe(true);
      expect(catalog.some((x) => x.name === "Dreadbane Armor")).toBe(false);
    });

    it("computes upgrade stone + Dragon Soulstone costs and identifies optimal tier breakpoints", () => {
      const mkt = {
        "Weapon Upgrade Stone": { safe_price: 5000 },
        "Dragon Soulstone": { safe_price: 340000 },
        "Silverthorn Sword": { safe_price: 4200000 },
        Bloodthirst: { safe_price: 8500000 },
        Grimslayer: { safe_price: 740000 },
        "Phoenix Requiem": { safe_price: 2500000 },
      };

      const legendarySword: GearItem = {
        hashed_id: "leg_1",
        name: "Grimslayer",
        type: "SWORD",
        quality: "LEGENDARY",
        max_tier: 16,
        requirements: { combat: 86, strength: 70 },
        stats: { attack_power: 280, agility: 50, accuracy: 46, critical_damage: 80 },
        tier_modifiers: { attack_power: 2, agility: 1, accuracy: 1 },
        upgrade_requirements: [{ hashed_item_id: "w_stone", item_name: "Weapon Upgrade Stone", quantity: 6 }],
      };

      const mythicNext: GearItem = {
        hashed_id: "myth_1",
        name: "Phoenix Requiem",
        type: "SWORD",
        quality: "MYTHIC",
        max_tier: 20,
        requirements: { combat: 91, strength: 80 },
        stats: { attack_power: 330, agility: 67, accuracy: 66, critical_chance: 2, critical_damage: 130 },
        tier_modifiers: { attack_power: 3, agility: 2, accuracy: 2, critical_damage: 2 },
        upgrade_requirements: [
          { hashed_item_id: "w_stone", item_name: "Weapon Upgrade Stone", quantity: 10 },
          { hashed_item_id: "soulstone", item_name: "Dragon Soulstone", quantity: 1 },
        ],
      };

      const silverthorn: GearItem = {
        hashed_id: "myth_2",
        name: "Silverthorn Sword",
        type: "SWORD",
        quality: "MYTHIC",
        max_tier: 25,
        requirements: { combat: 93, strength: 80 },
        stats: { attack_power: 350, agility: 81, accuracy: 81, critical_chance: 4, critical_damage: 150 },
        tier_modifiers: { attack_power: 3, agility: 2, accuracy: 2, critical_damage: 2 },
        upgrade_requirements: [
          { hashed_item_id: "w_stone", item_name: "Weapon Upgrade Stone", quantity: 10 },
          { hashed_item_id: "soulstone", item_name: "Dragon Soulstone", quantity: 1 },
        ],
      };

      const bloodthirst: GearItem = {
        hashed_id: "myth_3",
        name: "Bloodthirst",
        type: "SWORD",
        quality: "MYTHIC",
        max_tier: 28,
        requirements: { combat: 94, strength: 80 },
        stats: { attack_power: 360, agility: 84, accuracy: 82, critical_chance: 5, critical_damage: 160 },
        tier_modifiers: { attack_power: 3, agility: 2, accuracy: 2, critical_damage: 2 },
        upgrade_requirements: [
          { hashed_item_id: "w_stone", item_name: "Weapon Upgrade Stone", quantity: 10 },
          { hashed_item_id: "soulstone", item_name: "Dragon Soulstone", quantity: 1 },
        ],
      };

      const stepCost = calculateUpgradeCostBetweenTiers(mythicNext, 1, 3, mkt);
      expect(stepCost.requiresSoulstone).toBe(true);
      expect(stepCost.stepCost).toBe(390000);
      expect(stepCost.totalStoneCost).toBe(780000);

      const peers = [legendarySword, mythicNext, silverthorn, bloodthirst];
      const legAnalysis = computeOptimalTierAnalysis(legendarySword, peers, "damage", mkt);
      expect(legAnalysis.costTag).toBe("Stones only");
      expect(legAnalysis.optimalTier).toBe(16);

      const silverAnalysis = computeOptimalTierAnalysis(silverthorn, peers, "damage", mkt);
      expect(silverAnalysis.costTag).toBe("High Soulstone cost");
      expect(silverAnalysis.optimalTier).toBeLessThan(25);
      expect(silverAnalysis.nextBetterItemName).toBe("Bloodthirst");
    });

    it("tracks Dual Daggers offhandWeapon and recommends both owned tier upgrades and swaps", () => {
      const d1: GearItem = {
        hashed_id: "dag_1",
        name: "Shadowfang",
        type: "DAGGER",
        quality: "EPIC",
        max_tier: 10,
        requirements: { combat: 50, strength: 40 },
        stats: { attack_power: 40, agility: 12 },
        tier_modifiers: { attack_power: 2 },
        upgrade_requirements: [{ hashed_item_id: "w_stone", item_name: "Weapon Upgrade Stone", quantity: 3 }],
      };
      const d2: GearItem = {
        hashed_id: "dag_2",
        name: "Widow's Kiss",
        type: "DAGGER",
        quality: "MYTHIC",
        max_tier: 25,
        requirements: { combat: 93, strength: 80 },
        stats: { attack_power: 175, agility: 41 },
        tier_modifiers: { attack_power: 3, agility: 2 },
        upgrade_requirements: [
          { hashed_item_id: "w_stone", item_name: "Weapon Upgrade Stone", quantity: 6 },
          { hashed_item_id: "soul", item_name: "Dragon Soulstone", quantity: 1 },
        ],
      };

      const profile = {
        id: "p1",
        name: "DaggerTest",
        combatStyle: "dualDaggers",
        gear: { weapon: "Shadowfang", offhandWeapon: "" },
        gearTiers: { weapon: 2, offhandWeapon: 1 },
      } as unknown as CharacterProfile;

      const byName = { shadowfang: d1, "widow's kiss": d2 };
      const baselines = getActiveEquippedBaselines(profile, "dualDaggers", byName, "damage");
      expect(baselines.find((b) => b.slotKey === "weapon")?.tier).toBe(2);
      expect(baselines.find((b) => b.slotKey === "offhandWeapon")?.item).toBeNull();

      const mkt = {
        "Weapon Upgrade Stone": { safe_price: 5000 },
        "Dragon Soulstone": { safe_price: 340000 },
        "Widow's Kiss": { safe_price: 3250000 },
        Shadowfang: { safe_price: 50000 },
      };
      const optMap = {
        dag_1: computeOptimalTierAnalysis(d1, [d1, d2], "damage", mkt),
        dag_2: computeOptimalTierAnalysis(d2, [d1, d2], "damage", mkt),
      };

      const moves = buildNextBestUpgrades({
        baselines,
        allItems: [d1, d2],
        optimalByItemId: optMap,
        levels: { combat: 95, strength: 85, dexterity: 85, defence: 85 },
        priority: "damage",
        marketData: mkt,
      });

      expect(moves.some((m) => m.slotKey === "weapon" && m.kind === "upgrade")).toBe(true);
      expect(moves.some((m) => m.slotKey === "offhandWeapon" && m.targetItem.name === "Widow's Kiss")).toBe(true);
    });

    it("caps calculateGearStatsAtTier within 1..max_tier", () => {
      const sword: GearItem = {
        hashed_id: "s1",
        name: "Test Sword",
        type: "SWORD",
        quality: "STANDARD",
        max_tier: 5,
        stats: { attack_power: 10 },
        tier_modifiers: { attack_power: 2 },
      };
      expect(calculateGearStatsAtTier(sword, 1)).toEqual({ attack_power: 10 });
      expect(calculateGearStatsAtTier(sword, 5)).toEqual({ attack_power: 18 });
      expect(calculateGearStatsAtTier(sword, 99)).toEqual({ attack_power: 18 });
    });

    it("formats compact gold cleanly and picks one best next move per active slot", () => {
      expect(formatCompactGold(8500000)).toBe("8.5M");
      expect(formatCompactGold(740305)).toBe("740K");
      expect(formatCompactGold(8250)).toBe("8.3K");
      expect(formatCompactGold(79)).toBe("79g");
      expect(formatCompactGold(null)).toBe("-");

      const s1: GearItem = {
        hashed_id: "sw_1",
        name: "Grimslayer",
        type: "SWORD",
        quality: "LEGENDARY",
        max_tier: 16,
        requirements: { combat: 86, strength: 70 },
        stats: { attack_power: 280, agility: 50 },
        tier_modifiers: { attack_power: 2, agility: 1 },
        upgrade_requirements: [{ hashed_item_id: "w_stone", item_name: "Weapon Upgrade Stone", quantity: 6 }],
      };
      const profile = {
        id: "p2",
        name: "SlotCheck",
        combatStyle: "swordShield",
        gear: { weapon: "Grimslayer" },
        gearTiers: { weapon: 4 },
      } as unknown as CharacterProfile;
      const mkt = { "Weapon Upgrade Stone": { safe_price: 5000 } };
      const baselines = getActiveEquippedBaselines(profile, "swordShield", { grimslayer: s1 }, "balanced");
      const optMap = { sw_1: computeOptimalTierAnalysis(s1, [s1], "balanced", mkt) };
      const moves = buildNextBestUpgrades({
        baselines,
        allItems: [s1],
        optimalByItemId: optMap,
        levels: { combat: 95, strength: 85, dexterity: 85, defence: 85 },
        priority: "balanced",
        marketData: mkt,
      });
      const perSlot = buildPerSlotBestUpgrades({ baselines, moves, sortBy: "efficiency" });
      expect(perSlot).toHaveLength(7);
      const weaponPick = perSlot.find((entry) => entry.baseline.slotKey === "weapon")?.bestMove;
      expect(weaponPick?.toTier).toBe(16);
    });
  });
});
