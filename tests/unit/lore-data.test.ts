import { describe, expect, it } from "vitest";
import {
  getAllLoreForItem,
  getCachedLoreDataset,
  getLoreEntry,
  getLoreForItem,
  loadLoreData,
} from "../../src/data/lore";
import { getLoreHintsForNames } from "../../src/lib/lore-links";

describe("lore-data loading and queries", () => {
  it("loads public/data/lore.json and caches it in memory", async () => {
    const data = await loadLoreData();
    expect(data).toBeDefined();
    expect(data.entries.length).toBeGreaterThan(80);
    expect(data.relations.length).toBeGreaterThan(150);
    expect(data.theories.length).toBeGreaterThan(10);
    expect(data.timeline.length).toBeGreaterThan(10);
    expect(data.itemLinks.length).toBeGreaterThan(20);

    const cached = getCachedLoreDataset();
    expect(cached).toBe(data);
  });

  it("retrieves entries and item links correctly", async () => {
    const data = await loadLoreData();
    const entry = getLoreEntry("artifacts-the-runemark-of-eternity", data);
    expect(entry).toBeDefined();
    expect(entry?.title).toBe("The Runemark of Eternity");

    const fallbackEntry = getLoreEntry("artifacts-the-runemark-of-eternity");
    expect(fallbackEntry).toBeDefined();
    expect(fallbackEntry?.title).toBe("The Runemark of Eternity");

    const missingEntry = getLoreEntry("non-existent-entry-id");
    expect(missingEntry).toBeUndefined();

    const itemLinks = getLoreForItem("Siren's Scales", data);
    expect(itemLinks.length).toBeGreaterThan(0);
    expect(itemLinks[0].entryIds).toContain("bestiary-sirens");

    const allLore = getAllLoreForItem("Runemark of Eternity", data);
    expect(allLore.length).toBeGreaterThan(0);
    expect(allLore.some((l) => l.entryIds.includes("artifacts-the-runemark-of-eternity"))).toBe(true);
  });

  it("generates lore hints for names with dataset or cached dataset", async () => {
    const data = await loadLoreData();
    const hints = getLoreHintsForNames(
      [
        { name: "Solaris Isle", source: "location" },
        { name: "Siren's Scales", source: "drop" },
      ],
      5,
      data,
    );

    expect(hints.length).toBeGreaterThan(0);
    expect(hints.some((h) => h.entry.id === "world-solaris-isle" || h.entry.id === "bestiary-sirens")).toBe(true);

    const fallbackHints = getLoreHintsForNames([
      { name: "Solaris Isle", source: "location" },
    ]);
    expect(fallbackHints.length).toBeGreaterThan(0);
    expect(fallbackHints[0].entry.id).toBe("world-solaris-isle");
  });

  it("handles empty or invalid inputs gracefully", () => {
    expect(getLoreForItem("")).toEqual([]);
    expect(getLoreHintsForNames([])).toEqual([]);
    expect(getLoreHintsForNames(["", "   "])).toEqual([]);
  });
});
