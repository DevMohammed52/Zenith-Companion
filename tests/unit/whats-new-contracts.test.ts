import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { parseChangelog, type ParsedChangelog } from "../../src/lib/changelog-parser";

describe("What's New / Changelog Parser Contract", () => {
  const sampleMarkdown = `# Changelog
All notable changes to Zenith Companion will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]
### Added
- **[2026-11-24 18:00] In-App What's New Page**: Built \`src/app/whats-new/page.tsx\` with timeline view.
  - Sub-task A: Integrated search filter.
  - Sub-task B: Added unread badge marker.

## [0.86.2] - 2026-11-24
### Added
- **Interactive UI Primitives Suite**: Full collection of accessible components.
- **Gathering Location Routing**: Clicking gathering locations navigates to \`/map\`.

### Fixed
- **Combobox Dropdown Clipping**: Resolved stacking context issue in \`Combobox.module.css\`.

## [0.86.1] - 2026-11-23
### Changed
- **Navigation Sidebar Refresh**: Streamlined desktop sidebar groups.
`;

  it("correctly parses sample changelog into structured releases and sections", () => {
    const result = parseChangelog(sampleMarkdown);

    expect(result.title).toBe("Changelog");
    expect(result.description).toContain("All notable changes to Zenith Companion");

    // Unreleased release
    expect(result.unreleased).toBeDefined();
    expect(result.unreleased?.version).toBe("Unreleased");
    expect(result.unreleased?.isUnreleased).toBe(true);
    expect(result.unreleased?.sections.length).toBe(1);
    expect(result.unreleased?.sections[0].category).toBe("Added");

    const unreleasedItem = result.unreleased?.sections[0].items[0];
    expect(unreleasedItem?.title).toBe("In-App What's New Page");
    expect(unreleasedItem?.timestamp).toBe("2026-11-24 18:00");
    expect(unreleasedItem?.files).toContain("src/app/whats-new/page.tsx");
    expect(unreleasedItem?.subItems).toEqual([
      "Sub-task A: Integrated search filter.",
      "Sub-task B: Added unread badge marker.",
    ]);

    // Numbered releases
    expect(result.releases.length).toBe(2);

    const rel1 = result.releases[0];
    expect(rel1.version).toBe("0.86.2");
    expect(rel1.date).toBe("2026-11-24");
    expect(rel1.isUnreleased).toBe(false);
    expect(rel1.totalChanges).toBe(3); // 2 added, 1 fixed

    const rel2 = result.releases[1];
    expect(rel2.version).toBe("0.86.1");
    expect(rel2.date).toBe("2026-11-23");
    expect(rel2.totalChanges).toBe(1);

    // Metadata
    expect(result.meta.totalReleases).toBe(2);
    expect(result.meta.latestVersion).toBe("0.86.2");
    expect(result.meta.latestDate).toBe("2026-11-24");
    expect(result.meta.categories).toContain("Added");
    expect(result.meta.categories).toContain("Fixed");
    expect(result.meta.categories).toContain("Changed");
  });

  it("handles empty or boundary markdown safely without crashing", () => {
    const emptyResult = parseChangelog("");
    expect(emptyResult.releases).toEqual([]);
    expect(emptyResult.unreleased).toBeUndefined();
    expect(emptyResult.meta.totalReleases).toBe(0);

    const malformedResult = parseChangelog("Just some random text\nwith no headers\n- an orphan bullet");
    expect(malformedResult.releases).toEqual([]);
    expect(malformedResult.meta.totalReleases).toBe(0);
  });

  it("validates the real repository CHANGELOG.md against the contract", () => {
    const changelogPath = path.join(process.cwd(), "CHANGELOG.md");
    expect(existsSync(changelogPath)).toBe(true);

    const raw = readFileSync(changelogPath, "utf8");
    const parsed = parseChangelog(raw);

    expect(parsed.releases.length).toBeGreaterThan(0);
    expect(parsed.meta.latestVersion).toMatch(/^(?:\d{4}-\d{2}-\d{2}|\d+\.\d+\.\d+)$/);
    expect(parsed.meta.latestDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    // Ensure all items across all releases have non-empty titles
    for (const release of parsed.releases) {
      expect(release.version.length).toBeGreaterThan(0);
      for (const section of release.sections) {
        for (const item of section.items) {
          expect(item.title.trim().length).toBeGreaterThan(0);
        }
      }
    }
  });

  it("validates that public/zenith-changelog.json exists and is parseable", () => {
    const jsonPath = path.join(process.cwd(), "public", "zenith-changelog.json");
    expect(existsSync(jsonPath)).toBe(true);

    const rawJson = readFileSync(jsonPath, "utf8");
    const parsedJson: ParsedChangelog = JSON.parse(rawJson);

    expect(parsedJson.releases.length).toBeGreaterThan(0);
    expect(parsedJson.meta.latestVersion).toBeDefined();
    expect(parsedJson.meta.totalReleases).toBe(parsedJson.releases.length);
  });
});
