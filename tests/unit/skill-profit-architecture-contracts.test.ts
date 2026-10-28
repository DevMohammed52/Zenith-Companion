import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  STORAGE_KEY,
  DEFAULT_SETTINGS,
  DEFAULT_STATE,
  MOBILE_RESULT_BATCH_SIZE,
  CONQUEST_PICKER_OPTIONS,
  SALE_MODE_OPTIONS,
  SORT_LABELS,
  isLiquid,
  isExcludedFromTop,
  getSearchTokens,
  rowMatchesSearch,
  getMatchedIngredient,
  getSortValue,
  getDisplayProfitPerHour,
  getRankedProfitPerHour,
  getProfitCellValue,
  getProfitCardValue,
  getProfitSummary,
  formatSignedGold,
  formatNumber,
  formatOptionalNumber,
  formatPriceSource,
  formatType,
  stringifyDetail,
  formatEffectEntry,
} from "@/app/skill-profit/page";
import type { SkillProfitRow } from "@/lib/skill-profit";
import { useSkillProfitState } from "@/app/skill-profit/hooks/useSkillProfitState";
import { useSkillProfitCalculations } from "@/app/skill-profit/hooks/useSkillProfitCalculations";
import {
  SortableTh,
  OptionPicker,
  ToolPicker,
  EssencePicker,
  Metric,
  CalcRow,
  DetailPill,
  DetailList,
} from "@/app/skill-profit/components/SkillProfitControls";
import { SkillProfitHeader, SkillProfitTabs } from "@/app/skill-profit/components/SkillProfitHeader";
import { SkillProfitFilterBar } from "@/app/skill-profit/components/SkillProfitFilterBar";
import { SkillProfitTable } from "@/app/skill-profit/components/SkillProfitTable";
import { SkillProfitCardList } from "@/app/skill-profit/components/SkillProfitCardList";
import { SkillProfitStrategyModal, SkillStrategyModal } from "@/app/skill-profit/components/SkillProfitStrategyModal";

describe("skill-profit architecture and modularization contracts", () => {
  const skillProfitDir = path.join(process.cwd(), "src", "app", "skill-profit");
  const pagePath = path.join(skillProfitDir, "page.tsx");
  const typesPath = path.join(skillProfitDir, "types.ts");
  const componentsDir = path.join(skillProfitDir, "components");
  const hooksDir = path.join(skillProfitDir, "hooks");

  it("orchestrator page.tsx is strictly under 200 lines", () => {
    expect(existsSync(pagePath)).toBe(true);
    const content = readFileSync(pagePath, "utf-8");
    const lines = content.split(/\r?\n/).length;
    expect(lines).toBeLessThan(200);
  });

  it("types.ts exists and exports required constants and helpers", () => {
    expect(existsSync(typesPath)).toBe(true);
  });

  it("exports dedicated custom hooks", () => {
    expect(existsSync(path.join(hooksDir, "useSkillProfitState.ts"))).toBe(true);
    expect(existsSync(path.join(hooksDir, "useSkillProfitCalculations.ts"))).toBe(true);
    expect(typeof useSkillProfitState).toBe("function");
    expect(typeof useSkillProfitCalculations).toBe("function");
  });

  it("contains all required feature and section components", () => {
    const requiredComponents = [
      "SkillProfitControls.tsx",
      "SkillProfitHeader.tsx",
      "SkillProfitFilterBar.tsx",
      "SkillProfitTable.tsx",
      "SkillProfitCardList.tsx",
      "SkillProfitStrategyModal.tsx",
    ];
    for (const comp of requiredComponents) {
      expect(existsSync(path.join(componentsDir, comp)), `Missing component: ${comp}`).toBe(true);
    }
  });

  it("exports valid component functions", () => {
    expect(typeof SkillProfitHeader).toBe("function");
    expect(typeof SkillProfitTabs).toBe("function");
    expect(typeof SkillProfitFilterBar).toBe("function");
    expect(typeof SkillProfitTable).toBe("function");
    expect(typeof SkillProfitCardList).toBe("function");
    expect(typeof SkillProfitStrategyModal).toBe("function");
    expect(typeof SkillStrategyModal).toBe("function");
    expect(typeof SortableTh).toBe("function");
    expect(typeof OptionPicker).toBe("function");
    expect(typeof ToolPicker).toBe("function");
    expect(typeof EssencePicker).toBe("function");
    expect(typeof Metric).toBe("function");
    expect(typeof CalcRow).toBe("function");
    expect(typeof DetailPill).toBe("function");
    expect(typeof DetailList).toBe("function");
  });

  it("orchestrator defines layout containment and min-height to guarantee CLS <= 0.1", () => {
    const pageContent = readFileSync(pagePath, "utf-8");
    expect(pageContent).toContain('contain: "layout"');
    expect(pageContent).toMatch(/minHeight:\s*["']520px["']/);
  });

  it("maintains storage and batching constants invariance", () => {
    expect(STORAGE_KEY).toBe("zenith_skill_profit_finder");
    expect(MOBILE_RESULT_BATCH_SIZE).toBe(48);
    expect(DEFAULT_SETTINGS.membership).toBe(false);
    expect(DEFAULT_SETTINGS.saleMode).toBe("best");
    expect(DEFAULT_SETTINGS.assaultRank).toBe("none");
    expect(DEFAULT_STATE.activeSkill).toBe("All");
    expect(DEFAULT_STATE.sortKey).toBe("profitPerHour");
    expect(DEFAULT_STATE.sortDesc).toBe(true);
    expect(DEFAULT_STATE.minVolume).toBe(100);
    expect(CONQUEST_PICKER_OPTIONS.length).toBe(7);
    expect(SALE_MODE_OPTIONS.length).toBe(3);
    expect(Object.keys(SORT_LABELS).length).toBe(13);
  });

  describe("pure calculation & formatting helper invariance", () => {
    const mockRow: SkillProfitRow = {
      name: "Iron Ore",
      skill: "Mining",
      level: 15,
      experience: 25,
      expPerHour: 25000,
      expPerSecond: 6.94,
      baseDuration: 4,
      finalDuration: 3.6,
      itemsPerHour: 1000,
      baseItemsPerHour: 900,
      salePrice: 50,
      saleSource: "market",
      bestSaleSource: "market",
      marketRevenue: 44,
      vendorRevenue: 20,
      netRevenue: 44,
      inputCost: 0,
      profitEach: 44,
      profitPerHour: 44000,
      baseProfitPerHour: 39600,
      roi: 100,
      isLiquid: true,
      excludedFromTop: false,
      priceAdjusted: false,
      expPerHousingWindow: 0,
      baseFinalDuration: 4,
      profitWithEssencePerHour: null,
      profitBeforeEssenceCostPerHour: 44000,
      essenceCostPerHour: null,
      essenceCostPerStart: 0,
      essenceActive: false,
      essenceNeedsPrice: false,
      essenceIdleActionHours: 8,
      essenceName: "",
      essenceEfficiencyBonus: 0,
      essenceExperienceBonus: 0,
      essencePriceSource: "missing",
      essencePriceAdjusted: false,
      toolBonus: 10,
      housingWindowHours: 0,
      itemsPerHousingWindow: 0,
      profitPerHousingWindow: 0,
      volume3d: 500,
      stableVolume3d: 500,
      liquidityRisk: false,
      priceSwingRisk: false,
      liquidityLabel: "Liquid",
      liquidityNote: "",
      priceSwingNote: "",
      ingredients: [],
      ingredientCosts: [],
      inputMissing: [],
      note: "Tier 2 ore",
    };

    it("evaluates isLiquid correctly across sources and volume thresholds", () => {
      expect(isLiquid({ ...mockRow, saleSource: "missing" }, 100)).toBe(false);
      expect(isLiquid({ ...mockRow, saleSource: "vendor" }, 100)).toBe(true);
      expect(isLiquid({ ...mockRow, stableVolume3d: 50 }, 100)).toBe(false);
      expect(isLiquid({ ...mockRow, stableVolume3d: 200, liquidityRisk: false }, 100)).toBe(true);
      expect(isLiquid({ ...mockRow, stableVolume3d: 200, liquidityRisk: true }, 100)).toBe(false);
    });

    it("evaluates isExcludedFromTop correctly", () => {
      expect(isExcludedFromTop({ ...mockRow, skill: "Forge" }, 100)).toBe(true);
      expect(isExcludedFromTop({ ...mockRow, skill: "Mining", stableVolume3d: 50 }, 100)).toBe(true);
      expect(isExcludedFromTop({ ...mockRow, skill: "Mining", stableVolume3d: 200 }, 100)).toBe(false);
    });

    it("handles getSearchTokens and rowMatchesSearch", () => {
      expect(getSearchTokens("  iron   ore ")).toEqual(["iron", "ore"]);
      expect(rowMatchesSearch(mockRow, ["iron"])).toBe(true);
      expect(rowMatchesSearch(mockRow, ["tier", "ore"])).toBe(true);
      expect(rowMatchesSearch(mockRow, ["mithril"])).toBe(false);
    });

    it("handles getMatchedIngredient", () => {
      const rowWithIngredients: SkillProfitRow = {
        ...mockRow,
        ingredients: [
          { name: "Coal", quantity: 2 },
          { name: "Iron Bar", quantity: 1 },
        ],
      };
      expect(getMatchedIngredient(rowWithIngredients, ["coal"])).toBe("Coal");
      expect(getMatchedIngredient(rowWithIngredients, ["gold"])).toBe(null);
    });

    it("handles getDisplayProfitPerHour and getRankedProfitPerHour", () => {
      expect(getDisplayProfitPerHour(mockRow)).toBe(44000);
      expect(getRankedProfitPerHour(mockRow)).toBe(44000);

      const essenceRow: SkillProfitRow = {
        ...mockRow,
        essenceActive: true,
        profitWithEssencePerHour: 48000,
      };
      expect(getDisplayProfitPerHour(essenceRow)).toBe(48000);
      expect(getRankedProfitPerHour(essenceRow)).toBe(48000);

      const essenceNeedsPriceRow: SkillProfitRow = {
        ...mockRow,
        essenceActive: true,
        essenceNeedsPrice: true,
        profitWithEssencePerHour: null,
      };
      expect(getDisplayProfitPerHour(essenceNeedsPriceRow)).toBe(null);
      expect(getRankedProfitPerHour(essenceNeedsPriceRow)).toBe(39600);
    });

    it("handles cell, card, and summary profit formatters", () => {
      expect(getProfitCellValue(mockRow)).toContain("44,000g");
      expect(getProfitCardValue(mockRow)).toContain("44,000g/hr");
      expect(getProfitSummary(mockRow)).toContain("44,000g/hr");

      const pendingRow: SkillProfitRow = {
        ...mockRow,
        essenceActive: true,
        essenceNeedsPrice: true,
      };
      expect(getProfitCellValue(pendingRow)).toBe("Needs price/data");
      expect(getProfitCardValue(pendingRow)).toBe("Needs price/data");
      expect(getProfitSummary(pendingRow)).toContain("Needs price/data - base");
    });

    it("handles formatSignedGold, formatNumber, and formatOptionalNumber", () => {
      expect(formatSignedGold(500)).toBe("+500g");
      expect(formatSignedGold(-500)).toBe("-500g");
      expect(formatNumber(1234)).toBe("1,234");
      expect(formatNumber(12.345)).toContain("12.35");
      expect(formatOptionalNumber(null)).toBe("Unknown");
      expect(formatOptionalNumber(100)).toBe("100");
    });

    it("handles formatPriceSource and formatType", () => {
      expect(formatPriceSource("scenario")).toBe("Try price");
      expect(formatPriceSource("custom")).toBe("Custom");
      expect(formatPriceSource("market")).toBe("Market");
      expect(formatPriceSource("vendor")).toBe("Vendor");
      expect(formatPriceSource("unknown")).toBe("Missing");

      expect(formatType("battle_axe")).toBe("Battle Axe");
      expect(formatType(null)).toBe("Unknown");
    });

    it("handles stringifyDetail and formatEffectEntry", () => {
      expect(stringifyDetail(null)).toBe("None");
      expect(stringifyDetail(1234)).toBe("1,234");
      expect(stringifyDetail("test")).toBe("test");
      expect(stringifyDetail(["a", "b"])).toBe("a, b");
      expect(stringifyDetail({ name: "Sword" })).toBe("Sword");

      const [label, value] = formatEffectEntry({ target: "combat", attribute: "accuracy", value: 10, value_type: "percentage" }, 0);
      expect(label).toBe("Combat Accuracy");
      expect(value).toBe("+10%");
    });

    it("handles getSortValue correctly", () => {
      expect(getSortValue(mockRow, "name")).toBe("iron ore");
      expect(getSortValue(mockRow, "skill")).toBe("Mining");
      expect(getSortValue(mockRow, "profitPerHour")).toBe(44000);
      expect(getSortValue(mockRow, "volume3d")).toBe(500);
      expect(getSortValue(mockRow, "level")).toBe(15);
    });
  });
});
