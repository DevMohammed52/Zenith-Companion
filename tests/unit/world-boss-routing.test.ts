import { describe, expect, it } from "vitest";
import {
  calculateTeleportCost,
  calculateTeleportSlope,
  calculateTravelSeconds,
  getBossRouteDistance,
  getProfileEconomicTeleportLevel,
  isTeleportDiscountClass,
  MIN_TELEPORT_ACTION_COST,
  TELEPORT_BEGINNER_FLOOR_LEVEL,
  TELEPORT_SOFT_CAP_LEVEL,
} from "@/lib/world-boss-routing";

describe("world boss routing math (Patch v0.83.0 Overhaul)", () => {
  it("keeps known bidirectional distances available with coordinate fallback", () => {
    expect(getBossRouteDistance("Enchanted Oasis", "Bluebell Hollow")).toBe(50_451);
    expect(getBossRouteDistance("Bluebell Hollow", "Enchanted Oasis")).toBe(50_451);
    expect(getBossRouteDistance("Bluebell Hollow", "Bluebell Hollow")).toBe(0);
    // Coordinate fallback for event locations (Wraithwood Forest)
    expect(getBossRouteDistance("Wraithwood Forest", "The Citadel")).toBe(38_200);
    expect(getBossRouteDistance("Wraithwood Forest", "Enchanted Oasis")).toBe(41_632);
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
    it("matches MinorGh0st (Citadel -> Oasis: 65,974m, Econ TL 661)", () => {
      expect(calculateTeleportCost(65_974, 661)).toBe(1_089);
    });

    it("matches D3vxGh0st (Gardens -> Citadel: 53,298m, Econ TL 1035)", () => {
      expect(calculateTeleportCost(53_298, 1_035)).toBe(1_906);
    });

    it("matches FeitasMax (Isle -> Citadel: 55,444m, Econ TL 1100)", () => {
      expect(calculateTeleportCost(55_444, 1_100)).toBe(2_137);
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
      // Expected around 359g-360g (single-coin float boundary rounding)
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

    it("matches Rn3x (Wraithwood -> Bluebell: 12,412m, Isle: 21,676m, Oasis: 41,632m, Skyreach: 42,002m, Econ TL 1835)", () => {
      const econTL = 1_835;
      expect(calculateTeleportCost(getBossRouteDistance("Wraithwood Forest", "Bluebell Hollow")!, econTL)).toBe(603);
      expect(calculateTeleportCost(getBossRouteDistance("Wraithwood Forest", "Isle of Whispers")!, econTL)).toBe(1016);
      expect(calculateTeleportCost(getBossRouteDistance("Wraithwood Forest", "Enchanted Oasis")!, econTL)).toBe(1905);
      expect(calculateTeleportCost(getBossRouteDistance("Wraithwood Forest", "Skyreach Peak")!, econTL)).toBe(1921);
    });
  });

  describe("Economic Total Level & Class Exemptions", () => {
    it("accurately deducts 5 canonical exempt masteries from Gross TL", () => {
      const mockProfile = {
        levels: { totalLevel: 1_217 },
        skills: {
          "woodcutting": { level: 3 },
          "mining": { level: 46 },
          "guild-mastery": { level: 89 },
          "shadow-mastery": { level: 1 },
          "yule-mastery": { level: 1 },
          "springtide-mastery": { level: 1 },
          "lunar-mastery": { level: 25 },
          "combat": { level: 100 },
          "slayer": { level: 95 },
        },
      };

      // 1217 - (89 + 1 + 1 + 1 + 25) = 1100
      expect(getProfileEconomicTeleportLevel(mockProfile)).toBe(1_100);
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
