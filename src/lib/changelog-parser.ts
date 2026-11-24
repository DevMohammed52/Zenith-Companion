export type ChangelogCategory =
  | "Added"
  | "Changed"
  | "Deprecated"
  | "Removed"
  | "Fixed"
  | "Security";

export interface ChangelogItem {
  id: string;
  scope?: string;
  title: string;
  timestamp?: string;
  files?: string[];
  description: string;
  subItems: string[];
  raw: string;
}

export interface ChangelogSection {
  category: ChangelogCategory;
  items: ChangelogItem[];
}

export interface ChangelogRelease {
  version: string;
  date: string | null;
  rawHeading: string;
  isUnreleased: boolean;
  notice?: string;
  sections: ChangelogSection[];
  totalChanges: number;
}

export interface ParsedChangelog {
  title: string;
  description: string;
  releases: ChangelogRelease[];
  unreleased?: ChangelogRelease;
  meta: {
    totalReleases: number;
    latestVersion: string;
    latestDate: string;
    categories: ChangelogCategory[];
  };
}

const CATEGORY_NAMES = new Set<ChangelogCategory>([
  "Added",
  "Changed",
  "Deprecated",
  "Removed",
  "Fixed",
  "Security",
]);

export function parseChangelog(markdown: string): ParsedChangelog {
  const lines = markdown.split(/\r?\n/);
  let title = "Changelog";
  const descLines: string[] = [];
  const releases: ChangelogRelease[] = [];
  let currentRelease: ChangelogRelease | null = null;
  let currentSection: ChangelogSection | null = null;
  let currentItem: ChangelogItem | null = null;
  let inHeader = true;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // 1. Top Title
    if (inHeader && trimmed.startsWith("# ")) {
      title = trimmed.slice(2).trim();
      continue;
    }

    // 2. Release Heading: ## [version] - date
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

    // Capture header description before first release
    if (inHeader) {
      if (trimmed.length > 0 && !trimmed.startsWith("#")) {
        descLines.push(trimmed);
      }
      continue;
    }

    if (!currentRelease) continue;

    // 3. Category Heading: ### Added / Changed / Fixed etc.
    const sectionMatch = trimmed.match(/^###\s+([A-Za-z]+)/);
    if (sectionMatch) {
      const catCandidate = sectionMatch[1] as ChangelogCategory;
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

    // 4. Notice banner block (e.g. `_notice_` or `> notice`)
    if (!currentSection && (trimmed.startsWith(">") || (trimmed.startsWith("_") && trimmed.endsWith("_")))) {
      const cleanNotice = trimmed.replace(/^[>_]+|[>_]+$/g, "").trim();
      currentRelease.notice = currentRelease.notice
        ? `${currentRelease.notice} ${cleanNotice}`
        : cleanNotice;
      continue;
    }

    // 5. Main Item: starts with "- " at root indent (0 or up to 2 leading spaces)
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
      let timestamp: string | undefined;
      let files: string[] | undefined;
      let scope: string | undefined;

      // Extract timestamp: [YYYY-MM-DD HH:mm]
      const tsMatch = rawContent.match(/\[(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2})\]/);
      if (tsMatch) {
        timestamp = tsMatch[1];
      }

      // Extract bold title: **...**: or **...**
      const boldMatch = rawContent.match(/\*\*([^*]+)\*\*:?/);
      let description = rawContent;
      if (boldMatch) {
        itemTitle = boldMatch[1].replace(/\[\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}\]\s*/, "").trim();
        description = rawContent.slice(boldMatch[0].length).trim();
      }

      // Extract scope if title has "Scope: Details" or "[Scope]"
      const scopeMatch = itemTitle.match(/^([A-Za-z0-9_\-\s/]+):\s*(.+)/);
      if (scopeMatch && scopeMatch[1].length < 30) {
        scope = scopeMatch[1].trim();
        itemTitle = scopeMatch[2].trim();
      }

      // Extract files in backticks: `path/to/file`
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

  // Separate unreleased if present
  let unreleased: ChangelogRelease | undefined;
  const releasedList: ChangelogRelease[] = [];

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
    },
  };
}
