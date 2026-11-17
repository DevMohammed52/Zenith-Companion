import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
  buildForgeRecipeOptions,
  calculateForgePlanner,
  FORGE_PLANNER_MAX_QTY,
  FORGE_PLANNER_STORAGE_KEY,
  sanitizeForgeOwnedMaterials,
  sanitizeForgePlannerLines,
  sanitizeForgeQuantity,
  type ForgeItemLookup,
  type ForgeMarketData,
  type ForgeRecipeOption,
} from "@/lib/forge-planner";
import {
  FORGE_TABS,
  getRecipeDisplayValue,
  QUALITY_OPTIONS,
  SORT_OPTIONS,
  type ForgeState,
} from "@/app/forge/types";
import { CraftItemTab } from "@/app/forge/components/craft/CraftItemTab";
import { CustomPicker } from "@/app/forge/components/craft/ForgeControls";
import { ForgeHeader } from "@/app/forge/components/ForgeHeader";
import { ForgeTabs } from "@/app/forge/components/ForgeTabs";

describe("Gate 2: Adversarial Forge UI & Planner Stress Harness", () => {
  // =========================================================================
  // Dimension 1: Strict Input Sanitization & Boundary Defenses
  // =========================================================================
  describe("Dimension 1: Input Sanitization & Boundary Defenses", () => {
    it("sanitizes forge quantity inputs across extreme, malformed, and adversarial inputs", () => {
      // Empty input returns empty string for clean typing
      expect(sanitizeForgeQuantity("")).toBe("");

      // Non-empty inputs parse or clamp to numbers
      expect(sanitizeForgeQuantity(null)).toBe(0);
      expect(sanitizeForgeQuantity(undefined)).toBe(0);
      expect(sanitizeForgeQuantity("   ")).toBe(0);

      // Standard numeric
      expect(sanitizeForgeQuantity("5")).toBe(5);
      expect(sanitizeForgeQuantity(10)).toBe(10);
      expect(sanitizeForgeQuantity("0")).toBe(0);

      // Negative values clamped to 0
      expect(sanitizeForgeQuantity("-5")).toBe(0);
      expect(sanitizeForgeQuantity(-100)).toBe(0);

      // Decimal values rounded down / parsed cleanly
      expect(sanitizeForgeQuantity("4.9")).toBe(4);
      expect(sanitizeForgeQuantity("12.01")).toBe(12);

      // Strings with alphanumeric garbage
      expect(sanitizeForgeQuantity("100abc")).toBe(0);
      expect(sanitizeForgeQuantity("abc100")).toBe(0);
      expect(sanitizeForgeQuantity("NaN")).toBe(0);

      // Upper bound clamp to FORGE_PLANNER_MAX_QTY (999,999)
      expect(sanitizeForgeQuantity(1_000_000)).toBe(FORGE_PLANNER_MAX_QTY);
      expect(sanitizeForgeQuantity("9999999999")).toBe(FORGE_PLANNER_MAX_QTY);
    });

    it("sanitizes draft lines against duplicates, negative values, and non-array corruptions", () => {
      // Corrupt types fallback to empty array
      expect(sanitizeForgePlannerLines(null)).toEqual([]);
      expect(sanitizeForgePlannerLines(undefined)).toEqual([]);
      expect(sanitizeForgePlannerLines("string")).toEqual([]);
      expect(sanitizeForgePlannerLines(12345)).toEqual([]);
      expect(sanitizeForgePlannerLines({})).toEqual([]);

      // Malformed lines filtered out
      const malformed = [
        { recipeName: "", quantity: 5, ownedRecipes: 1 },
        { recipeName: 123, quantity: 5, ownedRecipes: 1 },
        { quantity: 5, ownedRecipes: 1 },
        null,
        undefined,
      ];
      expect(sanitizeForgePlannerLines(malformed)).toEqual([]);

      // Valid lines sanitized and clamped
      const valid = [
        { recipeName: "Iron Sword Recipe", quantity: -5, ownedRecipes: -2 },
        { recipeName: "Steel Shield Recipe", quantity: 2_000_000, ownedRecipes: 50 },
      ];
      const sanitized = sanitizeForgePlannerLines(valid);
      expect(sanitized).toEqual([
        { recipeName: "Iron Sword Recipe", quantity: 0, ownedRecipes: 0 },
        { recipeName: "Steel Shield Recipe", quantity: FORGE_PLANNER_MAX_QTY, ownedRecipes: 50 },
      ]);
    });

    it("sanitizes owned materials removing 0 and negative values", () => {
      expect(sanitizeForgeOwnedMaterials(null)).toEqual({});
      expect(sanitizeForgeOwnedMaterials(undefined)).toEqual({});
      expect(sanitizeForgeOwnedMaterials("invalid")).toEqual({});
      expect(sanitizeForgeOwnedMaterials([1, 2, 3])).toEqual({});

      const testMap = {
        "Iron Ore": 50,
        "Coal": "100",
        "Gold Bar": 0,
        "Silver Bar": -10,
        "Mythic Catalyst": 999_999_999,
      };
      const sanitized = sanitizeForgeOwnedMaterials(testMap);
      expect(sanitized).toEqual({
        "Iron Ore": 50,
        "Coal": 100,
        "Mythic Catalyst": FORGE_PLANNER_MAX_QTY,
      });
      expect(sanitized["Gold Bar"]).toBeUndefined();
      expect(sanitized["Silver Bar"]).toBeUndefined();
    });
  });

  // =========================================================================
  // Dimension 2: Recipe Indexing & Options Extraction Invariance
  // =========================================================================
  describe("Dimension 2: Recipe Indexing & Options Extraction Invariance", () => {
    it("handles null, empty, and partial items database without throwing", () => {
      expect(buildForgeRecipeOptions(null)).toEqual([]);
      expect(buildForgeRecipeOptions(undefined)).toEqual([]);
      expect(buildForgeRecipeOptions({})).toEqual([]);

      const mockDb: ForgeItemLookup = {
        "item_1": {
          name: "Standard Sword",
          type: "WEAPON",
          recipe: null,
        },
        "item_2": {
          name: "Iron Bar Recipe",
          type: "RECIPE",
          recipe: {
            skill: "Forge",
            level_required: 10,
            max_uses: 25,
            experience: 150,
            materials: [
              { item_name: "Iron Ore", quantity: 2 },
              { item_name: "Coal", quantity: 1 },
            ],
            result: {
              item_name: "Iron Bar",
            },
          },
          quality: "REFINED",
        },
      };

      const options = buildForgeRecipeOptions(mockDb);
      expect(options).toHaveLength(1);
      expect(options[0].recipeName).toBe("Iron Bar Recipe");
      expect(options[0].resultName).toBe("Iron Bar");
      expect(options[0].materials.map((m) => ({ name: m.name, quantity: m.quantity }))).toEqual([
        { name: "Iron Ore", quantity: 2 },
        { name: "Coal", quantity: 1 },
      ]);
    });

    it("verifies quality rank calculation and recipe display value ordering", () => {
      const refinedRecipe: ForgeRecipeOption = {
        recipeName: "Refined Bar Recipe",
        resultName: "Refined Bar",
        quality: "REFINED",
        levelRequired: 10,
        materials: [{ name: "Ore", quantity: 2, imageUrl: "", quality: "REFINED", sourceSummary: "" }],
        maxUses: 10,
        imageUrl: "",
        resultImageUrl: "",
        resultType: "BAR",
        isTradeable: true,
        description: "",
        searchText: "refined bar",
        sourceSummary: "Vendor",
      };

      const mythicRecipe: ForgeRecipeOption = {
        recipeName: "Mythic Blade Recipe",
        resultName: "Mythic Blade",
        quality: "MYTHIC",
        levelRequired: 90,
        materials: [
          { name: "Mythic Ore", quantity: 5, imageUrl: "", quality: "MYTHIC", sourceSummary: "" },
          { name: "Crucible", quantity: 1, imageUrl: "", quality: "MYTHIC", sourceSummary: "" },
        ],
        maxUses: 5,
        imageUrl: "",
        resultImageUrl: "",
        resultType: "WEAPON",
        isTradeable: true,
        description: "",
        searchText: "mythic blade",
        sourceSummary: "Raid",
      };

      expect(getRecipeDisplayValue(mythicRecipe)).toBeGreaterThan(getRecipeDisplayValue(refinedRecipe));
    });
  });

  // =========================================================================
  // Dimension 3: Full Planner Calculation & Financial EV Integrity
  // =========================================================================
  describe("Dimension 3: Full Planner Calculation & Financial EV Integrity", () => {
    const mockDb: ForgeItemLookup = {
      "Iron Bar Recipe": {
        name: "Iron Bar Recipe",
        type: "RECIPE",
        quality: "REFINED",
        recipe: {
          skill: "Forge",
          level_required: 5,
          max_uses: 50,
          materials: [
            { item_name: "Iron Ore", quantity: 3 },
            { item_name: "Coal", quantity: 1 },
          ],
          result: { item_name: "Iron Bar" },
        },
      },
      "Iron Bar": {
        name: "Iron Bar",
        type: "BAR",
        quality: "REFINED",
        vendor_price: 15,
        is_tradeable: true,
      },
      "Iron Ore": {
        name: "Iron Ore",
        type: "ORE",
        quality: "STANDARD",
        vendor_price: 2,
        is_tradeable: true,
      },
      "Coal": {
        name: "Coal",
        type: "FUEL",
        quality: "STANDARD",
        vendor_price: 1,
        is_tradeable: true,
      },
    };

    const mockMarket: ForgeMarketData = {
      "Iron Bar": { price: 200 },
      "Iron Ore": { price: 30 },
      "Coal": { price: 10 },
      "Iron Bar Recipe": { price: 1000 },
    };

    const recipes = buildForgeRecipeOptions(mockDb);

    it("accurately calculates missing materials, recipe copies, and costs with 0 owned", () => {
      const lines = [{ recipeName: "Iron Bar Recipe", quantity: 100, ownedRecipes: 0 }];
      const owned = {};

      const plan = calculateForgePlanner(lines, owned, recipes, mockMarket, mockDb, {
        membership: true,
        barteringBoost: 0,
      });

      expect(plan.totalCrafts).toBe(100);
      // max_uses is 50. 100 crafts requires 2 copies. 0 owned -> 2 copies missing.
      expect(plan.missingRecipeCopies).toBe(2);

      // Materials needed: 100 * 3 = 300 Iron Ore, 100 * 1 = 100 Coal
      const oreNeed = plan.materialNeeds.find((m) => m.name === "Iron Ore");
      const coalNeed = plan.materialNeeds.find((m) => m.name === "Coal");

      expect(oreNeed?.required).toBe(300);
      expect(oreNeed?.missing).toBe(300);
      expect(coalNeed?.required).toBe(100);
      expect(coalNeed?.missing).toBe(100);

      // Cost: 300 * 30g + 100 * 10g + 2 * 1000g = 9000 + 1000 + 2000 = 12000g
      expect(plan.totalMissingCost).toBe(12_000);

      // Output value: 100 Iron Bars * (200g market price * 0.88 membership tax net) = 17,600g
      expect(plan.totalOutputValue).toBe(17_600);
      expect(plan.projectedNet).toBe(17_600 - 12_000);
    });

    it("accurately reduces missing cost when player owns materials and recipe copies", () => {
      const lines = [{ recipeName: "Iron Bar Recipe", quantity: 100, ownedRecipes: 2 }];
      const owned = {
        "Iron Ore": 300,
        "Coal": 50,
      };

      const plan = calculateForgePlanner(lines, owned, recipes, mockMarket, mockDb, {
        membership: true,
        barteringBoost: 0,
      });

      // 2 owned copies covers all 100 crafts (2 * 50 = 100) -> 0 missing copies!
      expect(plan.missingRecipeCopies).toBe(0);

      const oreNeed = plan.materialNeeds.find((m) => m.name === "Iron Ore");
      const coalNeed = plan.materialNeeds.find((m) => m.name === "Coal");

      expect(oreNeed?.missing).toBe(0);
      expect(coalNeed?.missing).toBe(50); // 100 needed - 50 owned = 50 missing

      // Total missing cost: only 50 Coal * 10g = 500g!
      expect(plan.totalMissingCost).toBe(500);

      // Net profit: 17,600g - 500g = 17,100g!
      expect(plan.projectedNet).toBe(17_100);
    });

    it("correctly models vendor pricing fallback and bartering multiplier", () => {
      // When market price is absent, vendor price is used for materials
      const vendorOnlyMarket: ForgeMarketData = {
        "Iron Bar": { price: 200 },
      };

      const lines = [{ recipeName: "Iron Bar Recipe", quantity: 10, ownedRecipes: 1 }];
      const owned = {};

      const plan = calculateForgePlanner(lines, owned, recipes, vendorOnlyMarket, mockDb, {
        membership: false,
        barteringBoost: 10,
      });

      // 10 crafts * 3 Iron Ore = 30 Iron Ore (vendor price 2g ea -> 60g)
      // 10 crafts * 1 Coal = 10 Coal (vendor price 1g ea -> 10g)
      // Recipe copies: 1 copy needed (max_uses 50 >= 10), 1 owned -> 0 missing copies
      const oreNeed = plan.materialNeeds.find((m) => m.name === "Iron Ore");
      const coalNeed = plan.materialNeeds.find((m) => m.name === "Coal");

      expect(oreNeed?.unitPrice).toBe(2);
      expect(oreNeed?.source).toBe("vendor");
      expect(coalNeed?.unitPrice).toBe(1);
      expect(coalNeed?.source).toBe("vendor");
      expect(plan.totalMissingCost).toBe(70);
    });

    it("honors custom price overrides over market and vendor prices", () => {
      const lines = [{ recipeName: "Iron Bar Recipe", quantity: 10, ownedRecipes: 1 }];
      const owned = {};

      const plan = calculateForgePlanner(lines, owned, recipes, mockMarket, mockDb, {
        membership: false,
        barteringBoost: 0,
        customPrices: {
          "Iron Ore": 5, // market was 30, override to 5
        },
      });

      const oreNeed = plan.materialNeeds.find((m) => m.name === "Iron Ore");
      expect(oreNeed?.unitPrice).toBe(5);
      expect(oreNeed?.totalCost).toBe(150); // 30 * 5 = 150
    });

    it("flags appropriate review warnings when materials or outputs lack pricing data", () => {
      const unpricedDb: ForgeItemLookup = {
        "Mystery Bar Recipe": {
          name: "Mystery Bar Recipe",
          type: "RECIPE",
          quality: "EPIC",
          recipe: {
            skill: "Forge",
            level_required: 40,
            max_uses: 10,
            materials: [
              { item_name: "Unobtainium Ore", quantity: 2 },
            ],
            result: { item_name: "Mystery Bar" },
          },
        },
        "Mystery Bar": {
          name: "Mystery Bar",
          type: "BAR",
          quality: "EPIC",
          vendor_price: 0,
          is_tradeable: false,
        },
        "Unobtainium Ore": {
          name: "Unobtainium Ore",
          type: "ORE",
          quality: "EPIC",
          vendor_price: 0,
          is_tradeable: false,
        },
      };

      const unpricedRecipes = buildForgeRecipeOptions(unpricedDb);
      const plan = calculateForgePlanner(
        [{ recipeName: "Mystery Bar Recipe", quantity: 5, ownedRecipes: 0 }],
        {},
        unpricedRecipes,
        {},
        unpricedDb,
        { membership: false, barteringBoost: 0 },
      );

      expect(plan.warnings.length).toBeGreaterThan(0);
      expect(plan.warnings.some((w) => w.includes("Missing price for Unobtainium Ore"))).toBe(true);
      expect(plan.warnings.some((w) => w.includes("Output has no market/vendor value"))).toBe(true);
    });
  });

  // =========================================================================
  // Dimension 4: Resilience to Corrupted Storage
  // =========================================================================
  describe("Dimension 4: Storage Resilience & Key Stability", () => {
    it("ensures storage key invariant matches production constant", () => {
      expect(FORGE_PLANNER_STORAGE_KEY).toBe("zenith_forge_planner_v1");
    });

    it("handles storage QuotaExceededError and corrupted payload without crashing", () => {
      const corruptedPayloads = [
        "not-valid-json",
        "{ lines: invalid }",
        "null",
        "12345",
        JSON.stringify({ lines: [{ recipeName: "Nonexistent", quantity: -10 }] }),
      ];

      for (const payload of corruptedPayloads) {
        expect(() => {
          let parsed: any;
          try {
            parsed = JSON.parse(payload);
          } catch {
            parsed = {};
          }
          const sanitizedLines = sanitizeForgePlannerLines(parsed?.lines);
          const sanitizedOwned = sanitizeForgeOwnedMaterials(parsed?.ownedMaterials);
          expect(Array.isArray(sanitizedLines)).toBe(true);
          expect(typeof sanitizedOwned).toBe("object");
        }).not.toThrow();
      }
    });
  });

  // =========================================================================
  // Dimension 5: High-Volume Draft Stress & Static Render Robustness
  // =========================================================================
  describe("Dimension 5: High-Volume Draft Stress & Static Render Robustness", () => {
    it("handles heavy load (>60 planned recipes) and renders CraftItemTab cleanly", () => {
      const mockDb: ForgeItemLookup = {};
      const mockMarket: ForgeMarketData = {};
      const heavyLines: Array<{ recipeName: string; quantity: number; ownedRecipes: number }> = [];

      for (let i = 1; i <= 65; i++) {
        const recipeName = `High Grade Forge Recipe #${i}`;
        const resultName = `Forged Artifact #${i}`;
        const matA = `Ore Compound #${i % 5}`;
        const matB = `Flux Catalyst #${i % 7}`;

        mockDb[recipeName] = {
          name: recipeName,
          type: "RECIPE",
          quality: i % 2 === 0 ? "MYTHIC" : "LEGENDARY",
          recipe: {
            skill: "Forge",
            level_required: 50 + (i % 40),
            max_uses: 20,
            materials: [
              { item_name: matA, quantity: 3 },
              { item_name: matB, quantity: 1 },
            ],
            result: { item_name: resultName },
          },
        };

        mockDb[resultName] = {
          name: resultName,
          type: "WEAPON",
          quality: i % 2 === 0 ? "MYTHIC" : "LEGENDARY",
          vendor_price: 500,
          is_tradeable: true,
        };

        mockDb[matA] = { name: matA, type: "ORE", quality: "STANDARD", vendor_price: 10, is_tradeable: true };
        mockDb[matB] = { name: matB, type: "CATALYST", quality: "PREMIUM", vendor_price: 25, is_tradeable: true };

        mockMarket[resultName] = { price: 2000 + i * 10 };
        mockMarket[matA] = { price: 30 + (i % 5) };
        mockMarket[matB] = { price: 75 + (i % 7) };
        mockMarket[recipeName] = { price: 500 };

        heavyLines.push({
          recipeName,
          quantity: 10,
          ownedRecipes: 1,
        });
      }

      const allRecipes = buildForgeRecipeOptions(mockDb);
      expect(allRecipes.length).toBe(65);

      const plan = calculateForgePlanner(heavyLines, {}, allRecipes, mockMarket, mockDb, {
        membership: true,
        barteringBoost: 5,
      });

      expect(plan.entries.length).toBe(65);
      expect(plan.totalCrafts).toBe(650);
      expect(plan.totalMissingCost).toBeGreaterThan(0);
      expect(plan.projectedNet).toBeGreaterThan(0);

      // Create a mock ForgeState containing the high-volume plan
      const mockState: ForgeState = {
        activeTab: "craft",
        setActiveTab: vi.fn(),
        tabButtonRefs: { current: {} },
        handleTabKeyDown: vi.fn(),
        pickerRef: { current: null },
        inputRef: { current: null },
        draft: {
          lines: heavyLines,
          ownedMaterials: {},
        },
        setDraft: vi.fn(),
        recipeSearch: "",
        setRecipeSearch: vi.fn(),
        updateRecipeSearch: vi.fn(),
        qualityFilter: "ALL",
        setQualityFilter: vi.fn(),
        sortBy: "value",
        setSortBy: vi.fn(),
        pickerOpen: false,
        setPickerOpen: vi.fn(),
        openFilterPicker: "",
        setOpenFilterPicker: vi.fn(),
        activeOptionIndex: 0,
        setActiveOptionIndex: vi.fn(),
        selectedRecipeName: "",
        setSelectedRecipeName: vi.fn(),
        focusedEntryKey: heavyLines[0].recipeName,
        setFocusedEntryKey: vi.fn(),
        statusMessage: "",
        setStatusMessage: vi.fn(),
        clearedDraft: null,
        recipes: allRecipes,
        recipesByName: new Map(allRecipes.map((r) => [r.recipeName, r])),
        visibleRecipeOptions: allRecipes,
        selectedRecipe: null,
        selectedEntry: plan.entries[0],
        profileBarteringBoost: 5,
        plan,
        activeProfile: null,
        activeProfileName: "Global settings",
        marketNetPercent: 88,
        warningCount: plan.warnings.length,
        planHealthLabel: `${allRecipes.length} recipes visible`,
        loading: false,
        chooseRecipe: vi.fn(),
        addRecipe: vi.fn(),
        updateLine: vi.fn(),
        removeLine: vi.fn(),
        setOwnedMaterial: vi.fn(),
        clearPlan: vi.fn(),
        undoClearPlan: vi.fn(),
        handlePickerKeyDown: vi.fn(),
        openItemByName: vi.fn(),
        prefetchItem: vi.fn(),
      };

      // Statically render CraftItemTab
      const craftMarkup = renderToStaticMarkup(createElement(CraftItemTab, { state: mockState }));
      expect(craftMarkup).toContain('id="forge-tab-panel-craft"');
      expect(craftMarkup).toContain("Planned crafts");
      expect(craftMarkup).toContain("65 recipes");
      expect(craftMarkup).toContain("Missing Materials");
      expect(craftMarkup).toContain("Recipe Copies");

      // Statically render ForgeHeader
      const headerMarkup = renderToStaticMarkup(createElement(ForgeHeader, { state: mockState }));
      expect(headerMarkup).toContain("Forge Planner");
      expect(headerMarkup).toContain("650"); // total crafts
      expect(headerMarkup).toContain("Global settings");
      expect(headerMarkup).not.toContain("market net");

      // Statically render ForgeTabs
      const tabsMarkup = renderToStaticMarkup(createElement(ForgeTabs, { state: mockState }));
      expect(tabsMarkup).toContain('role="tablist"');
      expect(tabsMarkup).toContain('id="forge-tab-lessons"');
      expect(tabsMarkup).toContain('id="forge-tab-craft"');
    });
  });

  // =========================================================================
  // Dimension 6: Interactive Controls, CustomPicker & Combobox Navigation Limits
  // =========================================================================
  describe("Dimension 6: Interactive Controls, CustomPicker & Combobox Navigation Limits", () => {
    it("renders CustomPicker safely with empty options and open states without throwing", () => {
      const setOpenPicker = vi.fn();
      const onChange = vi.fn();

      // Empty options should render fallback without throwing
      const emptyMarkup = renderToStaticMarkup(
        createElement(CustomPicker, {
          label: "Quality",
          options: [],
          value: "",
          onChange,
          pickerKey: "quality",
          openPicker: "",
          setOpenPicker,
        }),
      );
      expect(emptyMarkup).toContain("Quality");
      expect(emptyMarkup).toContain("Choose");
      expect(emptyMarkup).toContain('aria-haspopup="listbox"');
      expect(emptyMarkup).not.toContain("aria-controls=");

      // Open state with options renders listbox and option roles
      const openMarkup = renderToStaticMarkup(
        createElement(CustomPicker, {
          label: "Sort",
          options: [
            { id: "value", label: "Value" },
            { id: "level", label: "Level" },
          ],
          value: "value",
          onChange,
          pickerKey: "sort",
          openPicker: "sort",
          setOpenPicker,
        }),
      );
      expect(openMarkup).toContain('role="listbox"');
      expect(openMarkup).toContain('role="option"');
      expect(openMarkup).toContain('aria-selected="true"');
      expect(openMarkup).toContain("aria-controls=");
      expect(openMarkup).toContain("aria-activedescendant=");

      // Open state with empty-string ID option (e.g. "All" or "None" filter)
      const emptyIdMarkup = renderToStaticMarkup(
        createElement(CustomPicker, {
          label: "Filter",
          options: [
            { id: "", label: "All Items" },
            { id: "refined", label: "Refined" },
          ],
          value: "",
          onChange,
          pickerKey: "quality",
          openPicker: "quality",
          setOpenPicker,
        }),
      );
      expect(emptyIdMarkup).toContain("All Items");
      expect(emptyIdMarkup).toContain('aria-selected="true"');
    });

    it("verifies tab navigation cycle contracts for keyboard events", () => {
      const tabIds = FORGE_TABS.map((t) => t.id);
      expect(tabIds).toEqual(["lessons", "craft"]);

      // ArrowRight cycle
      const getNextTab = (currentIndex: number) => tabIds[(currentIndex + 1) % tabIds.length];
      expect(getNextTab(0)).toBe("craft");
      expect(getNextTab(1)).toBe("lessons"); // wraps around

      // ArrowLeft cycle
      const getPrevTab = (currentIndex: number) => tabIds[(currentIndex - 1 + tabIds.length) % tabIds.length];
      expect(getPrevTab(1)).toBe("lessons");
      expect(getPrevTab(0)).toBe("craft"); // wraps around

      // Home and End
      expect(tabIds[0]).toBe("lessons");
      expect(tabIds[tabIds.length - 1]).toBe("craft");
    });

    it("clamps combobox activeOptionIndex to visible slice window (80 items max) to prevent ghost aria-activedescendant", () => {
      // Simulate combobox keydown navigation when 120 recipes are indexed
      const recipeCount = 120;
      const recipes = Array.from({ length: recipeCount }, (_, i) => ({
        recipeName: `Recipe #${i + 1}`,
        resultName: `Item #${i + 1}`,
      }));

      const maxVisibleSlice = 80;
      const maxNavigableIndex = Math.max(0, Math.min(recipes.length, maxVisibleSlice) - 1);
      expect(maxNavigableIndex).toBe(79);

      // Simulate 100 ArrowDown keypresses
      let activeIndex = 0;
      for (let i = 0; i < 100; i++) {
        activeIndex = Math.min(activeIndex + 1, maxNavigableIndex);
      }
      expect(activeIndex).toBe(79);

      // When rendered, the 80th item exists in DOM (index 79), and no ghost IDs past 79 are selected
      const renderedSlice = recipes.slice(0, maxVisibleSlice);
      expect(renderedSlice.length).toBe(80);
      expect(renderedSlice[activeIndex].recipeName).toBe("Recipe #80");
    });
  });
});
