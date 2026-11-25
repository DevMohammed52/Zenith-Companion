import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { assertCleanMigratedRoute } from "./helpers/route-contract-audit";
import {
  databaseOptionId,
  formatBattleEv,
  formatOwnedPetMeta,
  getBattleModeLabel,
  getFoodPolicyLabel,
  getRecordedDropCount,
  getRecordedZoneCount,
  metricValue,
  ownedOptionId,
  ownedPetMissingStatCount,
  ownedPetStatsToComparisonStats,
} from "@/app/pets/compare/utils/compare-helpers";

describe("pets/compare architecture and calculation invariance contracts", () => {
  const compareDir = path.join(process.cwd(), "src", "app", "pets", "compare");
  const componentsDir = path.join(compareDir, "components");

  it("enforces clean migrated route architecture (no style jsx, no StateBlock, no direct lucide-react)", () => {
    assertCleanMigratedRoute({
      routeSubpath: "pets/compare",
      maxPageLines: 150,
      allowStateBlock: false,
      allowDirectLucide: false,
    });
  });

  it("removes bespoke duplicate controls in favor of shared primitives", () => {
    expect(existsSync(path.join(componentsDir, "NumberField.tsx"))).toBe(false);
    expect(existsSync(path.join(componentsDir, "OptionMenu.tsx"))).toBe(false);
    expect(existsSync(path.join(componentsDir, "PetImage.tsx"))).toBe(false);
    expect(existsSync(path.join(process.cwd(), "src", "components", "pets", "PetImage.tsx"))).toBe(true);
  });

  it("preserves option id helpers and owned pet stat conversions", () => {
    expect(databaseOptionId("Orthrus")).toBe("db:Orthrus");
    expect(ownedOptionId("abc-1")).toBe("owned:abc-1");

    const stats = ownedPetStatsToComparisonStats({
      agility: 100,
      accuracy: "",
      protection: 80,
      attackPower: 95,
      movementSpeed: 24.5,
      maxHealth: 1800,
      maxStamina: 300,
      criticalDamage: 42,
      criticalChance: "",
    });
    expect(stats.agility).toBe(100);
    expect(stats.accuracy).toBe(0);
    expect(stats.attack_power).toBe(95);
    expect(stats.movement_speed).toBe(24.5);

    expect(
      ownedPetMissingStatCount({
        agility: 100,
        accuracy: "",
        protection: 80,
        attackPower: 95,
        movementSpeed: 24.5,
        maxHealth: 1800,
        maxStamina: 300,
        criticalDamage: 42,
        criticalChance: "",
      }),
    ).toBe(2);
  });

  it("preserves battle EV, label, and metricValue formatting", () => {
    expect(formatBattleEv(null)).toBe("-");
    expect(formatBattleEv(0)).toBe("0g");
    expect(formatBattleEv(1234.6)).toBe("1,235g");
    expect(formatBattleEv(-500)).toBe("-500g");

    expect(getBattleModeLabel("withSleep")).toBe("With sleep");
    expect(getFoodPolicyLabel("standard")).toBe("Food cost included");
    expect(getFoodPolicyLabel("none")).toBe("Food cost ignored");

    const mockRow: any = {
      totalPower: 480,
      huntingTime: 102,
      battle: { value: 320, zone: "Voragor", mode: "withSleep" },
      pet: {
        name: "Orthrus",
        exchange: { minPrice: 250000 },
        battle: {
          zones: [
            { zone: "Voragor", drops: [{ itemName: "Gold", expectedDropPercent: 1 }] },
            { zone: "", drops: [] },
          ],
        },
      },
      stats: { agility: 125 },
    };
    expect(metricValue(mockRow, "power")).toBe(480);
    expect(metricValue(mockRow, "hunt")).toBe(102);
    expect(metricValue(mockRow, "battle")).toBe(320);
    expect(metricValue(mockRow, "market")).toBe(250000);
    expect(metricValue(mockRow, "agility")).toBe(125);
    expect(getRecordedZoneCount(mockRow.pet)).toBe(1);
    expect(getRecordedDropCount(mockRow.pet, "Voragor")).toBe(1);
    expect(getRecordedDropCount(mockRow.pet, null)).toBe(0);

    expect(
      formatOwnedPetMeta({
        id: "1",
        species: "Orthrus",
        nickname: "",
        quality: "MYTHIC",
        level: 95,
        experience: 0,
        totalExperience: 0,
        evolution: 2,
        evolutionTargets: [],
        active: false,
        equipped: false,
        source: "imported",
        stats: {
          agility: 1,
          accuracy: 1,
          protection: 1,
          attackPower: 1,
          movementSpeed: 1,
          maxHealth: 1,
          maxStamina: 1,
          criticalDamage: 1,
          criticalChance: 1,
        },
        notes: "",
      }),
    ).toBe("Imported snapshot - Lv. 95 - Evo 2");
  });
});
