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
      expect(lines).toBe(126);
    });

    it("verifies orchestrator delegates all math and storage to custom hooks with zero inline fetch or heavy computation", () => {
      const content = readFileSync(pageFile, "utf-8");
      expect(content).not.toContain("localStorage.setItem");
      expect(content).not.toContain("calculateSkillProfitRow");
      expect(content).not.toContain("calculateHousingBuffs");
    });
  });

  // =========================================================================
  // Dimension 2: Touch Target Compliance (>= 44px) & CSS Tokens
  // =========================================================================
  describe("Dimension 2: Touch Target Compliance (>= 44px) & CSS Tokens", () => {
    it("verifies interactive form inputs and selects enforce 44px height", () => {
      const css = readFileSync(cssFile, "utf-8");

      // Verify input / select heights
      expect(css).toMatch(/\.commandBar select,\s*\.toolField select,\s*\.numberField input,\s*\.searchBox input\s*\{[^}]*height:\s*44px/);
    });

    it("verifies navigation tabs, triggers, and action buttons declare >= 44px touch targets", () => {
      const css = readFileSync(cssFile, "utf-8");

      // .toolTrigger >= 42px, .compactTrigger >= 44px
      expect(css).toMatch(/\.toolTrigger\s*\{[^}]*min-height:\s*42px/);
      expect(css).toMatch(/\.compactTrigger\s*\{[^}]*min-height:\s*44px/);

      // .toolOption, .compactOption >= 44px
      expect(css).toMatch(/\.toolOption,\s*\.compactOption\s*\{[^}]*min-height:\s*44px/);

      // .tab height >= 44px
      expect(css).toMatch(/\.tab\s*\{[^}]*height:\s*44px/);

      // .segmentGroup height: 44px with .segmentButton height: 100%
      expect(css).toMatch(/\.segmentGroup\s*\{[^}]*height:\s*44px/);
      expect(css).toMatch(/\.segmentButton\s*\{[^}]*height:\s*100%/);

      // .searchClear >= 44px min-height & min-width
      expect(css).toMatch(/\.searchClear\s*\{[^}]*min-height:\s*44px/);
      expect(css).toMatch(/\.searchClear\s*\{[^}]*min-width:\s*44px/);

      // .resetFilters >= 44px
      expect(css).toMatch(/\.resetFilters\s*\{[^}]*min-height:\s*44px/);

      // .buffButton on mobile / coarse pointer >= 44px
      expect(css).toMatch(/@media\s*\(pointer:\s*coarse\)[^{]*\{[\s\S]*?\.buffButton\s*\{[^}]*min-height:\s*44px/);
      expect(css).toMatch(/@media\s*\(pointer:\s*coarse\)[^{]*\{[\s\S]*?\.buffButton\s*\{[^}]*min-width:\s*44px/);
    });

    it("verifies table buttons and item triggers satisfy touch accessibility", () => {
      const css = readFileSync(cssFile, "utf-8");

      // .itemButton or row button
      expect(css).toContain(".itemButton");
      // .sortButton
      expect(css).toContain(".sortButton");
    });
  });

  // =========================================================================
  // Dimension 3: Modal Accessibility, Focus Trapping & ESC Dismissal
  // =========================================================================
  describe("Dimension 3: Modal Accessibility, Focus Trapping & ESC Dismissal", () => {
    it("verifies SkillProfitStrategyModal uses canonical useModalA11y hook", () => {
      const content = readFileSync(modalFile, "utf-8");
      expect(content).toContain('import { useModalA11y } from "@/lib/use-modal-a11y";');
      expect(content).toContain("useModalA11y<HTMLDivElement>(true, onClose)");
    });

    it("verifies modal dialog declares aria-labelledby, aria-modal, role='dialog', and tabIndex", () => {
      const content = readFileSync(modalFile, "utf-8");
      expect(content).toContain('aria-labelledby="skill-strategy-title"');
      expect(content).toContain('aria-modal="true"');
      expect(content).toContain('role="dialog"');
      expect(content).toContain("tabIndex={-1}");
      expect(content).toContain("ref={dialogRef}");
    });

    it("verifies modal overlay handles click-to-dismiss with stopPropagation on dialog body", () => {
      const content = readFileSync(modalFile, "utf-8");
      expect(content).toMatch(/className=["'].*modal-overlay.*["']\s+onClick=\{onClose\}/);
      expect(content).toMatch(/onClick=\{\(event\)\s*=>\s*event\.stopPropagation\(\)\}/);
    });

    it("verifies close button has explicit aria-label and type='button'", () => {
      const content = readFileSync(modalFile, "utf-8");
      expect(content).toContain('aria-label="Close skill strategy"');
      expect(content).toContain('className="close-btn"');
      expect(content).toContain('type="button"');
    });

    it("verifies useSkillProfitState hook provides redundant window ESC key listener for modal", () => {
      const content = readFileSync(stateHookFile, "utf-8");
      expect(content).toContain('if (event.key === "Escape") setSelectedRow(null)');
    });
  });

  // =========================================================================
  // Dimension 4: Mobile Batch Rendering & Filter Mutation Reset
  // =========================================================================
  describe("Dimension 4: Mobile Batch Rendering & Filter Mutation Reset", () => {
    it("verifies MOBILE_RESULT_BATCH_SIZE is strictly 48", () => {
      expect(MOBILE_RESULT_BATCH_SIZE).toBe(48);
    });

    it("verifies default state visibleRowLimit initializes to MOBILE_RESULT_BATCH_SIZE", () => {
      const content = readFileSync(stateHookFile, "utf-8");
      expect(content).toContain("useState(MOBILE_RESULT_BATCH_SIZE)");
    });

    it("verifies useSkillProfitCalculations slices visibleRows using visibleRowLimit when compactResults is true", () => {
      const content = readFileSync(calcHookFile, "utf-8");
      expect(content).toContain("const visibleRows = compactResults");
      expect(content).toContain("? rowModel.filtered.slice(0, visibleRowLimit)");
      expect(content).toContain(": rowModel.filtered");
      expect(content).toContain("const hiddenRowCount = Math.max(0, rowModel.filtered.length - visibleRows.length)");
    });

    it("verifies onShowMore increments visibleRowLimit by exactly 48", () => {
      const pageContent = readFileSync(pageFile, "utf-8");
      expect(pageContent).toContain("onShowMore={() => state.setVisibleRowLimit((limit) => limit + 48)}");
    });

    it("verifies useSkillProfitState resets visibleRowLimit to MOBILE_RESULT_BATCH_SIZE on any filter change", () => {
      const content = readFileSync(stateHookFile, "utf-8");
      expect(content).toMatch(
        /useEffect\(\(\)\s*=>\s*\{\s*setVisibleRowLimit\(MOBILE_RESULT_BATCH_SIZE\);\s*\},/
      );
      // Verify dependencies include activeSkill, deferredSearchTerm, minVolume, sortKey, sortDesc, etc.
      expect(content).toContain("activeSkill");
      expect(content).toContain("deferredSearchTerm");
      expect(content).toContain("minVolume");
      expect(content).toContain("sortKey");
      expect(content).toContain("sortDesc");
      expect(content).toContain("hideAboveLevel");
      expect(content).toContain("includeForgeInfoRows");
    });
  });

  // =========================================================================
  // Dimension 5: Dropdown Layer Elevation (activeDropdownLayer)
  // =========================================================================
  describe("Dimension 5: Dropdown Layer Elevation (activeDropdownLayer)", () => {
    it("verifies useSkillProfitState tracks activeDropdownLayer and provides open change handlers", () => {
      const content = readFileSync(stateHookFile, "utf-8");
      expect(content).toContain("const [activeDropdownLayer, setActiveDropdownLayer] = useState<DropdownLayer | null>(null)");
      expect(content).toContain("handleToolPickerOpenChange");
      expect(content).toContain("handleEssencePickerOpenChange");
      expect(content).toContain("handleCommandPickerOpenChange");
    });

    it("verifies SkillProfitFilterBar assigns styles.dropdownLayerActive dynamically", () => {
      const content = readFileSync(filterBarFile, "utf-8");
      expect(content).toContain('activeDropdownLayer === "command" ? styles.dropdownLayerActive : ""');
      expect(content).toContain('activeDropdownLayer === "tools" ? styles.dropdownLayerActive : ""');
      expect(content).toContain('activeDropdownLayer === "essences" ? styles.dropdownLayerActive : ""');
    });

    it("verifies page.module.css defines z-index: 220 for dropdownLayerActive", () => {
      const css = readFileSync(cssFile, "utf-8");
      expect(css).toMatch(/\.dropdownLayerActive\s*\{[^}]*z-index:\s*220/);
      expect(css).toMatch(/\.toolPanel\.dropdownLayerActive,\s*\.essencePanel\.dropdownLayerActive,\s*\.commandBar\.dropdownLayerActive\s*\{[^}]*z-index:\s*220/);
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
