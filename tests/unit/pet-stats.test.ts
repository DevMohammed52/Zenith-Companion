import { describe, expect, it } from "vitest";
import { calculatePetStatValue } from "@/lib/pet-stats";

describe("pet stat formula", () => {
  it("uses rounded base stats before applying Pet Mastery bonuses", () => {
    expect(
      calculatePetStatValue(
        { base: 6, per_level: 0.67 },
        { statKey: "agility", level: 95, masteryBonusPercent: 20 },
      ),
    ).toBe(82);
  });

  it("rounds movement speed base and bonus separately", () => {
    expect(
      calculatePetStatValue(
        { base: 2, per_level: 0.18 },
        { statKey: "movement_speed", level: 95, masteryBonusPercent: 20 },
      ),
    ).toBe(22.68);
  });

  it("does not apply pat or evolution bonuses to movement speed", () => {
    expect(
      calculatePetStatValue(
        { base: 2, per_level: 0.18 },
        {
          statKey: "movement_speed",
          level: 95,
          masteryBonusPercent: 20,
          evolutionStage: 5,
          evolutionApplies: true,
          patBonus: true,
        },
      ),
    ).toBe(22.68);
  });

  it("keeps non-mastery stats on the existing raw-stat display path", () => {
    expect(
      calculatePetStatValue(
        { base: 3, per_level: 0.36 },
        { statKey: "critical_damage", level: 95, masteryBonusPercent: 20 },
      ),
    ).toBe(36.84);
  });
});
