import { readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_PREFERENCES,
  PREFERENCE_STORAGE_KEY,
  invalidatePreferencesCache,
  readPreferences,
  writePreferences,
} from "@/lib/preferences";
import {
  DEFAULT_PROFILE_BACKGROUND_IMAGE_URL,
  cleanUrlString,
  readStoredProfilesState,
  sanitizeProfile,
  writeProfilesState,
} from "@/lib/profiles";
import { getLastProfileBackupAt, markProfileBackupCopied } from "@/lib/local-backup";

describe("provider, storage safety, and navigation contracts", () => {
  const originalWindow = globalThis.window;
  const originalLocalStorage = globalThis.localStorage;
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
        localStorage: fakeStorage,
        dispatchEvent: vi.fn(),
      },
    });
    invalidatePreferencesCache();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      writable: true,
      value: originalWindow,
    });
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      writable: true,
      value: originalLocalStorage,
    });
    invalidatePreferencesCache();
  });

  describe("cleanUrlString & sanitizeProfile URL hardening", () => {
    it("strips CSS url(...) breakout characters from profile URLs", () => {
      const malicious = 'https://cdn.idle-mmo.com/bg.jpg"); background: red; ("';
      const cleaned = cleanUrlString(malicious);
      expect(cleaned).not.toContain('"');
      expect(cleaned).not.toContain(")");
      expect(cleaned).not.toContain("(");
      expect(cleaned).not.toContain("'");
      expect(cleaned).not.toContain("\\");

      const profile = sanitizeProfile({ backgroundUrl: malicious });
      expect(profile.backgroundUrl).not.toContain('"');
      expect(profile.backgroundUrl).not.toContain(")");
    });

    it("rejects non-http(s) URLs and falls back to default background", () => {
      expect(cleanUrlString("javascript:alert(1)")).toBe("");
      expect(cleanUrlString("data:image/svg+xml;base64,PHN2Zz4=")).toBe("");
      expect(cleanUrlString(null)).toBe("");
      expect(cleanUrlString(123)).toBe("");

      const profile = sanitizeProfile({ backgroundUrl: "javascript:alert(1)" });
      expect(profile.backgroundUrl).toBe(DEFAULT_PROFILE_BACKGROUND_IMAGE_URL);
    });
  });

  describe("readPreferences hardening and deduplication", () => {
    it("handles non-object JSON payloads and invalid enum values safely", () => {
      for (const payload of ["null", "[]", "42", '"hello"', "{invalid-json"]) {
        store.set(PREFERENCE_STORAGE_KEY, payload);
        invalidatePreferencesCache();
        const prefs = readPreferences();
        expect(prefs.theme).toBe(DEFAULT_PREFERENCES.theme);
        expect(prefs.customPrices).toEqual({});
      }

      store.set(
        PREFERENCE_STORAGE_KEY,
        JSON.stringify({
          theme: "neon-pink",
          mobileNavigationStyle: "floating",
          desktopDockPosition: "top",
          desktopNavigationStyle: "floating",
          assaultRank: "grandmaster",
          customPrices: ["not", "a", "map"],
          skillTools: null,
          audioVolume: 999,
        }),
      );
      invalidatePreferencesCache();
      const sanitized = readPreferences();
      expect(sanitized.theme).toBe("ember");
      expect(sanitized.mobileNavigationStyle).toBe("standard");
      expect(sanitized.desktopDockPosition).toBe("bottom");
      expect(sanitized.desktopNavigationStyle).toBe("sidebar");
      expect(sanitized.assaultRank).toBe("none");
      expect(sanitized.customPrices).toEqual({});
      expect(sanitized.audioVolume).toBe(100);
      // Even without calling invalidatePreferencesCache(), replacing valid JSON with malformed JSON falls back to DEFAULT_PREFERENCES
      store.set(PREFERENCE_STORAGE_KEY, JSON.stringify({ theme: "arcane" }));
      expect(readPreferences().theme).toBe("arcane");
      store.set(PREFERENCE_STORAGE_KEY, "{invalid-json");
      expect(readPreferences().theme).toBe(DEFAULT_PREFERENCES.theme);
    });

    it("deduplicates JSON.parse calls across 11 component mounts and invalidates on events", () => {
      store.set(
        PREFERENCE_STORAGE_KEY,
        JSON.stringify({
          theme: "arcane",
          customPrices: { "Health Potion": 120, Invalid: -5 },
        }),
      );
      invalidatePreferencesCache();
      const parseSpy = vi.spyOn(JSON, "parse");

      for (let i = 0; i < 11; i += 1) {
        const prefs = readPreferences();
        expect(prefs.theme).toBe("arcane");
        expect(prefs.customPrices).toEqual({ "Health Potion": 120 });
      }

      expect(parseSpy).toHaveBeenCalledTimes(1);

      // Simulate a shared event received by 11 component listeners
      const sharedEvent = new Event("zenith-preferences-updated");
      store.set(PREFERENCE_STORAGE_KEY, JSON.stringify({ theme: "frost" }));
      for (let i = 0; i < 11; i += 1) {
        invalidatePreferencesCache(sharedEvent);
        expect(readPreferences().theme).toBe("frost");
      }
      expect(parseSpy).toHaveBeenCalledTimes(2);
    });

    it("does not throw or lose in-memory updates when localStorage throws SecurityError or QuotaExceededError", () => {
      store.set(PREFERENCE_STORAGE_KEY, JSON.stringify({ theme: "ember" }));
      const quotaStorage = {
        getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
        setItem: () => {
          throw new Error("QuotaExceededError");
        },
        removeItem: () => {
          throw new Error("SecurityError");
        },
      } as unknown as Storage;

      Object.defineProperty(globalThis, "localStorage", {
        configurable: true,
        writable: true,
        value: quotaStorage,
      });
      Object.defineProperty(globalThis, "window", {
        configurable: true,
        writable: true,
        value: { localStorage: quotaStorage, dispatchEvent: vi.fn() },
      });
      invalidatePreferencesCache();

      expect(readPreferences().theme).toBe("ember");
      expect(() => writePreferences({ ...DEFAULT_PREFERENCES, theme: "forest" })).not.toThrow();
      // Subsequent update events should preserve the in-memory "forest" update even though setItem threw QuotaExceededError
      invalidatePreferencesCache(new Event("zenith-preferences-updated"));
      expect(readPreferences().theme).toBe("forest");

      const brokenStorage = {
        getItem: () => {
          throw new Error("SecurityError");
        },
        setItem: () => {
          throw new Error("QuotaExceededError");
        },
        removeItem: () => {
          throw new Error("SecurityError");
        },
      } as unknown as Storage;

      Object.defineProperty(globalThis, "localStorage", {
        configurable: true,
        writable: true,
        value: brokenStorage,
      });
      Object.defineProperty(globalThis, "window", {
        configurable: true,
        writable: true,
        value: { localStorage: brokenStorage, dispatchEvent: vi.fn() },
      });
      invalidatePreferencesCache();

      expect(() => readPreferences()).not.toThrow();
      expect(() => writePreferences({ ...DEFAULT_PREFERENCES, theme: "arcane" })).not.toThrow();
      invalidatePreferencesCache(new Event("zenith-preferences-updated"));
      expect(readPreferences().theme).toBe("arcane");
      expect(() => getLastProfileBackupAt()).not.toThrow();
      expect(getLastProfileBackupAt()).toBe(0);
      expect(() => markProfileBackupCopied()).not.toThrow();

      // Verify profile fallback ID stability across reads when storage throws SecurityError
      const firstProfileRead = readStoredProfilesState();
      const secondProfileRead = readStoredProfilesState();
      expect(firstProfileRead.state.activeProfileId).toBeTruthy();
      expect(secondProfileRead.state.activeProfileId).toBe(firstProfileRead.state.activeProfileId);

      const updatedProfile = sanitizeProfile({ ...firstProfileRead.state.profiles[0], name: "Quota Hero" });
      writeProfilesState({
        ...firstProfileRead.state,
        profiles: [updatedProfile],
      });
      expect(readStoredProfilesState().state.profiles[0]?.name).toBe("Quota Hero");
    });
  });

  describe("shell & provider source invariants", () => {
    const readSrc = (relPath: string) => readFileSync(path.join(process.cwd(), relPath), "utf8");

    it("persists starter profile on initial mount in profiles.tsx", () => {
      const profilesSrc = readSrc("src/lib/profiles.tsx");
      expect(profilesSrc).toContain("hasStoredProfiles");
      expect(profilesSrc).toMatch(/if\s*\(!hasStoredProfiles\)\s*\{\s*writeProfilesState\(initial\);/);
    });

    it("guards CraftingContext save effect with loadedStorageKeyRef", () => {
      const craftingSrc = readSrc("src/context/CraftingContext.tsx");
      expect(craftingSrc).toContain("loadedStorageKeyRef");
      expect(craftingSrc).toContain("loadedStorageKeyRef.current === storageKey");
    });

    it("exposes ensureMarketLoaded and reuses marketData in DataContext", () => {
      const dataContextSrc = readSrc("src/context/DataContext.tsx");
      expect(dataContextSrc).toContain("ensureMarketLoaded");
      expect(dataContextSrc).toContain("marketDataRef.current");
      expect(dataContextSrc).toContain("marketLoadPromiseRef.current");
    });

    it("expands Planning Tools by default in Sidebar, renders MobileMenuBtn before loaded, removes aria-pressed in DesktopDock, and scopes arrow keys in MobileCommandWheel", () => {
      const sidebarSrc = readSrc("src/components/Sidebar.tsx");
      expect(sidebarSrc).toMatch(/'Planning Tools':\s*true/);

      const mobileBtnSrc = readSrc("src/components/MobileMenuBtn.tsx");
      expect(mobileBtnSrc).toContain("if (loaded && commandMode) return null;");
      expect(mobileBtnSrc).not.toContain("if (!loaded || commandMode) return null;");

      const dockSrc = readSrc("src/components/DesktopDock.tsx");
      expect(dockSrc).not.toContain("aria-pressed");

      const wheelSrc = readSrc("src/components/MobileCommandWheel.tsx");
      expect(wheelSrc).toContain('.closest(\'.command-wheel-groups, [role="tablist"]\')');

      const setupSrc = readSrc("src/components/FirstRunSetup.tsx");
      expect(setupSrc).toContain("Import your IdleMMO character");
      expect(setupSrc).toContain("Back up local profiles");
      expect(setupSrc).not.toContain("Make Zenith match your character before planning.");
      expect(setupSrc).not.toContain("Know your backup path");
    });
  });
});
