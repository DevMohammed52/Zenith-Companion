import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { assertCleanMigratedRoute } from "./helpers/route-contract-audit";
import {
  formatSectionLabel,
  formatSectionList,
  formatSourceMode,
  formatValue,
  missingStatCount,
  petKey,
} from "@/app/pets/owned/utils/owned-pet-helpers";

describe("pets/owned architecture and helper invariance contracts", () => {
  const ownedDir = path.join(process.cwd(), "src", "app", "pets", "owned");
  const componentsDir = path.join(ownedDir, "components");

  it("enforces clean migrated route architecture (no style jsx, no StateBlock, no direct lucide-react)", () => {
    assertCleanMigratedRoute({
      routeSubpath: "pets/owned",
      maxPageLines: 180,
      allowStateBlock: false,
      allowDirectLucide: false,
    });
  });

  it("removes dead toast and duplicate bespoke components in favor of shared primitives", () => {
    expect(existsSync(path.join(componentsDir, "OwnedPetToast.tsx"))).toBe(false);
    expect(existsSync(path.join(componentsDir, "OwnedPetImage.tsx"))).toBe(false);
    expect(existsSync(path.join(componentsDir, "OwnedPetSummary.tsx"))).toBe(false);
    expect(existsSync(path.join(componentsDir, "OwnedPetImportReadiness.tsx"))).toBe(false);
    expect(existsSync(path.join(process.cwd(), "src", "components", "pets", "PetImage.tsx"))).toBe(true);
  });

  it("preserves owned pet key, formatting, and missing stat helpers", () => {
    expect(petKey({ species: "Orthrus", level: 100, evolution: 2 })).toBe("orthrus::100::2");
    expect(formatValue("")).toBe("-");
    expect(formatValue(1250)).toBe("1,250");
    expect(formatSourceMode("imported")).toBe("Imported");
    expect(formatSourceMode("mixed")).toBe("Mixed");
    expect(formatSourceMode("manual")).toBe("Manual");
    expect(formatSectionLabel("pets_private")).toBe("Pets private");
    expect(formatSectionList(["pets_private", "museum_private"])).toBe("Pets private, Museum private");

    expect(
      missingStatCount({
        agility: 100,
        accuracy: "",
        protection: 80,
        attackPower: 95,
        movementSpeed: 24.5,
        maxHealth: 1800,
        maxStamina: 300,
        criticalDamage: 42,
        criticalChance: "",
      }),
    ).toBe(2);
  });
});
