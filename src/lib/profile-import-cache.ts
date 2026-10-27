import type { ImportedProfileDraft } from "@/lib/profile-import";

export const IMPORT_CACHE_STORAGE_KEY = "zenith.profileImport.cache.v1";
export const IMPORT_CACHE_EVENT = "zenith-import-cache-updated";
export const IMPORT_CACHE_MAX_ENTRIES = 5;
export const IMPORT_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export type LiveProfileImportCharacter = {
  role?: "root" | "visible_alt";
  draft?: ImportedProfileDraft;
  characterId?: number;
  name?: string;
  className?: string;
};

export type LiveProfileImportResult = {
  rootHashTail?: string;
  requestCount?: number;
  durationMs?: number;
  characters?: LiveProfileImportCharacter[];
  warnings?: string[];
};

export type CachedProfileImportEntry = {
  characterHash: string;
  characterHashTail: string;
  result: LiveProfileImportResult;
  timestamp: number;
  mainName: string;
  characterCount: number;
  classes: string[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function notifyCacheUpdate() {
  if (typeof window === "undefined") return;
  try {
    const event = typeof CustomEvent === "function"
      ? new CustomEvent(IMPORT_CACHE_EVENT)
      : new Event(IMPORT_CACHE_EVENT);
    window.dispatchEvent(event);
  } catch {}
}

function readStoredEntries(): CachedProfileImportEntry[] {
  if (typeof window === "undefined" && typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(IMPORT_CACHE_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const now = Date.now();
    return parsed.filter((entry): entry is CachedProfileImportEntry => {
      if (!isRecord(entry)) return false;
      if (typeof entry.characterHash !== "string" || !entry.characterHash.trim()) return false;
      if (typeof entry.timestamp !== "number" || !Number.isFinite(entry.timestamp)) return false;
      // Filter expired entries
      if (now - entry.timestamp > IMPORT_CACHE_TTL_MS) return false;
      if (!isRecord(entry.result) || !Array.isArray(entry.result.characters) || entry.result.characters.length === 0) return false;
      return true;
    });
  } catch {
    return [];
  }
}

function writeStoredEntries(entries: CachedProfileImportEntry[]): boolean {
  if (typeof window === "undefined" && typeof localStorage === "undefined") return false;
  try {
    localStorage.setItem(IMPORT_CACHE_STORAGE_KEY, JSON.stringify(entries));
    notifyCacheUpdate();
    return true;
  } catch {
    return false;
  }
}

/**
 * Saves a completed import result to the local cache.
 */
export function saveCachedProfileImport(characterHash: string, result: LiveProfileImportResult): boolean {
  const cleanHash = characterHash?.trim() || "";
  if (!cleanHash) return false;
  if (!result || !Array.isArray(result.characters) || result.characters.length === 0) return false;

  const characters = result.characters.filter((c) => isRecord(c) && isRecord(c.draft));
  if (characters.length === 0) return false;

  const sanitizedResult: LiveProfileImportResult = { characters };
  const mainName = characters[0]?.draft?.name || characters[0]?.name || "Character";
  const classes = characters
    .map((c) => c.draft?.className || c.className || "")
    .filter((c): c is string => Boolean(c) && typeof c === "string");

  const entry: CachedProfileImportEntry = {
    characterHash: cleanHash,
    characterHashTail: cleanHash.slice(-12),
    result: sanitizedResult,
    timestamp: Date.now(),
    mainName,
    characterCount: characters.length,
    classes,
  };

  const current = readStoredEntries();
  const filtered = current.filter((e) => e.characterHash.toLowerCase() !== cleanHash.toLowerCase());
  const next = [entry, ...filtered].slice(0, IMPORT_CACHE_MAX_ENTRIES);

  return writeStoredEntries(next);
}

/**
 * Retrieves a cached profile import for a given character hash if unexpired.
 */
export function getCachedProfileImport(characterHash: string): CachedProfileImportEntry | null {
  const cleanHash = characterHash?.trim() || "";
  if (!cleanHash) return null;

  const entries = readStoredEntries();
  const match = entries.find((e) => e.characterHash.toLowerCase() === cleanHash.toLowerCase());
  if (!match) return null;

  if (Date.now() - match.timestamp > IMPORT_CACHE_TTL_MS) {
    deleteCachedProfileImport(cleanHash);
    return null;
  }

  return match;
}

/**
 * Returns all active, unexpired cached profile imports ordered by most recent.
 */
export function getRecentCachedProfileImports(): CachedProfileImportEntry[] {
  return readStoredEntries();
}

/**
 * Deletes a cached profile import entry by character hash.
 */
export function deleteCachedProfileImport(characterHash: string): void {
  const cleanHash = characterHash?.trim() || "";
  if (!cleanHash) return;

  const current = readStoredEntries();
  const next = current.filter((e) => e.characterHash.toLowerCase() !== cleanHash.toLowerCase());
  writeStoredEntries(next);
}

/**
 * Clears all cached profile imports.
 */
export function clearAllCachedProfileImports(): void {
  if (typeof window === "undefined" && typeof localStorage === "undefined") return;
  try {
    localStorage.removeItem(IMPORT_CACHE_STORAGE_KEY);
    notifyCacheUpdate();
  } catch {}
}

/**
 * Formats a timestamp into a concise, gamer-friendly age string.
 */
export function formatCacheAge(timestamp: number): string {
  const diffMs = Math.max(0, Date.now() - timestamp);
  const diffMinutes = Math.floor(diffMs / 60_000);
  if (diffMinutes < 1) return "< 1 min ago";
  if (diffMinutes === 1) return "1 min ago";
  if (diffMinutes < 60) return `${diffMinutes} mins ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours === 1) return "1 hr ago";
  if (diffHours < 24) return `${diffHours} hrs ago`;
  const diffDays = Math.floor(diffHours / 24);
  return diffDays === 1 ? "1 day ago" : `${diffDays} days ago`;
}
