import { describe, expect, it } from "vitest";
import {
  buildSections,
  hasRawHtmlTags,
  inferCategories,
  makeExcerpt,
  mergeNotes,
  parseBodyBlocks,
  parseHeadline,
  sanitizePatchNote,
  sanitizePayload,
} from "../../scripts/fetch-idlemmo-patch-notes.mjs";

describe("patch notes scraper parser & sanitization", () => {
  it("strips raw HTML tags and extracts headings and bullet items from HTML-wrapped markdown", () => {
    const rawHtml = `<p>We're introducing World Boss push notifications.</p>
<p><strong>More</strong></p>
<p>* Forging lessons temper bonus now give twice as many shards.</p>
<p>* Fixed a bug with queued dungeons.</p>`;

    const blocks = parseBodyBlocks(rawHtml);
    expect(blocks).toEqual([
      { type: "paragraph", text: "We're introducing World Boss push notifications." },
      { type: "heading", text: "More" },
      { type: "listItem", text: "Forging lessons temper bonus now give twice as many shards." },
      { type: "listItem", text: "Fixed a bug with queued dungeons." },
    ]);

    for (const block of blocks) {
      expect(hasRawHtmlTags(block.text)).toBe(false);
    }

    const sections = buildSections(blocks);
    expect(sections.length).toBe(2);
    expect(sections[0].heading).toBe("Overview");
    expect(sections[1].heading).toBe("More");
    expect(sections[1].blocks.length).toBe(2);
  });

  it("parses pure markdown lines cleanly into structured blocks", () => {
    const md = `# Localisation\nAdded support for Turkish.\n- Loan fees decreased.\n* Queue bug fixed.`;
    const blocks = parseBodyBlocks(md);
    expect(blocks).toEqual([
      { type: "heading", text: "Localisation" },
      { type: "paragraph", text: "Added support for Turkish." },
      { type: "listItem", text: "Loan fees decreased." },
      { type: "listItem", text: "Queue bug fixed." },
    ]);
  });

  it("infers forge, world-bosses, dungeons, and bug-fixes accurately", () => {
    const categories = inferCategories("World Boss notifications. Forging lessons temper bonus. Fixed queued dungeon bug.");
    expect(categories).toContain("world-bosses");
    expect(categories).toContain("forge");
    expect(categories).toContain("dungeons");
    expect(categories).toContain("bug-fixes");
  });

  it("merges patch notes by numeric ID without overwriting entries sharing version strings", () => {
    const existing = [
      { id: 10, version: "Hotfix", releasedAt: "2026-10-01T10:00:00Z" },
      { id: 11, version: "0.87.0-PB", releasedAt: "2026-11-16T10:00:00Z" },
    ];
    const incoming = [
      { id: 12, version: "Hotfix", releasedAt: "2026-11-20T10:00:00Z" },
      { id: 11, version: "0.87.0-PB", releasedAt: "2026-11-16T10:00:00Z", updated: true },
    ];

    const merged = mergeNotes(existing, incoming);
    expect(merged.length).toBe(3);
    expect(merged.map((n) => n.id)).toEqual([12, 11, 10]);
  });

  it("sanitizes legacy HTML-polluted note payloads cleanly", () => {
    const dirtyNote = {
      id: 671,
      version: "0.88.0-PB",
      title: "",
      headline: "Version 0.88.0-PB",
      releasedAt: "2026-11-22T16:08:00+00:00",
      sourceUrl: "https://support.idle-mmo.com/release-notes/version-0880-pb",
      excerpt: "<p>Hello world</p>",
      contentBlocks: [
        {
          type: "paragraph",
          text: "<p>Introducing alerts.</p><p><strong>More</strong></p><p>* Forging lessons fixed.</p>",
        },
      ],
    };

    const clean = sanitizePatchNote(dirtyNote);
    expect(hasRawHtmlTags(clean.excerpt)).toBe(false);
    expect(hasRawHtmlTags(clean.bodyText)).toBe(false);
    expect(clean.categories).toContain("forge");
    expect(clean.categories).toContain("bug-fixes");
    expect(clean.sections.some((s: { heading: string }) => s.heading === "More")).toBe(true);

    const payload = sanitizePayload({ patchNotes: [dirtyNote], meta: {} });
    expect(payload.meta.totalFetched).toBe(1);
    expect(payload.meta.categoryCounts.forge).toBe(1);
  });

  it("parses versioned and unversioned headlines cleanly and trims word-safe excerpts", () => {
    expect(parseHeadline("Version 0.88.0-PB")).toEqual({ version: "0.88.0-PB", title: "" });
    expect(parseHeadline("0.85.6 - Road Map")).toEqual({ version: "0.85.6", title: "Road Map" });
    expect(makeExcerpt("word ".repeat(60)).endsWith("...")).toBe(true);
  });
});
