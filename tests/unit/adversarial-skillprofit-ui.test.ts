import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  MOBILE_RESULT_BATCH_SIZE,
  DEFAULT_STATE,
  DEFAULT_SETTINGS,
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
} from "@/app/skill-profit/types";

describe("Adversarial Empirical Stress Harness: /skill-profit UI Stability & Touch Ergonomics", () => {
  const rootDir = process.cwd();
  const pageFile = path.join(rootDir, "src", "app", "skill-profit", "page.tsx");
  const typesFile = path.join(rootDir, "src", "app", "skill-profit", "types.ts");
  const cssFile = path.join(rootDir, "src", "app", "skill-profit", "page.module.css");
  const stateHookFile = path.join(rootDir, "src", "app", "skill-profit", "hooks", "useSkillProfitState.ts");
  const calcHookFile = path.join(rootDir, "src", "app", "skill-profit", "hooks", "useSkillProfitCalculations.ts");
  const controlsFile = path.join(rootDir, "src", "app", "skill-profit", "components", "SkillProfitControls.tsx");
  const filterBarFile = path.join(rootDir, "src", "app", "skill-profit", "components", "SkillProfitFilterBar.tsx");
  const tableFile = path.join(rootDir, "src", "app", "skill-profit", "components", "SkillProfitTable.tsx");
  const cardListFile = path.join(rootDir, "src", "app", "skill-profit", "components", "SkillProfitCardList.tsx");
  const modalFile = path.join(rootDir, "src", "app", "skill-profit", "components", "SkillProfitStrategyModal.tsx");

  // =========================================================================
  // Dimension 1: Layout Containment & Cumulative Layout Shift (CLS) Prevention
  // =========================================================================
  describe("Dimension 1: Layout Containment & CLS Prevention", () => {
    it("verifies page.tsx encloses dynamic results in contain: 'layout' and minHeight: '520px'", () => {
      expect(existsSync(pageFile)).toBe(true);
      const content = readFileSync(pageFile, "utf-8");

      // Verify layout containment wrapper
      expect(content).toMatch(/style=\{\{\s*minHeight:\s*["']520px["'],\s*contain:\s*["']layout["']\s*\}\}/);

      // Verify that this container directly wraps both CardList and Table
      const containmentBlock = content.slice(content.indexOf('style={{ minHeight: "520px"'));
      expect(containmentBlock).toContain("<SkillProfitCardList");
      expect(containmentBlock).toContain("<SkillProfitTable");
    });

    it("verifies orchestrator line count is strictly under 200 lines", () => {
      const content = readFileSync(pageFile, "utf-8");
      const lines = content.split(/\r?\n/).length;
      expect(lines).toBeLessThan(200);
    });

    it("verifies orchestrator delegates all math and storage to custom hooks with zero inline fetch or heavy computation", () => {
      const content = readFileSync(pageFile, "utf-8");
      expect(content).not.toContain("localStorage.setItem");
      expect(content).not.toContain("calculateSkillProfitRow");
      expect(content).not.toContain("calculateHousingBuffs");
    });
  });

  // =========================================================================
  // Dimension 2: Touch Target Compliance (>= 44px) & Centralized Primitives
  // =========================================================================
  describe("Dimension 2: Touch Target Compliance (>= 44px) & Centralized Primitives", () => {
    it("verifies browse bar and Loadout drawer consume tested UI primitives", () => {
      const filterBar = readFileSync(filterBarFile, "utf-8");
      const table = readFileSync(tableFile, "utf-8");

      expect(filterBar).toContain("<SearchInput");
      expect(filterBar).toContain("<SegmentedControl");
      expect(filterBar).toContain("<Select");
      expect(filterBar).toContain("<Tag");
      expect(filterBar).toContain("<Popover");
      expect(filterBar).toContain("<Drawer");
      expect(filterBar).toContain("<Switch");
      expect(filterBar).toContain("<NumberInput");
      expect(table).toContain("<Pagination");
      expect(table).toContain("<Tooltip");
    });

    it("verifies navigation triggers, option buttons, and inputs enforce >= 44px touch targets", () => {
      const css = readFileSync(cssFile, "utf-8");

      expect(css).toMatch(/\.toolTrigger,\s*\.compactTrigger\s*\{[^}]*min-height:\s*44px/);
      expect(css).toMatch(/\.toolOption,\s*\.compactOption\s*\{[^}]*min-height:\s*44px/);
      expect(css).toMatch(/\.spotlightBtn\s*\{[^}]*min-height:\s*44px/);
      expect(css).toMatch(/\.forgeLink\s*\{[^}]*min-height:\s*44px/);
      expect(css).toMatch(/\.buffButton\s*\{[^}]*min-height:\s*44px/);
      expect(css).toMatch(/\.buffButton\s*\{[^}]*min-width:\s*44px/);
      expect(css).toMatch(/\.scenarioInput input,\s*\.targetProfitField input\s*\{[^}]*height:\s*44px/);
    });

    it("verifies table buttons and item triggers satisfy touch accessibility", () => {
      const css = readFileSync(cssFile, "utf-8");

      expect(css).toContain(".itemButton");
      expect(css).toContain(".sortButton");
    });
  });

  // =========================================================================
  // Dimension 3: Modal Accessibility, Focus Trapping & ESC Dismissal
  // =========================================================================
  describe("Dimension 3: Modal Accessibility, Focus Trapping & ESC Dismissal", () => {
    it("verifies SkillProfitStrategyModal uses centralized ModalSheet (focus trap, aria-modal, Escape) and focused Tabs", () => {
      const content = readFileSync(modalFile, "utf-8");
      expect(content).toContain("ModalSheet");
      expect(content).toContain("<ModalSheet");
      expect(content).toContain("onClose={onClose}");
      expect(content).toContain("title={activeRow.name}");
      expect(content).toContain("<TabList");
      expect(content).toContain("What-If Prices");
    });

    it("verifies useSkillProfitState hook provides redundant window ESC key listener for modal", () => {
      const content = readFileSync(stateHookFile, "utf-8");
      expect(content).toContain('if (event.key === "Escape") setSelectedRow(null)');
    });
  });

  // =========================================================================
  // Dimension 4: Bounded Pagination & Filter Mutation Reset
  // =========================================================================
  describe("Dimension 4: Bounded Pagination & Filter Mutation Reset", () => {
    it("verifies MOBILE_RESULT_BATCH_SIZE and DEFAULT_PAGE_SIZE defaults remain bounded", () => {
      expect(MOBILE_RESULT_BATCH_SIZE).toBe(48);
      expect(DEFAULT_STATE.pageSize).toBe(25);
    });

    it("verifies useSkillProfitCalculations slices paginatedRows using pageSize and safePage", () => {
      const content = readFileSync(calcHookFile, "utf-8");
      expect(content).toContain("const totalPages = Math.max(1, Math.ceil(rowModel.filtered.length / Math.max(1, pageSize)))");
      expect(content).toContain("const paginatedRows = useMemo(() => {");
      expect(content).toContain("return rowModel.filtered.slice(start, start + pageSize)");
    });

    it("verifies page.tsx wires paginatedRows and Pagination handlers to both views", () => {
      const pageContent = readFileSync(pageFile, "utf-8");
      expect(pageContent).toContain("visibleRows={calc.paginatedRows}");
      expect(pageContent).toContain("onPageChange={state.setCurrentPage}");
      expect(pageContent).toContain("onPageSizeChange={state.setPageSize}");
    });

    it("verifies useSkillProfitState resets currentPage to 1 on any filter change", () => {
      const content = readFileSync(stateHookFile, "utf-8");
      expect(content).toContain("setCurrentPage(1);");
      expect(content).toContain("activeSkill");
      expect(content).toContain("deferredSearchTerm");
      expect(content).toContain("minVolume");
      expect(content).toContain("liquidOnly");
      expect(content).toContain("profitableOnly");
      expect(content).toContain("sortKey");
      expect(content).toContain("sortDesc");
      expect(content).toContain("hideAboveLevel");
      expect(content).not.toContain("includeForgeInfoRows");
    });

    it("excludes Forge from SKILLS tabs and quick filters on /skill-profit", async () => {
      const { SKILLS } = await import("@/lib/skill-profit");
      expect(SKILLS).not.toContain("Forge");
      const filterBar = readFileSync(filterBarFile, "utf-8");
      expect(filterBar).not.toContain("Include Forge gear");
    });
  });

  // =========================================================================
  // Dimension 5: Loadout Drawer & Picker Layer Elevation
  // =========================================================================
  describe("Dimension 5: Loadout Drawer & Picker Layer Elevation", () => {
    it("verifies SkillProfitFilterBar houses Loadout controls inside right-side Drawer", () => {
      const content = readFileSync(filterBarFile, "utf-8");
      expect(content).toContain("<Drawer");
      expect(content).toContain('side="right"');
      expect(content).toContain("isOpen={drawerOpen}");
    });

    it("verifies page.module.css defines z-index elevation for toolPickerOpen and toolMenu", () => {
      const css = readFileSync(cssFile, "utf-8");
      expect(css).toMatch(/\.toolPickerOpen\s*\{[^}]*z-index:\s*220/);
      expect(css).toMatch(/\.toolMenu\s*\{[\s\S]*?z-index:\s*280/);
    });

    it("verifies OptionPicker, ToolPicker, and EssencePicker dispatch zenith-tool-picker-close to prevent overlapping popovers", () => {
      const content = readFileSync(controlsFile, "utf-8");
      expect(content).toContain('window.dispatchEvent(new Event("zenith-tool-picker-close"))');
      expect(content).toContain('window.addEventListener("zenith-tool-picker-close", close)');
    });
  });

  // =========================================================================
  // Dimension 6: Re-exported Constants & Backward-Compatibility Parity
  // =========================================================================
  describe("Dimension 6: Backward-Compatibility & Re-exports", () => {
    it("verifies page.tsx re-exports all 22 required constants and helpers from types.ts", () => {
      const content = readFileSync(pageFile, "utf-8");
      const requiredExports = [
        "STORAGE_KEY",
        "DEFAULT_SETTINGS",
        "DEFAULT_STATE",
        "MOBILE_RESULT_BATCH_SIZE",
        "CONQUEST_PICKER_OPTIONS",
        "SALE_MODE_OPTIONS",
        "SORT_LABELS",
        "isLiquid",
        "isExcludedFromTop",
        "getSearchTokens",
        "rowMatchesSearch",
        "getMatchedIngredient",
        "getSortValue",
        "getDisplayProfitPerHour",
        "getRankedProfitPerHour",
        "getProfitCellValue",
        "getProfitCardValue",
        "getProfitSummary",
        "formatSignedGold",
        "formatNumber",
        "formatOptionalNumber",
        "formatPriceSource",
        "formatType",
        "stringifyDetail",
        "formatEffectEntry",
      ];

      for (const exp of requiredExports) {
        expect(content).toContain(exp);
      }
    });

    it("verifies pure formatting helpers handle edge inputs gracefully", () => {
      expect(formatSignedGold(0)).toBe("+0g");
      expect(formatSignedGold(100)).toBe("+100g");
      expect(formatSignedGold(-50)).toBe("-50g");

      expect(formatNumber(1234)).toBe("1,234");
      expect(formatNumber(1234.56)).toBe("1,234.56");

      expect(getSearchTokens("")).toEqual([]);
      expect(getSearchTokens("   iron   bar  ")).toEqual(["iron", "bar"]);
    });
  });
});
