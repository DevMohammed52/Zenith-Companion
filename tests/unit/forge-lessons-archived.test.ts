import { describe, expect, it } from "vitest";
import rawMaterials from "@/data/normalized-forge-materials.json";
import { calculateLessonMaterialEfficiency } from "@/app/forge/hooks/useForgeLessons";
import { getForgeHourlyRate } from "@/lib/forge-lesson-math";
import type { ForgeLessonMaterial } from "@/app/forge/types";

describe.skip("Archived External Player Forge Lessons Data (CracheLeCash, Mere, Merethyuu)", () => {
  it("verifies live game modal matches for CracheLeCash (Level 73 player, 0% buffs)", () => {
    const testCases = [
      { name: "Broken Dwarven Plate", expectedEff: 100, expectedExp: 141.67, warning: "NONE" },
      { name: "Mahogany Log", expectedEff: 100, expectedExp: 11.22, warning: "NONE" },
      { name: "Wolf Pelt", expectedEff: 94, expectedExp: 30.60, warning: "NONE" },
      { name: "Raccoon Fur", expectedEff: 94, expectedExp: 30.60, warning: "NONE" },
      { name: "Dwarven Whetstone", expectedEff: 91, expectedExp: 13.22, warning: "NONE" },
    ];

    for (const tc of testCases) {
      const mat = rawMaterials.find((m) => m.name === tc.name) as ForgeLessonMaterial;
      expect(mat).toBeDefined();

      const calculated = calculateLessonMaterialEfficiency(mat, 73, 1.0);
      expect(calculated.displayedEff).toBe(tc.expectedEff);
      expect(calculated.effectiveExp).toBeCloseTo(tc.expectedExp, 1);
    }
  });
});
