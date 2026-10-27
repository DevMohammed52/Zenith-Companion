import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearAllCachedProfileImports,
  deleteCachedProfileImport,
  formatCacheAge,
  getCachedProfileImport,
  getRecentCachedProfileImports,
  IMPORT_CACHE_MAX_ENTRIES,
  IMPORT_CACHE_STORAGE_KEY,
  IMPORT_CACHE_TTL_MS,
  saveCachedProfileImport,
  type LiveProfileImportResult,
} from "@/lib/profile-import-cache";

import type { ImportedProfileDraft } from "@/lib/profile-import";

const mockDraft1: ImportedProfileDraft = {
  name: "D3vxGh0st",
  className: "Angler",
};

const mockDraft2: ImportedProfileDraft = {
  name: "HadesFish",
  className: "Chief",
};

const mockResult: LiveProfileImportResult = {
  characters: [
    { characterId: 101, name: "D3vxGh0st", className: "Angler", draft: mockDraft1 },
    { characterId: 102, name: "AltFisher", className: "Gatherer", draft: { name: "AltFisher", className: "Gatherer" } as ImportedProfileDraft },
  ],
};

describe("profile-import-cache (Client-Side Session Recovery)", () => {
  let store: Map<string, string>;

  beforeEach(() => {
    store = new Map<string, string>();
    const fakeStorage = {
      getItem: vi.fn((key: string) => (store.has(key) ? store.get(key)! : null)),
      setItem: vi.fn((key: string, value: string) => {
        store.set(key, String(value));
      }),
      removeItem: vi.fn((key: string) => {
        store.delete(key);
      }),
      clear: vi.fn(() => {
        store.clear();
      }),
      key: vi.fn(() => null),
      length: 0,
    } as unknown as Storage;

    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      writable: true,
      value: fakeStorage,
    });
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      writable: true,
      value: {
        dispatchEvent: vi.fn(),
      },
    });
  });

  it("saves and retrieves a cached profile import by character hash", () => {
    const hash = "VM29l7kQZZ0JbQ80q6WD";
    const ok = saveCachedProfileImport(hash, mockResult);
    expect(ok).toBe(true);

    const cached = getCachedProfileImport(hash);
    expect(cached).not.toBeNull();
    expect(cached?.characterHash).toBe(hash);
    expect(cached?.characterHashTail).toBe(hash.slice(-12));
    expect(cached?.mainName).toBe("D3vxGh0st");
    expect(cached?.characterCount).toBe(2);
    expect(cached?.result.characters).toBeDefined();
    expect(cached?.result.characters!).toHaveLength(2);
    expect(cached?.result.characters?.[0].name).toBe("D3vxGh0st");
  });

  it("returns null for non-existent or invalid hashes", () => {
    expect(getCachedProfileImport("non_existent_hash")).toBeNull();
    expect(getCachedProfileImport("")).toBeNull();
  });

  it("updates existing cache entry on repeated save for the same hash", () => {
    const hash = "VM29l7kQZZ0JbQ80q6WD";
    saveCachedProfileImport(hash, mockResult);

    const updatedResult: LiveProfileImportResult = {
      characters: [
        { characterId: 101, name: "D3vxGh0stRenamed", className: "Angler", draft: { name: "D3vxGh0stRenamed" } },
      ],
    };
    saveCachedProfileImport(hash, updatedResult);

    const cached = getCachedProfileImport(hash);
    expect(cached?.mainName).toBe("D3vxGh0stRenamed");
    expect(cached?.characterCount).toBe(1);

    const recents = getRecentCachedProfileImports();
    expect(recents).toHaveLength(1);
  });

  it("enforces LRU cap of maximum entries", () => {
    for (let i = 1; i <= IMPORT_CACHE_MAX_ENTRIES + 2; i++) {
      saveCachedProfileImport(`character_hash_${i}`, {
        characters: [{ name: `Char ${i}`, draft: { name: `Char ${i}` } }],
      });
    }

    const recents = getRecentCachedProfileImports();
    expect(recents.length).toBeLessThanOrEqual(IMPORT_CACHE_MAX_ENTRIES);
    // Most recent is character_hash_7
    expect(recents[0].characterHash).toBe(`character_hash_${IMPORT_CACHE_MAX_ENTRIES + 2}`);
    // Oldest character_hash_1 and character_hash_2 should have been evicted
    expect(getCachedProfileImport("character_hash_1")).toBeNull();
    expect(getCachedProfileImport("character_hash_2")).toBeNull();
  });

  it("filters out expired entries exceeding the TTL", () => {
    const hash = "expired_hash_123456";
    saveCachedProfileImport(hash, mockResult);

    // Artificially age the entry past TTL (25 hours ago)
    const stored = JSON.parse(localStorage.getItem(IMPORT_CACHE_STORAGE_KEY) || "[]");
    stored[0].timestamp = Date.now() - (IMPORT_CACHE_TTL_MS + 3_600_000);
    localStorage.setItem(IMPORT_CACHE_STORAGE_KEY, JSON.stringify(stored));

    expect(getCachedProfileImport(hash)).toBeNull();
    expect(getRecentCachedProfileImports()).toHaveLength(0);
  });

  it("deletes a cached entry by hash", () => {
    const hash = "to_delete_hash_123";
    saveCachedProfileImport(hash, mockResult);
    expect(getCachedProfileImport(hash)).not.toBeNull();

    deleteCachedProfileImport(hash);
    expect(getCachedProfileImport(hash)).toBeNull();
  });

  it("clears all cached entries", () => {
    saveCachedProfileImport("hash_a", mockResult);
    saveCachedProfileImport("hash_b", mockResult);
    expect(getRecentCachedProfileImports()).toHaveLength(2);

    clearAllCachedProfileImports();
    expect(getRecentCachedProfileImports()).toHaveLength(0);
  });

  it("formats cache age human-readably", () => {
    const now = Date.now();
    expect(formatCacheAge(now - 10_000)).toBe("< 1 min ago");
    expect(formatCacheAge(now - 5 * 60_000)).toBe("5 mins ago");
    expect(formatCacheAge(now - 60 * 60_000)).toBe("1 hr ago");
    expect(formatCacheAge(now - 3 * 3600_000)).toBe("3 hrs ago");
  });

  it("handles corrupted localStorage gracefully without throwing", () => {
    localStorage.setItem(IMPORT_CACHE_STORAGE_KEY, "{ not valid json !!");
    expect(getCachedProfileImport("some_hash")).toBeNull();
    expect(getRecentCachedProfileImports()).toEqual([]);
  });
});
