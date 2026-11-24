import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import {
  formatAge,
  formatBytes,
  formatPercent,
  initialOfflineStorageState,
} from "../../src/app/settings/types";

describe("Settings Architecture & Helper Contracts", () => {
  describe("formatAge", () => {
    it("handles missing and invalid values gracefully", () => {
      expect(formatAge(undefined)).toBe("Waiting for cache");
      expect(formatAge("")).toBe("Waiting for cache");
      expect(formatAge("invalid-date")).toBe("Unknown age");
    });

    it("formats minutes, hours, and days relative to current time", () => {
      const now = Date.now();
      const tenMinsAgo = new Date(now - 10 * 60 * 1000).toISOString();
      const threeHoursAgo = new Date(now - 3 * 3600 * 1000).toISOString();
      const threeDaysAgo = new Date(now - 3 * 24 * 3600 * 1000).toISOString();

      expect(formatAge(tenMinsAgo)).toBe("10m ago");
      expect(formatAge(threeHoursAgo)).toBe("3h ago");
      expect(formatAge(threeDaysAgo)).toBe("3d ago");
    });
  });

  describe("formatBytes", () => {
    it("handles invalid or zero bytes", () => {
      expect(formatBytes(undefined)).toBe("Unavailable");
      expect(formatBytes(0)).toBe("Unavailable");
      expect(formatBytes(-100)).toBe("Unavailable");
      expect(formatBytes(NaN)).toBe("Unavailable");
    });

    it("formats bytes, KB, MB cleanly", () => {
      expect(formatBytes(500)).toBe("500 B");
      expect(formatBytes(2048)).toBe("2.0 KB");
      expect(formatBytes(1048576 * 5.5)).toBe("5.5 MB");
    });
  });

  describe("formatPercent", () => {
    it("handles missing quota gracefully", () => {
      expect(formatPercent(undefined, undefined)).toBe("Quota estimate unavailable");
      expect(formatPercent(100, 0)).toBe("Quota estimate unavailable");
    });

    it("formats quota usage percentage", () => {
      expect(formatPercent(50, 100)).toBe("50.0% of available browser quota");
      expect(formatPercent(25, 200)).toBe("12.5% of available browser quota");
    });
  });

  describe("Storage Defaults", () => {
    it("has safe initial offline storage defaults", () => {
      expect(initialOfflineStorageState.cacheEntries).toBeNull();
      expect(initialOfflineStorageState.cacheEntriesChecked).toBe(false);
      expect(initialOfflineStorageState.cacheSupported).toBe(false);
      expect(initialOfflineStorageState.serviceWorkerState).toBe("Checking");
    });
  });

  describe("Modular File Architecture", () => {
    it("page.tsx is a lean orchestrator with under 150 lines", () => {
      const pagePath = join(process.cwd(), "src/app/settings/page.tsx");
      expect(existsSync(pagePath)).toBe(true);
      const content = readFileSync(pagePath, "utf-8");
      const lines = content.split("\n");
      expect(lines.length).toBeLessThan(150);
    });

    it("all decomposed subcomponents and hooks exist", () => {
      const expectedFiles = [
        "src/app/settings/types.ts",
        "src/app/settings/hooks/useSettingsState.ts",
        "src/app/settings/components/OfflineStoragePanel.tsx",
        "src/app/settings/components/SettingsOverview.tsx",
        "src/app/settings/components/AccountPanel.tsx",
        "src/app/settings/components/AppearancePanel.tsx",
        "src/app/settings/components/CustomPricesPanel.tsx",
        "src/app/settings/components/DataCachePanel.tsx",
        "src/app/settings/components/ShortcutsPanel.tsx",
      ];

      for (const file of expectedFiles) {
        const filePath = join(process.cwd(), file);
        expect(existsSync(filePath)).toBe(true);
      }
    });
  });
});
