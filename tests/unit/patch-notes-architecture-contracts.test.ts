import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { assertCleanMigratedRoute } from "./helpers/route-contract-audit";
import {
  ALL_FILTER,
  filterPatchNotes,
  formatPatchDate,
  getPatchTitleText,
  getPatchYear,
  sanitizeDisplayText,
  type PatchNote,
} from "@/app/patch-notes/types";

describe("/patch-notes Architecture Contracts & Helper Invariance", () => {
  const patchDir = path.join(process.cwd(), "src", "app", "patch-notes");

  it("passes strict Zenith clean-route architectural contract", () => {
    assertCleanMigratedRoute({ routeSubpath: "patch-notes", maxPageLines: 150 });
    expect(existsSync(path.join(patchDir, "PatchNotes.module.css"))).toBe(true);
    expect(existsSync(path.join(patchDir, "hooks", "usePatchNotesState.ts"))).toBe(true);
    expect(existsSync(path.join(patchDir, "PatchNotesClient.tsx"))).toBe(false);
    expect(existsSync(path.join(patchDir, "page.module.css"))).toBe(false);
  });

  it("contains modular header, toolbar, and list components plus BackToTop", () => {
    for (const file of [
      "components/PatchNotesHeader.tsx",
      "components/PatchNotesToolbar.tsx",
      "components/PatchNotesList.tsx",
    ]) {
      expect(existsSync(path.join(patchDir, file)), `Missing ${file}`).toBe(true);
    }

    const pageSrc = readFileSync(path.join(patchDir, "page.tsx"), "utf-8");
    expect(pageSrc).toContain("BackToTop");
    expect(pageSrc).toContain("contain: \"layout\"");
    expect(pageSrc).toContain("minHeight: \"520px\"");
  });

  it("enforces >= 44px touch targets and reduced motion rules in PatchNotes.module.css", () => {
    const css = readFileSync(path.join(patchDir, "PatchNotes.module.css"), "utf-8");
    expect(css).toMatch(/\.topicChip\s*\{[^}]*min-height:\s*44px/);
    expect(css).toMatch(/\.noteTrigger\s*\{[^}]*min-height:\s*44px/);
    expect(css).toMatch(/\.officialIconLink\s*\{[^}]*min-height:\s*44px/);
    expect(css).toContain("--border-focus");
    expect(css).toContain("prefers-reduced-motion");
  });

  it("sanitizes residual HTML and filters patch notes accurately", () => {
    expect(sanitizeDisplayText("<p>Forging &amp; Loot</p>")).toBe("Forging & Loot");
    expect(getPatchYear("2026-11-22T16:08:00+00:00")).toBe("2026");
    expect(formatPatchDate("2026-11-22T16:08:00+00:00", null)).toBe("22 Nov 2026");

    const sampleNotes: PatchNote[] = [
      {
        id: 671,
        version: "0.88.0-PB",
        title: "",
        headline: "Version 0.88.0-PB",
        releasedAt: "2026-11-22T16:08:00+00:00",
        releaseDateLabel: "Nov 22, 2026",
        page: 1,
        sourceUrl: "https://support.idle-mmo.com/release-notes/version-0880-pb",
        categories: ["world-bosses", "forge"],
        excerpt: "World Boss alerts and Forging lessons",
        contentBlocks: [],
        sections: [],
        bodyText: "World Boss alerts and Forging lessons",
        searchText: "version 0.88.0-pb world boss alerts and forging lessons",
      },
      {
        id: 616,
        version: "0.85.6",
        title: "Road Map",
        headline: "0.85.6 - Road Map",
        releasedAt: "2025-11-11T16:18:00+00:00",
        releaseDateLabel: "Nov 11, 2025",
        page: 1,
        sourceUrl: "https://support.idle-mmo.com/release-notes/0856-road-map",
        categories: ["guilds", "map"],
        excerpt: "Roadmap preview",
        contentBlocks: [],
        sections: [],
        bodyText: "Roadmap preview",
        searchText: "0.85.6 - road map roadmap preview",
      },
    ];

    expect(getPatchTitleText(sampleNotes[0])).toBe("Patch 0.88.0-PB");
    expect(getPatchTitleText(sampleNotes[1])).toBe("Road Map");
    expect(filterPatchNotes(sampleNotes, { query: "forging", category: ALL_FILTER, year: ALL_FILTER }).length).toBe(1);
    expect(filterPatchNotes(sampleNotes, { query: "", category: "guilds", year: "2025" }).length).toBe(1);
    expect(filterPatchNotes(sampleNotes, { query: "", category: "guilds", year: "2026" }).length).toBe(0);
  });
});
