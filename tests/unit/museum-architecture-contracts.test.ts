import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { assertCleanMigratedRoute } from "./helpers/route-contract-audit";
import {
  filterMuseumItems,
  museumCategoryLabel,
  sortMuseumItems,
  summarizeMuseum,
  type MuseumItem,
} from "../../src/lib/museum";
import { museumEmptyState, museumStatusLabel } from "../../src/app/museum/utils/museum-helpers";

const SAMPLE_ITEMS: MuseumItem[] = [
  { category: "COLLECTIBLES", id: "abc123", name: "Green Scroll", quantity: 12, imageUrl: "" },
  { category: "COLLECTIBLES", id: "def456", name: "Ancient Coin", quantity: 4, imageUrl: "" },
  { category: "PETS", id: 24, name: "Fluffy", quantity: 1, imageUrl: "" },
  { category: "BESTIARY", id: 46, name: "Basilisk", quantity: 1, imageUrl: "" },
];

describe("Museum Architecture & Filtering Contracts", () => {
  it("enforces clean migrated route architecture (no StateBlock, no direct lucide-react)", () => {
    assertCleanMigratedRoute({
      routeSubpath: "museum",
      maxPageLines: 150,
      allowStateBlock: false,
      allowDirectLucide: false,
    });
  });

  it("all decomposed subcomponents and hooks exist", () => {
    const expectedFiles = [
      "src/app/museum/types.ts",
      "src/app/museum/hooks/useMuseumState.ts",
      "src/app/museum/utils/museum-helpers.ts",
      "src/app/museum/components/MuseumHero.tsx",
      "src/app/museum/components/MuseumControls.tsx",
      "src/app/museum/components/MuseumImportStatus.tsx",
      "src/app/museum/components/MuseumGrid.tsx",
      "src/app/museum/components/MuseumItemCard.tsx",
      "src/app/museum/components/MuseumLoadingOrEmpty.tsx",
    ];
    for (const file of expectedFiles) {
      expect(existsSync(join(process.cwd(), file))).toBe(true);
    }
    const pageContent = readFileSync(join(process.cwd(), "src/app/museum/page.tsx"), "utf-8");
    expect(pageContent.split("\n").length).toBeLessThan(150);
  });

  it("summarizes, filters, and sorts museum collections accurately", () => {
    const summary = summarizeMuseum(SAMPLE_ITEMS);
    expect(summary.find((s) => s.category === "COLLECTIBLES")).toEqual({
      category: "COLLECTIBLES",
      label: "Collectibles",
      itemCount: 2,
      totalQuantity: 16,
    });

    expect(filterMuseumItems({ items: SAMPLE_ITEMS, category: "PETS", query: "" })).toHaveLength(1);
    expect(filterMuseumItems({ items: SAMPLE_ITEMS, category: "ALL", query: "scroll" })).toHaveLength(1);

    const byQtyDesc = sortMuseumItems(SAMPLE_ITEMS, "quantity", "desc");
    expect(byQtyDesc[0].name).toBe("Green Scroll");
    expect(museumCategoryLabel("BESTIARY")).toBe("Bestiary");
  });

  it("maps empty state titles and status labels safely", () => {
    expect(museumEmptyState("private").icon).toBe("locked");
    expect(museumEmptyState("unavailable").variant).toBe("error");
    expect(museumEmptyState(undefined).title).toBe("No museum snapshot yet");
    expect(museumStatusLabel("partial")).toBe("Partial import");
  });
});
