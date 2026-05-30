import { afterEach, describe, expect, it, vi } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  getBrowserNotificationState,
  requestBrowserNotificationPermission,
  showBrowserNotification,
} from "@/lib/browser-notifications";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const allowedNotificationApiFiles = new Set([
  path.normalize("src/lib/browser-notifications.ts"),
]);

const forbiddenNotificationApiPatterns = [
  { label: "permission prompt", pattern: /\brequestPermission\s*\(/ },
  { label: "notification constructor", pattern: /\bnew\s+Notification\s*\(/ },
  { label: "service worker notification display", pattern: /\.\s*showNotification\s*\(/ },
  { label: "push subscription", pattern: /\bpushManager\b|\bPushManager\b/ },
  { label: "notification service-worker event", pattern: /\bnotificationclick\b|\bpushsubscriptionchange\b/ },
];

function collectFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const fullPath = path.join(directory, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) return collectFiles(fullPath);
    if (!/\.(ts|tsx|js|mjs)$/.test(entry)) return [];
    return [fullPath];
  });
}

describe("browser notification trust model", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("treats non-browser environments as unsupported", async () => {
    expect(getBrowserNotificationState()).toBe("unsupported");
    await expect(requestBrowserNotificationPermission()).resolves.toBe("unsupported");
    expect(showBrowserNotification({ title: "Test", body: "Hidden" })).toBe(false);
  });

  it("uses the browser API only after the helper is called", async () => {
    const createdNotifications: Array<{ title: string; options?: NotificationOptions }> = [];
    class FakeNotification {
      static permission: NotificationPermission = "granted";

      static requestPermission = vi.fn<() => Promise<NotificationPermission>>(() => Promise.resolve("granted"));

      constructor(title: string, options?: NotificationOptions) {
        createdNotifications.push({ title, options });
      }
    }

    vi.stubGlobal("window", {
      Notification: FakeNotification,
    });

    expect(getBrowserNotificationState()).toBe("granted");
    await expect(requestBrowserNotificationPermission()).resolves.toBe("granted");
    expect(FakeNotification.requestPermission).toHaveBeenCalledTimes(1);
    expect(showBrowserNotification({ title: "Market watch", body: "Threshold reached", tag: "watch-1" })).toBe(true);
    expect(createdNotifications).toEqual([
      {
        title: "Market watch",
        options: {
          body: "Threshold reached",
          tag: "watch-1",
        },
      },
    ]);
  });

  it("keeps browser notification and push APIs behind the policy helper", () => {
    const files = [
      ...collectFiles(path.join(rootDir, "src")),
      path.join(rootDir, "public", "sw.js"),
    ];

    const violations = files.flatMap((filePath) => {
      const relativePath = path.normalize(path.relative(rootDir, filePath));
      if (allowedNotificationApiFiles.has(relativePath)) return [];

      const contents = readFileSync(filePath, "utf8");
      return forbiddenNotificationApiPatterns
        .filter(({ pattern }) => pattern.test(contents))
        .map(({ label }) => `${relativePath}: ${label}`);
    });

    expect(violations).toEqual([]);
  });
});
