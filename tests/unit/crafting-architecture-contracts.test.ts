import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  formatPriceSource,
  formatSaleSource,
} from "../../src/app/crafting/types";
import {
  calculateCartTotals,
  formatShoppingListText,
} from "../../src/app/crafting/utils/cart-math";
import {
  MAX_BASIC_ALCHEMY_LEVEL,
  calculateCraftingQueuePlan,
  isCraftingQueueRecipe,
} from "../../src/lib/crafting-queue";
import { ALCHEMY_ITEMS } from "../../src/constants";
import { assertCleanMigratedRoute } from "./helpers/route-contract-audit";

describe("Crafting Architecture & Cart Contracts", () => {
  describe("formatSaleSource", () => {
    it("maps custom, market, vendor, and fallback correctly", () => {
      expect(formatSaleSource("custom")).toBe("CUSTOM");
      expect(formatSaleSource("market")).toBe("MARKET");
      expect(formatSaleSource("vendor")).toBe("VENDOR");
      expect(formatSaleSource("none" as never)).toBe("NO SALE");
    });
  });

  describe("formatPriceSource", () => {
    it("maps source identifiers correctly", () => {
      expect(formatPriceSource("custom")).toBe("custom");
      expect(formatPriceSource("vendor")).toBe("vendor");
      expect(formatPriceSource("market")).toBe("market");
      expect(formatPriceSource("unknown")).toBe("missing");
      expect(formatPriceSource("")).toBe("missing");
    });
  });

  describe("Crafting Cart Math & Invariance", () => {
    it("stays strictly scoped to repeatable Lv 1-89 Alchemy recipes", () => {
      expect(MAX_BASIC_ALCHEMY_LEVEL).toBe(89);
      expect(isCraftingQueueRecipe("Battle Potion")).toBe(true);
      expect(isCraftingQueueRecipe("NonExistentPotion999")).toBe(false);
      for (const [name, recipe] of Object.entries(ALCHEMY_ITEMS)) {
        if (isCraftingQueueRecipe(name)) {
          expect(recipe.level).toBeLessThanOrEqual(89);
        }
      }
    });

    it("does not fall back to NPC sell vendor_price as an acquisition buy price", () => {
      const queue = { "Battle Potion": 4 };
      const marketData = {
        "Battle Potion": { price: 150, updated_at: "2026-01-01" },
      };
      const allItemsDb = {
        "Battle Potion": { name: "Battle Potion", vendor_price: 20 },
        "Lucky Rabbit Foot": { name: "Lucky Rabbit Foot", vendor_price: 5 },
      };

      const plan = calculateCraftingQueuePlan(queue, marketData, allItemsDb, {
        membership: true,
        barteringBoost: 0,
        customPrices: {},
      });

      expect(plan.missingItems).toContain("Lucky Rabbit Foot");
      const matNeed = plan.shoppingList.find((row) => row.name === "Lucky Rabbit Foot");
      expect(matNeed?.source).toBe("missing");
      expect(matNeed?.unitPrice).toBe(0);
    });

    it("calculates cart totals, bank savings, and clipboard text cleanly", () => {
      const plan = calculateCraftingQueuePlan(
        { "Battle Potion": 10 },
        {
          "Battle Potion": { price: 120 },
          "Lucky Rabbit Foot": { price: 20 },
        },
        null,
        { membership: true, barteringBoost: 0, customPrices: {} },
      );

      const totals = calculateCartTotals(plan, { "Cheap Vial": true });
      expect(totals.ownedSavingsGold).toBe(50);
      expect(totals.remainingGoldNeeded).toBe(plan.totalCost - 50);
      expect(totals.checkedCount).toBe(1);

      const text = formatShoppingListText(plan, { "Cheap Vial": true });
      expect(text).not.toContain("Cheap Vial");
      expect(text).toContain("Lucky Rabbit Foot");
    });
  });

  describe("Clean Migrated Route Standards", () => {
    it("passes shared clean-route audit (< 150 lines, scoped CSS module, no <style jsx>, no StateBlock, no direct lucide)", () => {
      assertCleanMigratedRoute({ routeSubpath: "crafting", maxPageLines: 150 });
    });

    it("renders BackToTop and avoids middot separators and Ctrl K hints", () => {
      const craftingFiles = [
        "src/app/crafting/page.tsx",
        "src/app/crafting/components/CraftingCartBar.tsx",
        "src/app/crafting/components/CraftingCartView.tsx",
      ];
      const pageSrc = readFileSync(path.join(process.cwd(), "src/app/crafting/page.tsx"), "utf8");
      expect(pageSrc).toContain("BackToTop");

      for (const rel of craftingFiles) {
        const src = readFileSync(path.join(process.cwd(), rel), "utf8");
        expect(src, `${rel} must not contain middot separators`).not.toContain("·");
        expect(src, `${rel} must not enable inline Ctrl K search hint`).not.toContain("showShortcutHint={true}");
      }
    });
  });
});
