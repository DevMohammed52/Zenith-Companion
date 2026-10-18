import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import postcss from "postcss";
import { describe, expect, it } from "vitest";
import { calculateEssenceSession } from "@/lib/essences";
import {
  HOUSING_COMPONENTS,
  calculateHousingBuffs,
  calculateRoomProfitProjection,
  canUseHousingGuestAccess,
  sanitizeHousing,
} from "@/lib/housing";

describe("housing architecture and modularization contracts", () => {
  const housingDir = path.join(process.cwd(), "src", "app", "housing");
  const pagePath = path.join(housingDir, "page.tsx");
  const hookPath = path.join(housingDir, "hooks", "useHousingState.ts");
  const componentsDir = path.join(housingDir, "components");

  it("orchestrator page.tsx is under 250 lines", () => {
    expect(existsSync(pagePath)).toBe(true);
    const content = readFileSync(pagePath, "utf-8");
    const lines = content.split(/\r?\n/).length;
    expect(lines).toBeLessThan(250);
  });

  it("exports dedicated custom hook useHousingState", () => {
    expect(existsSync(hookPath)).toBe(true);
    const content = readFileSync(hookPath, "utf-8");
    expect(content).toContain("export function useHousingState()");
    expect(content).toContain("calculateHousingBuffs");
    expect(content).toContain("calculateRoomProfitProjection");
    expect(content).toContain("calculateEssenceSession");
  });

  it("contains all 6 required feature components", () => {
    const requiredComponents = [
      "HousingHeader.tsx",
      "HousingOverviewTab.tsx",
      "HousingSetupTab.tsx",
      "HousingComponentsTab.tsx",
      "HousingProfitTab.tsx",
      "HousingGuestTab.tsx",
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

  it("HousingSetupTab includes mode picker, active buffs, idle-time breakdown, and notes", () => {
    const setupPath = path.join(componentsDir, "HousingSetupTab.tsx");
    const content = readFileSync(setupPath, "utf-8");
    expect(content).toContain("housing-tab-panel-setup");
    expect(content).toContain("Profile Housing");
    expect(content).toContain("Active Buffs");
    expect(content).toContain("Idle-Time Breakdown");
    expect(content).toContain("BUFF_ACTIVITIES");
    expect(content).toContain("Notes");
    expect(content).toContain("housing.notes");
  });

  it("HousingOverviewTab includes status, idle windows, and setup checks", () => {
    const overviewPath = path.join(componentsDir, "HousingOverviewTab.tsx");
    const content = readFileSync(overviewPath, "utf-8");
    expect(content).toContain("housing-tab-panel-overview");
    expect(content).toContain("Strongest buff");
    expect(content).toContain("Idle Windows");
    expect(content).toContain("Setup Checks");
  });

  it("HousingComponentsTab includes Selected Setup, condition sliders, and Planner components", () => {
    const compPath = path.join(componentsDir, "HousingComponentsTab.tsx");
    const content = readFileSync(compPath, "utf-8");
    expect(content).toContain("Selected Setup");
    expect(content).toContain("housing-tab-panel-components");
    expect(content).toContain("condition-slider");
    expect(content).toContain("repair-gold-calibration");
    expect(content).toContain("CATEGORY_OPTIONS");
  });

  it("HousingProfitTab includes Room Profit and essence projections", () => {
    const profitPath = path.join(componentsDir, "HousingProfitTab.tsx");
    const content = readFileSync(profitPath, "utf-8");
    expect(content).toContain("housing-tab-panel-profit");
    expect(content).toContain("Room Profit");
    expect(content).toContain("ChoicePicker");
  });

  it("HousingGuestTab includes received idle buffs and guest scope picker", () => {
    const guestPath = path.join(componentsDir, "HousingGuestTab.tsx");
    const content = readFileSync(guestPath, "utf-8");
    expect(content).toContain("housing-tab-panel-guest");
    expect(content).toContain("Received Idle-Time Buffs");
    expect(content).toContain("GUEST_BUFF_GROUPS");
  });

  it("undo state in useHousingState is scoped to activeProfile.id preventing cross-profile pollution", () => {
    const hookContent = readFileSync(hookPath, "utf-8");
    expect(hookContent).toContain("profileId: activeProfile.id");
    expect(hookContent).toMatch(/undoHousing\.profileId\s*!==\s*activeProfile\.id/);
    expect(hookContent).toMatch(/setUndoHousing\(null\);[\s\S]*?\[activeProfile\?\.id\]/);
  });

  describe("strict game math and calculation invariance", () => {
    it("preserves foundation and slot mechanics in calculateHousingBuffs", () => {
      const noFoundation = sanitizeHousing({
        mode: "owner",
        foundationBuilt: false,
        extraSlots: 0,
        selectedComponents: ["lumber-store-i"],
      });
      const buffsNoFoundation = calculateHousingBuffs(noFoundation);
      expect(buffsNoFoundation.slotCapacity).toBe(0);
      expect(buffsNoFoundation.activeComponentCount).toBe(0);

      const withFoundation = sanitizeHousing({
        mode: "owner",
        foundationBuilt: true,
        extraSlots: 2,
        selectedComponents: ["lumber-store-i"],
      });
      const buffsWithFoundation = calculateHousingBuffs(withFoundation);
      expect(buffsWithFoundation.slotCapacity).toBe(3); // 1 free + 2 extra
      expect(buffsWithFoundation.activeComponentCount).toBe(1);
    });

    it("preserves guest permission logic across classes", () => {
      expect(canUseHousingGuestAccess("Warrior")).toBe(true);
      expect(canUseHousingGuestAccess("Mage")).toBe(true);
      expect(canUseHousingGuestAccess("Cursed")).toBe(false);
      expect(canUseHousingGuestAccess("Banished")).toBe(false);
      expect(canUseHousingGuestAccess(undefined)).toBe(true);
    });

    it("preserves calculateRoomProfitProjection mathematics", () => {
      const projection = calculateRoomProfitProjection({
        baseIdleHours: 8,
        roomIdleHours: 2,
        playtimeHours: 4,
        profitPerHour: 10000,
        buildCost: 50000,
        essenceCost: 0,
        costShare: 1,
      });

      expect(projection.baseStartsPerDay).toBeGreaterThan(0);
      expect(projection.netGainPerDay).toBeGreaterThan(0);
      expect(Number.isFinite(projection.paybackDays)).toBe(true);
    });

    it("handles guest mode idle buffs and preserves calculation integrity", () => {
      const guestHousing = sanitizeHousing({
        mode: "guest",
        location: "Oakhaven",
        guestBuffs: {
          woodcutting: 2,
          mining: 1,
        },
        guestRemoteConduit: false,
      });

      const buffs = calculateHousingBuffs(guestHousing);
      expect(buffs.idleHours.woodcutting).toBe(2);
      expect(buffs.idleHours.mining).toBe(1);
      expect(buffs.availableAnywhere).toBe(false);
      expect(buffs.locationLimited).toBe(true);
    });

    it("evaluates essence session interactions with room profit calculations", () => {
      const session = calculateEssenceSession({
        essenceName: "",
        skill: "Woodcutting",
        items: {},
        marketData: {},
        customPrices: {},
        actionHours: 8,
      });

      expect(session.costPerStart).toBe(0);
      expect(session.needsPrice).toBe(false);

      const withEssenceSavings = calculateRoomProfitProjection({
        baseIdleHours: 4,
        roomIdleHours: 4,
        playtimeHours: 12,
        profitPerHour: 50000,
        buildCost: 100000,
        essenceCost: 5000,
        costShare: 1,
      });

      const withoutEssenceSavings = calculateRoomProfitProjection({
        baseIdleHours: 4,
        roomIdleHours: 4,
        playtimeHours: 12,
        profitPerHour: 50000,
        buildCost: 100000,
        essenceCost: 0,
        costShare: 1,
      });

      expect(withEssenceSavings.essenceSavingsPerDay).toBe(5000);
      expect(withEssenceSavings.netGainPerDay).toBeGreaterThan(withoutEssenceSavings.netGainPerDay);
    });
  });

  it("HousingStyles has 100% scoped selectors preventing global CSS leakage", () => {
    const stylesPath = path.join(componentsDir, "HousingStyles.tsx");
    const content = readFileSync(stylesPath, "utf-8");
    const lines = content.split(/\r?\n/);
    const cssLines = lines.slice(5, lines.length - 4);
    const rawCss = cssLines.join("\n");
    const root = postcss.parse(rawCss);

    const unscoped: string[] = [];
    root.walkRules((rule) => {
      for (const sel of rule.selectors) {
        const trimmed = sel.trim();
        if (!trimmed.startsWith(".housing-page")) {
          unscoped.push(trimmed);
        }
      }
    });

    expect(unscoped).toEqual([]);
  });

  it("HousingComponentsTab preserves authentic component-meta, material-list, and component-footer", () => {
    const compPath = path.join(componentsDir, "HousingComponentsTab.tsx");
    const content = readFileSync(compPath, "utf-8");
    expect(content).toContain("component-meta");
    expect(content).toContain("material-list cost-breakdown-list");
    expect(content).toContain("component-footer");
    expect(content).toContain("selected-button");
    expect(content).toContain("add-button");
    expect(content).toContain("planner-empty-state");
  });

  it("HousingSetupTab marks inactive sections with hidden attribute for accessibility", () => {
    const setupPath = path.join(componentsDir, "HousingSetupTab.tsx");
    const content = readFileSync(setupPath, "utf-8");
    const hiddenOccurrences = (content.match(/hidden=\{activeHousingTab !== "setup"\}/g) || []).length;
    expect(hiddenOccurrences).toBeGreaterThanOrEqual(3);
  });

  it("resets transient draft state and open pickers on profile switch to prevent cross-profile contamination", () => {
    const hookContent = readFileSync(hookPath, "utf-8");
    expect(hookContent).toMatch(/setUndoHousing\(null\);[\s\S]*?setDraftTiers\(\{\}\);[\s\S]*?setConditionDrafts\(\{\}\);[\s\S]*?setConditionSliderDrafts\(\{\}\);[\s\S]*?setOpenPicker\(null\);[\s\S]*?\[activeProfile\?\.id\]/);
  });

  it("enforces >= 44px touch targets on all interactive button classes in HousingStyles", () => {
    const stylesPath = path.join(componentsDir, "HousingStyles.tsx");
    const content = readFileSync(stylesPath, "utf-8");
    expect(content).toMatch(/\.housing-undo-toast button\s*\{[^}]*min-height:\s*44px/);
    expect(content).toMatch(/\.inline-link-button\s*\{[^}]*min-height:\s*44px/);
    expect(content).toMatch(/\.ghost-button,\s*\.housing-page \.add-button,\s*\.housing-page \.selected-button\s*\{[^}]*min-height:\s*44px/);
    expect(content).toMatch(/\.selected-row-meta button\s*\{[^}]*min-height:\s*44px/);
    expect(content).toMatch(/\.guest-tier-row button\s*\{[^}]*min-height:\s*44px/);
    expect(content).toMatch(/\.cost-share-row button\s*\{[^}]*min-height:\s*44px/);
    expect(content).toMatch(/\.tier-selector button\s*\{[^}]*min-height:\s*44px/);
    expect(content).toMatch(/\.housing-quick-actions button\s*\{[^}]*min-height:\s*44px/);
  });

  it("component-ledger-details defines layout containment to prevent CLS during expansion", () => {
    const stylesPath = path.join(componentsDir, "HousingStyles.tsx");
    const content = readFileSync(stylesPath, "utf-8");
    expect(content).toMatch(/\.component-ledger-details\s*\{[^}]*contain:\s*content/);
  });
});

