import { describe, expect, it } from "vitest";
import {
  calculateReferenceAddedCost,
  calculateTeleportCost,
  calculateTeleportSlope,
  calculateTravelSeconds,
  getBossRouteDistance,
  getProfileEconomicTeleportLevel,
  isTeleportDiscountClass,
  TELEPORT_EXEMPT_SKILL_KEYS,
} from "@/lib/world-boss-routing";

describe("world boss routing math (Patch v0.83.0 Overhaul)", () => {
  it("keeps known bidirectional distances available with coordinate fallback", () => {
    expect(getBossRouteDistance("Enchanted Oasis", "Bluebell Hollow")).toBe(50_451);
    expect(getBossRouteDistance("Bluebell Hollow", "Enchanted Oasis")).toBe(50_451);
    expect(getBossRouteDistance("Bluebell Hollow", "Bluebell Hollow")).toBe(0);
    // Harmonized coordinate distance for Wraithwood Forest
    expect(getBossRouteDistance("Wraithwood Forest", "The Citadel")).toBe(38_200);
    expect(getBossRouteDistance("Wraithwood Forest", "Enchanted Oasis")).toBe(41_632);
    expect(getBossRouteDistance("Wraithwood Forest", "Bluebell Hollow")).toBe(13_547);
  });

  it("retains zero travel time for zero distance and scales with movement speed", () => {
    expect(calculateTravelSeconds(1_000, 25)).toBe(40);
    expect(calculateTravelSeconds(0, 25)).toBe(0);
  });

  describe("Patch v0.83.0 Official Anchors (Bluebell Hollow -> Crystal Caverns: 42,645m)", () => {
    const distBluebellToCaverns = 42_645;

    it("enforces flat 50g beginner floor at and below Level 200", () => {
      expect(calculateTeleportCost(distBluebellToCaverns, 0)).toBe(50);
      expect(calculateTeleportCost(distBluebellToCaverns, 100)).toBe(50);
      expect(calculateTeleportCost(distBluebellToCaverns, 200)).toBe(50);
      expect(calculateReferenceAddedCost(200)).toBe(0);
    });

    it("matches exact published patch costs across all level milestones", () => {
      expect(calculateTeleportCost(distBluebellToCaverns, 500)).toBe(414);
      expect(calculateTeleportCost(distBluebellToCaverns, 800)).toBe(1_052);
      expect(calculateTeleportCost(distBluebellToCaverns, 1_000)).toBe(1_492);
      expect(calculateTeleportCost(distBluebellToCaverns, 1_200)).toBe(1_785);
      expect(calculateTeleportCost(distBluebellToCaverns, 1_500)).toBe(1_950);
    });

    it("enforces hard soft-cap ceiling above Level 1,500 without further cost inflation", () => {
      expect(calculateTeleportCost(distBluebellToCaverns, 1_500)).toBe(1_950);
      expect(calculateTeleportCost(distBluebellToCaverns, 1_800)).toBe(1_950);
      expect(calculateTeleportCost(distBluebellToCaverns, 2_250)).toBe(1_950);
    });
  });

  describe("Live Player In-Game Trip Parity (Zero Drift)", () => {
    it("matches BloodSpirit (Wraithwood -> Oasis: 41,632m, Gross TL 1454, Exempt 227 -> Econ TL 1227)", () => {
      expect(calculateTeleportCost(41_632, 1_227)).toBe(1_772);
    });

    it("matches BlueSpirit (Whispering -> Oasis: 50,423m, Gross TL 972, Exempt 192 -> Econ TL 780)", () => {
      const cost = calculateTeleportCost(50_423, 780);
      expect(cost).toBeGreaterThanOrEqual(1_174);
      expect(cost).toBeLessThanOrEqual(1_175);
    });

    it("matches MereCombatOnly (Wraithwood -> Oasis: 41,632m, Gross TL 865, Exempt 70 -> Econ TL 795)", () => {
      const cost = calculateTeleportCost(41_632, 795);
      expect(cost).toBeGreaterThanOrEqual(1_015);
      expect(cost).toBeLessThanOrEqual(1_016);
    });

    it("matches MinorGh0st (Citadel -> Oasis: 65,974m, Econ TL 661)", () => {
      const cost = calculateTeleportCost(65_974, 661);
      expect(cost).toBeGreaterThanOrEqual(1_089);
      expect(cost).toBeLessThanOrEqual(1_090);
    });

    it("matches D3vxGh0st (Gardens -> Citadel: 53,298m, Gross TL 1285, Exempt 261 -> Econ TL 1024)", () => {
      expect(calculateTeleportCost(53_298, 1_024)).toBe(1_906);
    });

    it("matches FeitasMax (Isle -> Citadel: 55,444m, Econ TL 1100)", () => {
      const cost = calculateTeleportCost(55_444, 1_100);
      expect(cost).toBeGreaterThanOrEqual(2_137);
      expect(cost).toBeLessThanOrEqual(2_139);
    });

    it("matches Gromozia (Wraithwood -> Citadel: 38,200m, Econ TL 1344)", () => {
      expect(calculateTeleportCost(38_200, 1_344)).toBe(1_712);
    });

    it("matches Dravilea (Wraithwood -> Citadel: 38,200m, Econ TL 1778, Capped)", () => {
      expect(calculateTeleportCost(38_200, 1_778)).toBe(1_752);
    });

    it("matches LoveisC0des (Wraithwood -> Citadel: 38,200m, Econ TL 598, Cursed 50% discount)", () => {
      expect(calculateTeleportCost(38_200, 598, true)).toBe(267);
    });

    it("matches AlwaysBr0ke (Wraithwood -> Citadel: 38,200m, Econ TL 695, Banished 50% discount)", () => {
      const cost = calculateTeleportCost(38_200, 695, true);
      expect(cost).toBeGreaterThanOrEqual(359);
      expect(cost).toBeLessThanOrEqual(360);
    });

    it("matches CarlettoI (Wraithwood -> Citadel: 38,200m, Econ TL 1631, Cursed 50% discount, Capped)", () => {
      expect(calculateTeleportCost(38_200, 1_631, true)).toBe(876);
    });

    it("matches Imgein and Piraviza (Wraithwood -> Citadel, Beginner Floor <= 200)", () => {
      expect(calculateTeleportCost(38_200, 182)).toBe(50);
      expect(calculateTeleportCost(38_200, 188)).toBe(50);
    });

    it("matches Rn3x (Wraithwood -> Isle: 21,676m, Oasis: 41,632m, Skyreach: 42,002m, Econ TL 1835 Capped)", () => {
      const econTL = 1_835;
      const isleCost = calculateTeleportCost(getBossRouteDistance("Wraithwood Forest", "Isle of Whispers")!, econTL);
      expect(isleCost).toBeGreaterThanOrEqual(1015);
      expect(isleCost).toBeLessThanOrEqual(1016);
      expect(calculateTeleportCost(getBossRouteDistance("Wraithwood Forest", "Enchanted Oasis")!, econTL)).toBe(1905);
      expect(calculateTeleportCost(getBossRouteDistance("Wraithwood Forest", "Skyreach Peak")!, econTL)).toBe(1921);
      expect(calculateTeleportCost(getBossRouteDistance("Wraithwood Forest", "Bluebell Hollow")!, econTL)).toBe(653);
    });

    it("matches HadesFish across all 10 in-game destinations (Wraithwood, Econ TL 976, Zero Drift)", () => {
      const tl = 976;
      expect(calculateTeleportCost(13_547, tl)).toBe(493); // Bluebell Hollow
      expect(calculateTeleportCost(14_835, tl)).toBe(536); // Whispering Woods
      expect(calculateTeleportCost(12_146, tl)).toBe(448); // Eldoria
      expect(calculateTeleportCost(29_262, tl)).toBe(1_008); // Crystal Caverns
      expect(calculateTeleportCost(42_002, tl)).toBe(1_426); // Skyreach Peak
      expect(calculateTeleportCost(41_632, tl)).toBe(1_414); // Enchanted Oasis
      expect(calculateTeleportCost(15_098, tl)).toBe(544); // Floating Gardens
      expect(calculateTeleportCost(41_603, tl)).toBe(1_413); // Celestial Observatory
      expect(calculateTeleportCost(21_676, tl)).toBe(760); // Isle of Whispers
      expect(calculateTeleportCost(38_200, tl)).toBe(1_301); // The Citadel
    });

    it("matches D3vxGh0st across all 10 in-game destinations (Wraithwood, Econ TL 1390, Zero Drift)", () => {
      const tl = 1390;
      expect(calculateTeleportCost(13_547, tl)).toBe(646); // Bluebell Hollow
      expect(calculateTeleportCost(14_835, tl)).toBe(703); // Whispering Woods
      expect(calculateTeleportCost(12_146, tl)).toBe(584); // Eldoria
      expect(calculateTeleportCost(29_262, tl)).toBe(1_338); // Crystal Caverns
      expect(calculateTeleportCost(42_002, tl)).toBe(1_900); // Skyreach Peak
      expect(calculateTeleportCost(41_632, tl)).toBe(1_883); // Enchanted Oasis
      expect(calculateTeleportCost(15_098, tl)).toBe(715); // Floating Gardens
      expect(calculateTeleportCost(41_603, tl)).toBe(1_882); // Celestial Observatory
      expect(calculateTeleportCost(21_676, tl)).toBe(1_004); // Isle of Whispers
      expect(calculateTeleportCost(38_200, tl)).toBe(1_732); // The Citadel
    });
  });

  describe("Economic Total Level & Class Exemptions", () => {
    it("accurately deducts 6 canonical exempt skills (including meditation) from Gross TL", () => {
      const mockProfile = {
        levels: { totalLevel: 1_317 },
        skills: {
          "woodcutting": { level: 3 },
          "mining": { level: 46 },
          "guild-mastery": { level: 89 },
          "shadow-mastery": { level: 1 },
          "yule-mastery": { level: 1 },
          "springtide-mastery": { level: 1 },
          "lunar-mastery": { level: 25 },
          "meditation": { level: 100 },
          "combat": { level: 100 },
          "slayer": { level: 95 },
        },
      };

      // 1317 - (89 + 1 + 1 + 1 + 25 + 100) = 1100
      expect(getProfileEconomicTeleportLevel(mockProfile)).toBe(1_100);
      expect(TELEPORT_EXEMPT_SKILL_KEYS).toContain("meditation");
    });

    it("identifies Banished and Cursed as 50% discount classes", () => {
      expect(isTeleportDiscountClass("Banished")).toBe(true);
      expect(isTeleportDiscountClass("banished")).toBe(true);
      expect(isTeleportDiscountClass("Cursed")).toBe(true);
      expect(isTeleportDiscountClass("CURSED")).toBe(true);
      expect(isTeleportDiscountClass("Beastmaster")).toBe(false);
      expect(isTeleportDiscountClass("Smelter")).toBe(false);
      expect(isTeleportDiscountClass(null)).toBe(false);
    });
  });
});
