export type PatchContentBlock = {
  type: "heading" | "listItem" | "paragraph" | "image";
  text: string;
};

export type PatchSection = {
  heading: string;
  blocks: PatchContentBlock[];
};

export type PatchNote = {
  id: number;
  version: string;
  title: string;
  headline: string;
  releasedAt: string | null;
  releaseLabel?: string;
  releaseDateLabel: string | null;
  page: number;
  sourceUrl: string;
  categories: string[];
  excerpt: string;
  contentBlocks: PatchContentBlock[];
  sections: PatchSection[];
  bodyText: string;
  searchText: string;
};

export type PatchNotesPayload = {
  meta: {
    generatedAt: string;
    source: string;
    mode: string;
    totalAvailable: number;
    totalFetched: number;
    fetchedPages?: number[];
    latestPatchId: number | null;
    oldestPatchId: number | null;
    latestVersion: string | null;
    oldestVersion: string | null;
    categoryCounts: Record<string, number>;
  };
  patchNotes: PatchNote[];
};

export const ALL_FILTER = "all";
export const NOTES_PER_PAGE = 10;

export const CATEGORY_LABELS: Record<string, string> = {
  "public-api": "Public API",
  combat: "Combat",
  hunting: "Hunting",
  dungeons: "Dungeons",
  "world-bosses": "World Bosses",
  pets: "Pets",
  guilds: "Guilds",
  conquest: "Conquest",
  housing: "Housing",
  economy: "Economy",
  alchemy: "Alchemy",
  forge: "Forge",
  skills: "Skills",
  items: "Items",
  weather: "Weather",
  map: "Map",
  tavern: "Tavern",
  translations: "Translations",
  "mobile-ui": "Mobile/UI",
  seasonal: "Seasonal",
  membership: "Membership",
  quests: "Quests",
  "bug-fixes": "Bug Fixes",
};

export const QUICK_TOPIC_IDS = [
  "combat",
  "skills",
  "items",
  "pets",
  "dungeons",
  "world-bosses",
  "forge",
  "alchemy",
  "economy",
  "conquest",
  "bug-fixes",
] as const;

export function sanitizeDisplayText(value: string): string {
  return String(value || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function formatPatchDate(value: string | null | undefined, fallback?: string | null): string {
  if (fallback) return fallback;
  if (!value) return "Unknown date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return date.toLocaleDateString("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function getPatchYear(value: string | null | undefined): string {
  if (!value) return "Unknown";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Unknown" : String(date.getUTCFullYear());
}

export function getPatchTitleText(note: PatchNote): string {
  if (note.title && note.title.trim()) return note.title.trim();
  const cleanHeadline = sanitizeDisplayText(note.headline);
  if (cleanHeadline && cleanHeadline.toLowerCase() !== `version ${note.version}`.toLowerCase()) {
    return cleanHeadline;
  }
  return `Patch ${note.version}`;
}

export function filterPatchNotes(
  notes: PatchNote[],
  {
    query,
    category,
    year,
  }: {
    query: string;
    category: string;
    year: string;
  },
): PatchNote[] {
  const normalizedQuery = query.trim().toLowerCase();
  return notes.filter((note) => {
    if (category !== ALL_FILTER && !note.categories.includes(category)) return false;
    if (year !== ALL_FILTER && getPatchYear(note.releasedAt) !== year) return false;
    if (!normalizedQuery) return true;
    return (
      note.searchText.includes(normalizedQuery) ||
      note.version.toLowerCase().includes(normalizedQuery) ||
      note.headline.toLowerCase().includes(normalizedQuery)
    );
  });
}
