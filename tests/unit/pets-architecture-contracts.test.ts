import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { assertCleanMigratedRoute } from "./helpers/route-contract-audit";
import {
  clampNumber,
  formatCompactGold,
  formatGold,
  formatNumber,
  formatPercent,
  getMasteryBonus,
  isDisplayableBattleDrop,
  secondsToDuration,
} from "@/app/pets/utils/pet-helpers";

describe("pets architecture and modularization contracts", () => {
  const petsDir = path.join(process.cwd(), "src", "app", "pets");
  const pagePath = path.join(petsDir, "page.tsx");
  const hookPath = path.join(petsDir, "hooks", "usePetsState.ts");
  const componentsDir = path.join(petsDir, "components");

  it("orchestrator page.tsx exists, stays under 150 lines, and uses clean CSS modules without style jsx", () => {
    assertCleanMigratedRoute({
      routeSubpath: "pets",
      maxPageLines: 150,
      allowStateBlock: true,
      allowDirectLucide: true,
    });
  });

  it("exports dedicated custom hook usePetsState", () => {
    expect(existsSync(hookPath)).toBe(true);
    const content = readFileSync(hookPath, "utf-8");
    expect(content).toContain("export function usePetsState()");
  });

  it("contains core modular components", () => {
    const requiredFiles = [
      "PetHero.tsx",
      "PetFilters.tsx",
      "PetGrid.tsx",
      "PetCard.tsx",
      "PetDetailModal.tsx",
      "PetBattleModal.tsx",
      "PetImage.tsx",
    ];
    for (const file of requiredFiles) {
      expect(existsSync(path.join(componentsDir, file))).toBe(true);
    }
  });

  it("preserves gold formatting invariance", () => {
    expect(formatGold(0)).toBe("-");
    expect(formatGold(null)).toBe("-");
    expect(formatGold(-5)).toBe("-");
    expect(formatGold(1000)).toBe("1,000g");
    expect(formatGold(52345.8)).toBe("52,346g");

    expect(formatCompactGold(0)).toBe("-");
    expect(formatCompactGold(null)).toBe("-");
    expect(formatCompactGold(1500)).toContain("1.5");
    expect(formatCompactGold(1000000)).toContain("1");
  });

  it("preserves number and percent formatting invariance", () => {
    expect(formatNumber(null)).toBe("-");
    expect(formatNumber(undefined)).toBe("-");
    expect(formatNumber(Number.NaN)).toBe("-");
    expect(formatNumber(1234.56, 1)).toBe("1,234.6");

    expect(formatPercent(null)).toBe("-");
    expect(formatPercent(0.15, 1)).toBe("15.0%");
    expect(formatPercent(15, 1)).toBe("15.0%");
  });

  it("preserves clamping and duration formatting", () => {
    expect(clampNumber(5, 1, 10)).toBe(5);
    expect(clampNumber(0, 1, 10)).toBe(1);
    expect(clampNumber(15, 1, 10)).toBe(10);
    expect(clampNumber(Number.NaN, 1, 10)).toBe(1);

    expect(secondsToDuration(null)).toBe("-");
    expect(secondsToDuration(0)).toBe("-");
    expect(secondsToDuration(45)).toBe("45s");
    expect(secondsToDuration(125)).toBe("2m 5s");
    expect(secondsToDuration(3665)).toBe("1h 1m");
  });

  it("preserves mastery bonus lookup logic", () => {
    const mockDb: any = {
      mastery: {
        levels: [
          { level: 44, stat_bonus_percent: 0.01 },
          { level: 100, stat_bonus_percent: 0.2 },
        ],
      },
    };
    expect(getMasteryBonus(null, 100)).toBe(0);
    expect(getMasteryBonus(mockDb, 44)).toBe(1);
    expect(getMasteryBonus(mockDb, 100)).toBe(20);
    expect(getMasteryBonus(mockDb, 50)).toBe(0);
  });

  it("filters non-displayable battle drops", () => {
    expect(isDisplayableBattleDrop(null)).toBe(false);
    expect(isDisplayableBattleDrop({ itemName: "" })).toBe(false);
    expect(isDisplayableBattleDrop({ itemName: "Total" })).toBe(false);
    expect(isDisplayableBattleDrop({ itemName: "Grand Total" })).toBe(false);
    expect(isDisplayableBattleDrop({ itemName: "Material" })).toBe(false);
    expect(isDisplayableBattleDrop({ itemName: "Goblin Crown", expectedDropPercent: 0.05 })).toBe(true);
  });
});
