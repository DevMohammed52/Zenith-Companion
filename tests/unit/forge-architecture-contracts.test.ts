import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import postcss from "postcss";
import { describe, expect, it } from "vitest";
import {
  FORGE_TABS,
  QUALITY_OPTIONS,
  SORT_OPTIONS,
  getRecipeDisplayValue,
  type ForgeQuality,
  type ForgeRecipeOption,
} from "@/app/forge/types";
import { useForgeState } from "@/app/forge/hooks/useForgeState";
import { ForgeHeader } from "@/app/forge/components/ForgeHeader";
import { ForgeTabs } from "@/app/forge/components/ForgeTabs";
import { ForgeLessonsTab } from "@/app/forge/components/ForgeLessonsTab";
import { ForgeStyles } from "@/app/forge/components/ForgeStyles";
import { CraftItemTab } from "@/app/forge/components/craft/CraftItemTab";
import {
  CustomPicker,
  Metric,
  NumberField,
  Stat,
} from "@/app/forge/components/craft/ForgeControls";
import { ForgeRecipeBuilder } from "@/app/forge/components/craft/ForgeRecipeBuilder";
import { ForgePlanSection } from "@/app/forge/components/craft/ForgePlanSection";
import {
  ForgeShoppingSection,
  NeedTable,
  RecipeNeedTable,
} from "@/app/forge/components/craft/ForgeShoppingSection";

describe("Gate 1: Forge Architecture & Modularization Contracts", () => {
  const rootDir = process.cwd();
  const forgeDir = path.join(rootDir, "src", "app", "forge");
  const pagePath = path.join(forgeDir, "page.tsx");
  const typesPath = path.join(forgeDir, "types.ts");
  const hookPath = path.join(forgeDir, "hooks", "useForgeState.ts");
  const componentsDir = path.join(forgeDir, "components");
  const craftComponentsDir = path.join(componentsDir, "craft");
  const lessonComponentsDir = path.join(componentsDir, "lessons");

  it("orchestrator page.tsx is strictly under 200 lines and acts as a clean coordinator", () => {
    expect(existsSync(pagePath)).toBe(true);
    const content = readFileSync(pagePath, "utf-8");
    const lines = content.split(/\r?\n/).length;
    expect(lines).toBeLessThan(200);
    expect(lines).toBeLessThanOrEqual(45);
  });

  it("types.ts defines top-level tabs with Lessons as default active tab", () => {
    expect(existsSync(typesPath)).toBe(true);
    expect(Array.isArray(FORGE_TABS)).toBe(true);
    expect(FORGE_TABS).toHaveLength(2);
    expect(FORGE_TABS[0].id).toBe("lessons");
    expect(FORGE_TABS[0].label).toBe("Lessons");
    expect(FORGE_TABS[1].id).toBe("craft");
    expect(FORGE_TABS[1].label).toBe("Craft Item");
  });

  it("types.ts exports quality options, sort options, and recipe display value calculator", () => {
    expect(QUALITY_OPTIONS).toContain("ALL");
    expect(QUALITY_OPTIONS).toContain("MYTHIC");
    expect(QUALITY_OPTIONS).toContain("LEGENDARY");
    expect(QUALITY_OPTIONS).toContain("EPIC");
    expect(QUALITY_OPTIONS).toContain("PREMIUM");
    expect(QUALITY_OPTIONS).toContain("REFINED");

    expect(SORT_OPTIONS.map((opt) => opt.id)).toEqual(["value", "level", "name", "materials"]);

    const mockRecipe: ForgeRecipeOption = {
      recipeName: "Mythic Broadsword Recipe",
      resultName: "Mythic Broadsword",
      quality: "MYTHIC" as ForgeQuality,
      levelRequired: 85,
      materials: [{ name: "Mythic Ore", quantity: 5, imageUrl: "", quality: "MYTHIC", sourceSummary: "" }],
      maxUses: 10,
      imageUrl: "",
      resultImageUrl: "",
      resultType: "WEAPON",
      isTradeable: true,
      description: "",
      searchText: "mythic broadsword",
      sourceSummary: "High-tier dungeon drop",
    };
    const displayVal = getRecipeDisplayValue(mockRecipe);
    expect(typeof displayVal).toBe("number");
    expect(displayVal).toBeGreaterThan(0);
  });

  it("exports custom hook useForgeState and contains core calculation bindings", () => {
    expect(existsSync(hookPath)).toBe(true);
    expect(typeof useForgeState).toBe("function");

    const content = readFileSync(hookPath, "utf-8");
    expect(content).toContain("buildForgeRecipeOptions");
    expect(content).toContain("calculateForgePlanner");
    expect(content).toContain("sanitizeForgeQuantity");
    expect(content).toContain("sanitizeForgePlannerLines");
    expect(content).toContain("sanitizeForgeOwnedMaterials");
    expect(content).toContain("FORGE_PLANNER_STORAGE_KEY");
  });

  it("contains all required feature components in components/, components/craft/, and components/lessons/", () => {
    const rootComponents = [
      "ForgeHeader.tsx",
      "ForgeTabs.tsx",
      "ForgeLessonsTab.tsx",
      "ForgeStyles.tsx",
    ];
    for (const comp of rootComponents) {
      expect(existsSync(path.join(componentsDir, comp)), `Missing component: ${comp}`).toBe(true);
    }

    const craftComponents = [
      "CraftItemTab.tsx",
      "ForgeControls.tsx",
      "ForgeRecipeBuilder.tsx",
      "ForgePlanSection.tsx",
      "ForgeShoppingSection.tsx",
    ];
    for (const comp of craftComponents) {
      expect(existsSync(path.join(craftComponentsDir, comp)), `Missing craft component: ${comp}`).toBe(true);
    }

    const lessonComponents = [
      "LessonHeaderControls.tsx",
      "LessonTargetGoalCard.tsx",
      "LessonQueueReview.tsx",
      "MaterialCatalogPicker.tsx",
      "InventoryOptimizer.tsx",
    ];
    for (const comp of lessonComponents) {
      expect(existsSync(path.join(lessonComponentsDir, comp)), `Missing lesson component: ${comp}`).toBe(true);
    }
  });

  it("exports valid React component functions across all modular units", () => {
    expect(typeof ForgeHeader).toBe("function");
    expect(typeof ForgeTabs).toBe("function");
    expect(typeof ForgeLessonsTab).toBe("function");
    expect(typeof ForgeStyles).toBe("function");
    expect(typeof CraftItemTab).toBe("function");
    expect(typeof Metric).toBe("function");
    expect(typeof Stat).toBe("function");
    expect(typeof NumberField).toBe("function");
    expect(typeof CustomPicker).toBe("function");
    expect(typeof ForgeRecipeBuilder).toBe("function");
    expect(typeof ForgePlanSection).toBe("function");
    expect(typeof NeedTable).toBe("function");
    expect(typeof RecipeNeedTable).toBe("function");
    expect(typeof ForgeShoppingSection).toBe("function");
  });

  it("orchestrator page enforces layout containment and minimum viewport height for Zero CLS", () => {
    const content = readFileSync(pagePath, "utf-8");
    expect(content).toContain('contain: "layout"');
    expect(content).toMatch(/minHeight:\s*["']480px["']/);
  });

  it("zero sliders contract: ensures no <input type='range'> exists in any forge component", () => {
    const allFiles = [
      pagePath,
      typesPath,
      hookPath,
      path.join(componentsDir, "ForgeHeader.tsx"),
      path.join(componentsDir, "ForgeTabs.tsx"),
      path.join(componentsDir, "ForgeLessonsTab.tsx"),
      path.join(componentsDir, "ForgeStyles.tsx"),
      path.join(craftComponentsDir, "CraftItemTab.tsx"),
      path.join(craftComponentsDir, "ForgeControls.tsx"),
      path.join(craftComponentsDir, "ForgeRecipeBuilder.tsx"),
      path.join(craftComponentsDir, "ForgePlanSection.tsx"),
      path.join(craftComponentsDir, "ForgeShoppingSection.tsx"),
      path.join(lessonComponentsDir, "LessonHeaderControls.tsx"),
      path.join(lessonComponentsDir, "LessonTargetGoalCard.tsx"),
      path.join(lessonComponentsDir, "LessonQueueReview.tsx"),
      path.join(lessonComponentsDir, "MaterialCatalogPicker.tsx"),
      path.join(lessonComponentsDir, "InventoryOptimizer.tsx"),
    ];

    for (const file of allFiles) {
      const code = readFileSync(file, "utf-8");
      expect(code).not.toContain('type="range"');
      expect(code).not.toContain("type='range'");
    }
  });

  it("accessible tab semantics: tablist and tabpanel contracts are enforced", () => {
    const tabsContent = readFileSync(path.join(componentsDir, "ForgeTabs.tsx"), "utf-8");
    expect(tabsContent).toContain('role="tablist"');
    expect(tabsContent).toContain('role="tab"');
    expect(tabsContent).toContain("aria-selected");
    expect(tabsContent).toContain("aria-controls");

    const lessonsContent = readFileSync(path.join(componentsDir, "ForgeLessonsTab.tsx"), "utf-8");
    expect(lessonsContent).toContain('role="tabpanel"');
    expect(lessonsContent).toContain('id="forge-tab-panel-lessons"');
    expect(lessonsContent).toContain('aria-labelledby="forge-tab-lessons"');

    const craftContent = readFileSync(path.join(craftComponentsDir, "CraftItemTab.tsx"), "utf-8");
    expect(craftContent).toContain('role="tabpanel"');
    expect(craftContent).toContain('id="forge-tab-panel-craft"');
    expect(craftContent).toContain('aria-labelledby="forge-tab-craft"');
  });

  it("mobile touch ergonomics: tab buttons enforce >= 44px min-height", () => {
    const stylesContent = readFileSync(path.join(componentsDir, "ForgeStyles.tsx"), "utf-8");
    expect(stylesContent).toMatch(/\.forge-page\s+\.forge-tabs\s+button\s*\{[^}]*min-height:\s*44px/);
  });

  it("validates ForgeStyles CSS completeness for all interactive UI controls via PostCSS", () => {
    const stylesContent = readFileSync(path.join(componentsDir, "ForgeStyles.tsx"), "utf-8");
    const openQuote = stylesContent.indexOf("{\`");
    const closeQuote = stylesContent.lastIndexOf("\`}");
    expect(openQuote).toBeGreaterThan(-1);
    expect(closeQuote).toBeGreaterThan(openQuote);
    const css = stylesContent.slice(openQuote + 2, closeQuote);

    expect(() => postcss.parse(css)).not.toThrow();

    // Verify critical interactive control selectors are fully styled
    expect(css).toContain(".forge-page .craft-item-tab");
    expect(css).toContain(".forge-page .forge-lessons-tab");
    expect(css).toContain(".forge-page .filter-picker");
    expect(css).toContain(".forge-page .filter-picker-button");
    expect(css).toContain(".forge-page .filter-picker-menu");
    expect(css).toContain(".forge-page .forge-context-chips");
    expect(css).toContain(".forge-page .plan-summary-pills");
    expect(css).toContain(".forge-page .selected-recipe-card");
    expect(css).toContain(".forge-page .selected-recipe-title");
    expect(css).toContain(".forge-page .forge-undo-toast");
    expect(css).toContain(".forge-page .plan-shell.no-side");
    expect(css).toContain("@media (max-width: 620px)");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
  });

  it("verifies ForgeStyles adheres to design tokens with zero raw hex color literals", () => {
    const stylesPath = path.join(componentsDir, "ForgeStyles.tsx");
    const content = readFileSync(stylesPath, "utf-8");
    expect(content).toContain("var(--border-subtle)");
    expect(content).toContain("var(--text-muted)");
    expect(content).toContain("var(--text-accent)");
    expect(content).toContain("var(--quality-refined)");
    expect(content).toContain("var(--bg-panel)");
    expect(content).toContain("var(--bg-card)");

    // Raw hex colors check: should not contain any hex color literals
    expect(content).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });

  it("statically renders ForgeLessonsTab with accessible structure and zero crashes", () => {
    const markup = renderToStaticMarkup(createElement(ForgeLessonsTab));
    expect(markup).toContain('id="forge-tab-panel-lessons"');
    expect(markup).toContain('role="tabpanel"');
    expect(markup).toContain("Forge Skill");
    expect(markup).toContain("Offline Session Target");
    expect(markup).toContain("Level Target Estimator");
    expect(markup).toContain("Material Catalog");
    expect(markup).toContain("Inventory Optimizer");
    expect(markup).toContain("Show EXP per item");
  });

  it("verifies sticky forge-tabs has a higher z-index than lesson-header-controls preventing occlusion on scroll", () => {
    const stylesPath = path.join(componentsDir, "ForgeStyles.tsx");
    const content = readFileSync(stylesPath, "utf-8");
    const tabsMatch = content.match(/\.forge-page\s+\.forge-tabs\s*\{[^}]*z-index:\s*(\d+)/);
    const headerMatch = content.match(/\.forge-page\s+\.lesson-header-controls\s*\{[^}]*z-index:\s*(\d+)/);
    expect(tabsMatch).not.toBeNull();
    expect(headerMatch).not.toBeNull();
    const tabsZ = Number(tabsMatch![1]);
    const headerZ = Number(headerMatch![1]);
    expect(tabsZ).toBeGreaterThan(headerZ);
  });
});
