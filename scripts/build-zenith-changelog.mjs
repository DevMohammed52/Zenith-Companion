import fs from "fs";
import path from "path";

const CHANGELOG_PATH = path.join(process.cwd(), "CHANGELOG.md");
const OUTPUT_PATH = path.join(process.cwd(), "public", "zenith-changelog.json");

const CATEGORY_NAMES = new Set([
  "Added",
  "Changed",
  "Deprecated",
  "Removed",
  "Fixed",
  "Security",
]);

export function parseChangelogText(markdown) {
  const lines = markdown.split(/\r?\n/);
  let title = "Changelog";
  const descLines = [];
  const releases = [];
  let currentRelease = null;
  let currentSection = null;
  let currentItem = null;
  let inHeader = true;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (inHeader && trimmed.startsWith("# ")) {
      title = trimmed.slice(2).trim();
      continue;
    }

    const releaseMatch = trimmed.match(/^##\s+\[([^\]]+)\](?:\s*-\s*(\d{4}-\d{2}-\d{2}))?/i);
    if (releaseMatch) {
      inHeader = false;
      const rawVersion = releaseMatch[1].trim();
      let rawDate = releaseMatch[2]?.trim() || null;
      if (!rawDate && /^\d{4}-\d{2}-\d{2}$/.test(rawVersion)) {
        rawDate = rawVersion;
      }
      const isUnreleased = rawVersion.toLowerCase() === "unreleased";

      currentRelease = {
        version: isUnreleased ? "Unreleased" : rawVersion.replace(/^v/, ""),
        date: rawDate,
        rawHeading: trimmed,
        isUnreleased,
        sections: [],
        totalChanges: 0,
      };
      releases.push(currentRelease);
      currentSection = null;
      currentItem = null;
      continue;
    }

    if (inHeader) {
      if (trimmed.length > 0 && !trimmed.startsWith("#")) {
        descLines.push(trimmed);
      }
      continue;
    }

    if (!currentRelease) continue;

    const sectionMatch = trimmed.match(/^###\s+([A-Za-z]+)/);
    if (sectionMatch) {
      const catCandidate = sectionMatch[1];
      if (CATEGORY_NAMES.has(catCandidate)) {
        currentSection = {
          category: catCandidate,
          items: [],
        };
        currentRelease.sections.push(currentSection);
        currentItem = null;
        continue;
      }
    }

    if (!currentSection && (trimmed.startsWith(">") || (trimmed.startsWith("_") && trimmed.endsWith("_")))) {
      const cleanNotice = trimmed.replace(/^[>_]+|[>_]+$/g, "").trim();
      currentRelease.notice = currentRelease.notice
        ? `${currentRelease.notice} ${cleanNotice}`
        : cleanNotice;
      continue;
    }

    const isMainItem = /^(\s{0,2})[-*]\s+(.+)/.test(line);
    const isSubItem = /^(\s{2,})[-*]\s+(.+)/.test(line) || /^(\s{2,})\d+\.\s+(.+)/.test(line);

    if (isSubItem && currentItem) {
      const subMatch = line.match(/^\s*(?:[-*]|\d+\.)\s+(.+)/);
      if (subMatch) {
        currentItem.subItems.push(subMatch[1].trim());
      }
      continue;
    }

    if (isMainItem && currentSection) {
      const rawContent = trimmed.replace(/^[-*]\s+/, "").trim();
      let itemTitle = rawContent;
      let timestamp;
      let files;
      let scope;

      const tsMatch = rawContent.match(/\[(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2})\]/);
      if (tsMatch) {
        timestamp = tsMatch[1];
      }

      const boldMatch = rawContent.match(/\*\*([^*]+)\*\*:?/);
      let description = rawContent;
      if (boldMatch) {
        itemTitle = boldMatch[1].replace(/\[\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}\]\s*/, "").trim();
        description = rawContent.slice(boldMatch[0].length).trim();
      }

      const scopeMatch = itemTitle.match(/^([A-Za-z0-9_\-\s/]+):\s*(.+)/);
      if (scopeMatch && scopeMatch[1].length < 30) {
        scope = scopeMatch[1].trim();
        itemTitle = scopeMatch[2].trim();
      }

      const fileMatches = rawContent.matchAll(/`([^`]+\.[a-z]{1,4})`/gi);
      const extractedFiles = Array.from(fileMatches, (m) => m[1]);
      if (extractedFiles.length > 0) {
        files = extractedFiles;
      }

      currentItem = {
        id: `${currentRelease.version}-${currentSection.category}-${currentSection.items.length}`,
        scope,
        title: itemTitle,
        timestamp,
        files,
        description,
        subItems: [],
        raw: line,
      };

      currentSection.items.push(currentItem);
      currentRelease.totalChanges++;
      continue;
    }
  }

  let unreleased;
  const releasedList = [];

  for (const rel of releases) {
    if (rel.isUnreleased) {
      unreleased = rel;
    } else {
      releasedList.push(rel);
    }
  }

  const latest = releasedList[0];
  const allCategories = Array.from(
    new Set(
      releases.flatMap((r) => r.sections.map((s) => s.category))
    )
  );

  return {
    title,
    description: descLines.join(" "),
    releases: releasedList,
    unreleased,
    meta: {
      totalReleases: releasedList.length,
      latestVersion: latest?.version ?? "0.1.0",
      latestDate: latest?.date ?? new Date().toISOString().slice(0, 10),
      categories: allCategories,
      generatedAt: new Date().toISOString(),
    },
  };
}

function main() {
  if (!fs.existsSync(CHANGELOG_PATH)) {
    console.error(`Error: CHANGELOG.md not found at ${CHANGELOG_PATH}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(CHANGELOG_PATH, "utf-8");
  const parsed = parseChangelogText(raw);

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(parsed, null, 2), "utf-8");
  console.log(`[zenith-changelog] Parsed ${parsed.meta.totalReleases} releases from CHANGELOG.md -> ${OUTPUT_PATH}`);
}

main();
