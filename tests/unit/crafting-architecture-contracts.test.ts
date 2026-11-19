import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import {
    formatPriceSource,
    formatSaleSource,
} from "../../src/app/crafting/types";
import {
    calculateCraftingQueuePlan,
    isCraftingQueueRecipe,
} from "../../src/lib/crafting-queue";

describe("Crafting Architecture & Helper Contracts", () => {
    describe("formatSaleSource", () => {
        it("maps custom, market, vendor, and fallback correctly", () => {
            expect(formatSaleSource("custom")).toBe("CUSTOM");
            expect(formatSaleSource("market")).toBe("MARKET");
            expect(formatSaleSource("vendor")).toBe("VENDOR");
            expect(formatSaleSource("none" as any)).toBe("NO SALE");
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

    describe("Crafting Queue Logic Invariance", () => {
        it("correctly identifies crafting queue recipes", () => {
            expect(isCraftingQueueRecipe("Battle Potion")).toBe(true);
            expect(isCraftingQueueRecipe("NonExistentPotion999")).toBe(false);
        });

        it("handles empty queue plan calculation gracefully", () => {
            const plan = calculateCraftingQueuePlan({}, null, null, {
                membership: true,
                barteringBoost: 0,
                customPrices: {},
            });
            expect(plan.totalCrafts).toBe(0);
            expect(plan.entries).toEqual([]);
            expect(plan.totalCost).toBe(0);
            expect(plan.totalRevenue).toBe(0);
            expect(plan.totalProfit).toBe(0);
            expect(plan.missingItems).toEqual([]);
            expect(plan.shoppingList).toEqual([]);
            expect(plan.vialList).toEqual([]);
            expect(plan.recipeList).toEqual([]);
        });

        it("calculates recipe plan for Battle Potion with mock prices", () => {
            const queue = { "Battle Potion": 2 };
            const marketData = {
                "Battle Potion": { price: 100, updated_at: "2026-01-01" },
                "Lucky Rabbit Foot": { price: 10, updated_at: "2026-01-01" },
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

            expect(plan.totalCrafts).toBe(2);
            expect(plan.entries.length).toBe(1);
            expect(plan.entries[0].name).toBe("Battle Potion");
            expect(plan.entries[0].quantity).toBe(2);
            expect(plan.totalRevenue).toBeGreaterThan(0);
        });
    });

    describe("Modular File Architecture", () => {
        it("page.tsx is a lean orchestrator with under 150 lines", () => {
            const pagePath = join(process.cwd(), "src/app/crafting/page.tsx");
            expect(existsSync(pagePath)).toBe(true);
            const content = readFileSync(pagePath, "utf-8");
            const lines = content.split("\n");
            expect(lines.length).toBeLessThan(150);
        });

        it("all decomposed subcomponents and hooks exist", () => {
            const expectedFiles = [
                "src/app/crafting/types.ts",
                "src/app/crafting/hooks/useCraftingPageState.ts",
                "src/app/crafting/components/CraftingStyles.tsx",
                "src/app/crafting/components/CraftItemImage.tsx",
                "src/app/crafting/components/NeedPanel.tsx",
                "src/app/crafting/components/CraftingHero.tsx",
                "src/app/crafting/components/CraftingSummaryCards.tsx",
                "src/app/crafting/components/CraftingRecipePicker.tsx",
                "src/app/crafting/components/CraftingQueueList.tsx",
                "src/app/crafting/components/CraftingFinanceSummary.tsx",
            ];

            for (const file of expectedFiles) {
                const filePath = join(process.cwd(), file);
                expect(existsSync(filePath)).toBe(true);
            }
        });
    });
});
