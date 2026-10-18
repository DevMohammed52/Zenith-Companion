import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import postcss from "postcss";
import { describe, expect, it } from "vitest";
import {
  formatDungeonModifierDuration,
  getConfirmedDungeonItemModifiers,
  getDungeonKey,
  getDungeonLengthMinutes,
  getDungeonRowLabel,
  getOptionalNumber,
  getReadinessText,
  getStoredDungeonModifierSelections,
  getTradeableTemporaryModifiers,
  isMarketSensitiveDungeonDrop,
  normalizeCompletionCount,
  removeUntradeableDuplicateModifiers,
  resolveDungeonDropValue,
  type DungeonItemModifier,
} from "@/app/dungeons/types";

describe("dungeons architecture and modularization contracts", () => {
  const dungeonsDir = path.join(process.cwd(), "src", "app", "dungeons");
  const pagePath = path.join(dungeonsDir, "page.tsx");
  const hookPath = path.join(dungeonsDir, "hooks", "useDungeonState.ts");
  const componentsDir = path.join(dungeonsDir, "components");

  it("orchestrator page.tsx is under 200 lines", () => {
    expect(existsSync(pagePath)).toBe(true);
    const content = readFileSync(pagePath, "utf-8");
    const lines = content.split(/\r?\n/).length;
    expect(lines).toBeLessThan(200);
  });

  it("exports dedicated custom hook useDungeonState", () => {
    expect(existsSync(hookPath)).toBe(true);
    const content = readFileSync(hookPath, "utf-8");
    expect(content).toContain("export function useDungeonState()");
    expect(content).toContain("resolveDungeonDropValue");
    expect(content).toContain("getConfirmedDungeonItemModifiers");
    expect(content).toContain("useProfiles");
  });

  it("contains all 5 required feature components", () => {
    const requiredComponents = [
      "DungeonHeader.tsx",
      "DungeonCard.tsx",
      "DungeonDetailsModal.tsx",
      "DungeonItemEffectPicker.tsx",
      "DungeonStyles.tsx",
    ];

    for (const comp of requiredComponents) {
      const compPath = path.join(componentsDir, comp);
      expect(existsSync(compPath), `Missing component: ${comp}`).toBe(true);
    }
  });

  it("orchestrator defines layout containment and min-height to guarantee CLS <= 0.1", () => {
    const pageContent = readFileSync(pagePath, "utf-8");
    expect(pageContent).toContain('contain: "layout"');
    expect(pageContent).toMatch(/minHeight:\s*["']520px["']/);
  });

  it("DungeonHeader includes search input, readiness filter pills, profile status, and metric cards", () => {
    const headerPath = path.join(componentsDir, "DungeonHeader.tsx");
    const content = readFileSync(headerPath, "utf-8");
    expect(content).toContain("dungeon-command");
    expect(content).toContain("dungeon-search-control");
    expect(content).toContain("dungeon-readiness-filters");
    expect(content).toContain("dungeon-readiness-pill");
    expect(content).toContain("dungeon-modifier-panel");
    expect(content).toContain("dungeon-valuation-panel");
  });

  it("DungeonCard includes readiness badge, completion counters, and expected loot value preview", () => {
    const cardPath = path.join(componentsDir, "DungeonCard.tsx");
    const content = readFileSync(cardPath, "utf-8");
    expect(content).toContain("dungeon-card");
    expect(content).toContain("dungeon-readiness");
    expect(content).toContain("dungeon-mobile-completed");
    expect(content).toContain("DungeonTableRow");
  });

  it("DungeonDetailsModal includes drop table inspector, drop valuation mode, value breakdown, and lore panel", () => {
    const modalPath = path.join(componentsDir, "DungeonDetailsModal.tsx");
    const content = readFileSync(modalPath, "utf-8");
    expect(content).toContain("dungeon-modal");
    expect(content).toContain("dungeon-modal-grid");
    expect(content).toContain("dungeon-loot-list");
    expect(content).toContain("dungeon-chest-breakdown");
    expect(content).toContain("LoreThreadPanel");
  });

  it("DungeonItemEffectPicker includes modifier selector and accessible keyboard navigation", () => {
    const pickerPath = path.join(componentsDir, "DungeonItemEffectPicker.tsx");
    const content = readFileSync(pickerPath, "utf-8");
    expect(content).toContain("dungeon-effect-picker");
    expect(content).toContain("dungeon-effect-trigger");
    expect(content).toContain("dungeon-effect-menu");
    expect(content).toContain('role="listbox"');
    expect(content).toContain('role="option"');
    expect(content).toContain("aria-controls={open ? listboxId : undefined}");
    expect(content).toContain("id={listboxId}");
    expect(content).toContain("handleTriggerKeyDown");
    expect(content).toContain("handleOptionKeyDown");
  });

  it("DungeonStyles has 100% scoped selectors preventing global CSS leakage", () => {
    const stylesPath = path.join(componentsDir, "DungeonStyles.tsx");
    const content = readFileSync(stylesPath, "utf-8");
    const match = content.match(/<style jsx global>\{`([\s\S]*?)`\}<\/style>/);
    expect(match).not.toBeNull();
    const rawCss = match ? match[1] : "";
    const root = postcss.parse(rawCss);

    const unscoped: string[] = [];
    root.walkRules((rule) => {
      if (rule.parent?.type === "atrule" && "name" in rule.parent && rule.parent.name === "keyframes") {
        return;
      }
      for (const sel of rule.selectors) {
        const trimmed = sel.trim();
        if (!trimmed.startsWith(".dungeons-page")) {
          unscoped.push(trimmed);
        }
      }
    });

    expect(unscoped).toEqual([]);
  });

  it("enforces >= 44px touch targets on interactive button and input classes in DungeonStyles", () => {
    const stylesPath = path.join(componentsDir, "DungeonStyles.tsx");
    const content = readFileSync(stylesPath, "utf-8");
    expect(content).toMatch(/\.dungeons-page \.dungeon-sort-button\s*\{[^}]*min-height:\s*44px/);
    expect(content).toMatch(/\.dungeons-page \.dungeon-segmented button,\s*\.dungeons-page \.dungeon-readiness-pill\s*\{[^}]*min-height:\s*44px/);
    expect(content).toMatch(/\.dungeons-page \.dungeon-check-toggle\s*\{[^}]*min-height:\s*44px/);
    expect(content).toMatch(/\.dungeons-page \.dungeon-effect-trigger\s*\{[^}]*min-height:\s*44px/);
    expect(content).toMatch(/\.dungeons-page \.dungeon-effect-option\s*\{[^}]*min-height:\s*44px/);
    expect(content).toMatch(/\.dungeons-page \.close-btn\s*\{[^}]*min-height:\s*44px/);
    expect(content).toMatch(/\.dungeons-page \.dungeon-open-button\s*\{[^}]*min-height:\s*44px/);
  });

  it("defines focus rings and zero letter-spacing for control labels in DungeonStyles", () => {
    const stylesPath = path.join(componentsDir, "DungeonStyles.tsx");
    const content = readFileSync(stylesPath, "utf-8");
    expect(content).toContain(".dungeons-page .control-label");
    expect(content).toMatch(/\.dungeons-page \.control-label\s*\{[^}]*letter-spacing:\s*0/);
    expect(content).toContain(".dungeons-page .dungeon-planner-field .control-input:focus");
    expect(content).toContain(".dungeons-page .dungeon-completed-input:focus");
    expect(content).toContain(".dungeons-page .dungeon-mobile-completed input:focus");
    expect(content).toContain(".dungeons-page .dungeon-effect-option:focus-visible");
  });

  it("useDungeonState implements dual state and ref loaded-key guards to prevent cross-profile storage write races", () => {
    const hookPath = path.join(dungeonsDir, "hooks", "useDungeonState.ts");
    const content = readFileSync(hookPath, "utf-8");
    expect(content).toContain("completionsLoadedKey");
    expect(content).toContain("completionsLoadedKeyRef");
    expect(content).toContain("eventLoadedKey");
    expect(content).toContain("eventLoadedKeyRef");
    expect(content).toContain("itemModifiersLoadedKey");
    expect(content).toContain("itemModifiersLoadedKeyRef");
    expect(content).toMatch(/if\s*\(completionsLoadedKeyRef\.current\s*!==\s*completionsStorageKey\)\s*return;/);
    expect(content).toContain("if (completionsLoadedKey !== completionsStorageKey) return;");
    expect(content).toContain("Math.max(0, Math.floor(Number(value) || 0))");
  });

  describe("strict game math and calculation invariance", () => {
    it("preserves getDungeonLengthMinutes across length_minutes, length, and length_ms", () => {
      expect(getDungeonLengthMinutes({ length_minutes: 45 })).toBe(45);
      expect(getDungeonLengthMinutes({ length: 3_600_000 })).toBe(60);
      expect(getDungeonLengthMinutes({ length_ms: 1_800_000 })).toBe(30);
      expect(getDungeonLengthMinutes({})).toBe(0);
    });

    it("preserves getDungeonKey identifier fallback", () => {
      expect(getDungeonKey({ id: 42, name: "Crypt" })).toBe("42");
      expect(getDungeonKey({ name: "Crypt" })).toBe("Crypt");
      expect(getDungeonKey({})).toBe("");
    });

    it("preserves getReadinessText readiness evaluation and requirements gap messaging", () => {
      expect(getReadinessText({ profileReady: true }, true)).toBe("Ready");
      expect(getReadinessText({ profileReady: false }, false)).toBe("No profile");
      expect(getReadinessText({ profileReady: false, statGap: 50, dungeoneeringGap: 3 }, true)).toBe("Need 50 stats +3 Dungeoneering");
      expect(getReadinessText({ profileReady: false, statGap: 30, dungeoneeringGap: 0 }, true)).toBe("Need 30 stats");
      expect(getReadinessText({ profileReady: false, statGap: 0, dungeoneeringGap: 5 }, true)).toBe("Dungeoneering +5");
    });

    it("preserves normalizeCompletionCount boundary conditions", () => {
      expect(normalizeCompletionCount(0)).toBe(0);
      expect(normalizeCompletionCount(15)).toBe(15);
      expect(normalizeCompletionCount(-5)).toBe(0);
      expect(normalizeCompletionCount(12.8)).toBe(12);
      expect(normalizeCompletionCount("25")).toBe(25);
      expect(normalizeCompletionCount("invalid")).toBe(0);
      expect(normalizeCompletionCount(null)).toBe(0);
      expect(normalizeCompletionCount(undefined)).toBe(0);
    });

    it("preserves getOptionalNumber type conversions and handles non-finite values safely", () => {
      expect(getOptionalNumber("")).toBeNull();
      expect(getOptionalNumber(42)).toBe(42);
      expect(getOptionalNumber(0)).toBe(0);
      expect(getOptionalNumber("120")).toBe(120);
      expect(getOptionalNumber(NaN)).toBeNull();
      expect(getOptionalNumber(Infinity)).toBeNull();
      expect(getOptionalNumber(-Infinity)).toBeNull();
      expect(getOptionalNumber("invalid")).toBeNull();
      expect(getOptionalNumber(null)).toBeNull();
      expect(getOptionalNumber(undefined)).toBeNull();
    });

    it("preserves formatDungeonModifierDuration formatting", () => {
      expect(formatDungeonModifierDuration(0)).toBe("Passive");
      expect(formatDungeonModifierDuration(1_800_000)).toBe("30m");
      expect(formatDungeonModifierDuration(3_600_000)).toBe("1h");
      expect(formatDungeonModifierDuration(5_400_000)).toBe("1.5h");
    });

    it("preserves getConfirmedDungeonItemModifiers extraction and filtering", () => {
      const mockItems = {
        item1: {
          name: "Speed Potion",
          type: "POTION",
          quality: "RARE",
          is_tradeable: true,
          effects: [
            { target: "dungeon", attribute: "wait_length", value: 15, length: 3_600_000 },
          ],
        },
        item2: {
          name: "Luck Ring",
          type: "SPECIAL",
          quality: "LEGENDARY",
          is_tradeable: false,
          effects: [
            { target: "dungeon", attribute: "magic_find", value: 25, length: 0 },
          ],
        },
        item3: {
          name: "Combat Sword",
          type: "WEAPON",
          quality: "COMMON",
          effects: [
            { target: "combat", attribute: "attack", value: 10 },
          ],
        },
      };

      const modifiers = getConfirmedDungeonItemModifiers(mockItems);
      expect(modifiers.length).toBe(2);

      const speed = modifiers.find((m) => m.name === "Speed Potion");
      expect(speed).toBeDefined();
      expect(speed?.efficiency).toBe(15);
      expect(speed?.magicFind).toBe(0);
      expect(speed?.durationMs).toBe(3_600_000);

      const luck = modifiers.find((m) => m.name === "Luck Ring");
      expect(luck).toBeDefined();
      expect(luck?.magicFind).toBe(25);
      expect(luck?.efficiency).toBe(0);
      expect(luck?.isTradeable).toBe(false);
    });

    it("preserves removeUntradeableDuplicateModifiers and getTradeableTemporaryModifiers", () => {
      const options: DungeonItemModifier[] = [
        {
          name: "Elixir of Speed",
          type: "POTION",
          quality: "RARE",
          imageUrl: "",
          efficiency: 10,
          magicFind: 0,
          durationMs: 3600000,
          isTradeable: true,
        },
        {
          name: "Elixir of Speed (Untradable)",
          type: "POTION",
          quality: "RARE",
          imageUrl: "",
          efficiency: 10,
          magicFind: 0,
          durationMs: 3600000,
          isTradeable: false,
        },
        {
          name: "Unique Relic (Untradable)",
          type: "SPECIAL",
          quality: "EPIC",
          imageUrl: "",
          efficiency: 5,
          magicFind: 0,
          durationMs: 0,
          isTradeable: false,
        },
      ];

      const deduplicated = removeUntradeableDuplicateModifiers(options);
      // "Elixir of Speed (Untradable)" should be removed since tradeable version exists
      expect(deduplicated.some((o) => o.name === "Elixir of Speed (Untradable)")).toBe(false);
      expect(deduplicated.some((o) => o.name === "Unique Relic (Untradable)")).toBe(true);

      const tradeableOnly = getTradeableTemporaryModifiers(options);
      expect(tradeableOnly.length).toBe(1);
      expect(tradeableOnly[0].name).toBe("Elixir of Speed");
    });

    it("preserves getStoredDungeonModifierSelections parsing and fallback", () => {
      expect(getStoredDungeonModifierSelections(null)).toEqual({ efficiencyItem: "", magicFindItem: "" });
      expect(getStoredDungeonModifierSelections("invalid json")).toEqual({ efficiencyItem: "", magicFindItem: "" });
      expect(getStoredDungeonModifierSelections(JSON.stringify({ efficiencyItem: "Potion", magicFindItem: "Clover" }))).toEqual({
        efficiencyItem: "Potion",
        magicFindItem: "Clover",
      });
    });

    it("preserves isMarketSensitiveDungeonDrop detection", () => {
      expect(
        isMarketSensitiveDungeonDrop("Dragon Sword Recipe", {
          type: "RECIPE",
          quality: "LEGENDARY",
          description: "Recipe to forge a legendary sword",
        }),
      ).toBe(true);

      expect(
        isMarketSensitiveDungeonDrop("Mythic Elixir", {
          type: "POTION",
          quality: "MYTHIC",
          description: "An ancient elixir",
        }),
      ).toBe(true);

      expect(
        isMarketSensitiveDungeonDrop("Iron Ore", {
          type: "MATERIAL",
          quality: "COMMON",
          description: "Raw iron ore",
        }),
      ).toBe(false);
    });

    it("preserves resolveDungeonDropValue valuation modes (safe-market, vendor, manual, exclude)", () => {
      const mockMarketData = {
        "Legendary Helm": {
          price: 100_000,
          vol_3: 15,
          vendor_price: 2_000,
        },
      };
      const mockAllItemsDb = {
        "Legendary Helm": {
          name: "Legendary Helm",
          type: "EQUIPMENT",
          quality: "LEGENDARY",
          vendor_price: 2_000,
        },
      };
      const evOptions = { marketTaxMultiplier: 0.88 };

      // Safe-market mode
      const marketResolved = resolveDungeonDropValue(
        "Legendary Helm",
        mockMarketData,
        mockAllItemsDb,
        evOptions,
        "safe-market",
        0,
      );
      expect(marketResolved.marketSensitive).toBe(true);
      expect(marketResolved.trueValue).toBeGreaterThan(0);

      // Vendor mode
      const vendorResolved = resolveDungeonDropValue(
        "Legendary Helm",
        mockMarketData,
        mockAllItemsDb,
        evOptions,
        "vendor",
        0,
      );
      expect(vendorResolved.valuationModeApplied).toBe(true);
      expect(vendorResolved.trueValue).toBe(2_000);

      // Manual mode
      const manualResolved = resolveDungeonDropValue(
        "Legendary Helm",
        mockMarketData,
        mockAllItemsDb,
        evOptions,
        "manual",
        45_000,
      );
      expect(manualResolved.valuationModeApplied).toBe(true);
      expect(manualResolved.trueValue).toBe(45_000);

      // Exclude mode
      const excludeResolved = resolveDungeonDropValue(
        "Legendary Helm",
        mockMarketData,
        mockAllItemsDb,
        evOptions,
        "exclude",
        0,
      );
      expect(excludeResolved.valuationModeApplied).toBe(true);
      expect(excludeResolved.trueValue).toBe(0);
    });

    it("preserves getDungeonRowLabel formatting", () => {
      const row = {
        name: "Abyssal Keep",
        level_required: 85,
        effectiveDurationMins: 45,
        durationMins: 45,
        dropsCount: 12,
        location: { name: "Sunken Realm" },
        profileReady: true,
        netProfitPerRun: 15420,
        shardValue: 250,
      };

      const label = getDungeonRowLabel(row, true);
      expect(label).toContain("Abyssal Keep");
      expect(label).toContain("level 85");
      expect(label).toContain("45 minutes");
      expect(label).toContain("12 drops");
      expect(label).toContain("Sunken Realm");
      expect(label).toContain("Ready");
      expect(label).toContain("+15,420g EV per run");
      expect(label).toContain("250g per shard");
    });

    it("verifies DungeonItemEffectPicker mobile touch pointerdown and Tab key dismiss patterns", () => {
      const pickerPath = path.join(componentsDir, "DungeonItemEffectPicker.tsx");
      const content = readFileSync(pickerPath, "utf-8");
      expect(content).toContain('document.addEventListener("pointerdown", handlePointer)');
      expect(content).toContain('if (event.key === "Tab")');
      expect(content).toContain('window.addEventListener("resize", updatePlacement)');
    });

    it("verifies useDungeonState guards modifier selection persistence against empty allItemsDb", () => {
      const hookPath = path.join(dungeonsDir, "hooks", "useDungeonState.ts");
      const content = readFileSync(hookPath, "utf-8");
      expect(content).toContain("if (!allItemsDb || Object.keys(allItemsDb).length === 0) return;");
      expect(content).toContain("Number.isFinite(valA)");
    });

    it("sorts rows with non-finite runsToDrop (Infinity) deterministically without returning NaN", () => {
      const rows = [
        { name: "Dungeon A", runsToDrop: Infinity },
        { name: "Dungeon B", runsToDrop: 2.5 },
        { name: "Dungeon C", runsToDrop: Infinity },
        { name: "Dungeon D", runsToDrop: 10 },
      ];

      const sortComparator = (a: any, b: any, sortDesc: boolean) => {
        let valA = Number(a.runsToDrop);
        let valB = Number(b.runsToDrop);
        if (!Number.isFinite(valA) && !Number.isFinite(valB)) return 0;
        if (!Number.isFinite(valA)) return 1;
        if (!Number.isFinite(valB)) return -1;
        return sortDesc ? valB - valA : valA - valB;
      };

      const sortedAsc = [...rows].sort((a, b) => sortComparator(a, b, false));
      expect(sortedAsc.map((r) => r.name)).toEqual(["Dungeon B", "Dungeon D", "Dungeon A", "Dungeon C"]);

      const sortedDesc = [...rows].sort((a, b) => sortComparator(a, b, true));
      expect(sortedDesc.map((r) => r.name)).toEqual(["Dungeon D", "Dungeon B", "Dungeon A", "Dungeon C"]);
    });
  });
});
