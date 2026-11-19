import { describe, expect, it } from "vitest";
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
});
