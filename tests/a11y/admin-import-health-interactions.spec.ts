import { spawn, type ChildProcess } from "node:child_process";
import crypto from "node:crypto";
import path from "node:path";
import { test, expect } from "@playwright/test";
import {
  attachRuntimeMonitors,
  assertAxeClean,
  assertNoHorizontalOverflow,
  seedPopulatedProfile,
} from "./fixtures/route-helpers";

const SCREENSHOT_DIR =
  "C:/Users/msi/.gemini/antigravity/brain/3f2b2eac-8909-4758-9f10-bc6e1d077728";

const EPHEMERAL_PORT = 3107;
const EPHEMERAL_BASE = `http://127.0.0.1:${EPHEMERAL_PORT}`;
const EPHEMERAL_SECRET = `test-secret-${crypto.randomBytes(12).toString("hex")}`;

function buildMockTelemetry() {
  const now = new Date("2026-11-27T16:30:00.000Z");
  const dailyRows = Array.from({ length: 14 }, (_, i) => {
    const day = new Date(now.getTime() - (13 - i) * 86400_000).toISOString().slice(0, 10);
    return {
      day,
      events: 140 + i * 12,
      pageviews: 95 + i * 9,
      attempts: 14 + i,
      completed: 12 + i,
      failed: i % 4 === 0 ? 1 : 0,
      waitingForBudget: i % 5 === 0 ? 1 : 0,
      users: 38 + i * 3,
      sessions: 45 + i * 3,
    };
  });

  const hourlyRows = Array.from({ length: 24 }, (_, i) => {
    const hour = new Date(now.getTime() - (23 - i) * 3600_000).toISOString().slice(0, 13) + ":00:00Z";
    return {
      hour,
      events: 22 + (i % 7),
      pageviews: 18 + (i % 5),
      attempts: 3 + (i % 3),
      completed: 2 + (i % 3),
      failed: i === 19 ? 1 : 0,
      users: 9 + (i % 4),
    };
  });

  return {
    ok: true,
    generatedAt: now.toISOString(),
    service: {
      worker: "zenith-profile-import",
      budgetMode: "github-idle",
      rateLimitStore: "d1-minute-budgets",
      importRequestsPerMinute: 35,
      pollAfterMs: 2000,
      importDelayMs: 1800,
      jobTtlMinutes: 60,
    },
    queue: { pending: 1, running: 1 },
    pressure: { oldestQueuedSeconds: 42, oldestRunningSeconds: 18 },
    cooldowns: {
      active: 1,
      activeCount: 1,
      items: [
        {
          scope: "target",
          keyFingerprint: "target_fp_9876543210abcdef",
          reason: "Upstream 429 burst guard",
          untilAt: new Date(now.getTime() + 145_000).toISOString(),
          remainingSeconds: 145,
        },
      ],
    },
    minuteUsage: {
      minuteKey: "29932110",
      used: 9,
      usedRequests: 9,
      limit: 35,
      budgetMode: "github-idle",
      sources: [
        { source: "profile-import", usedRequests: 7, mode: "github-idle", updatedAt: now.toISOString() },
        { source: "github-actions", usedRequests: 2, mode: "github-idle", updatedAt: now.toISOString() },
      ],
    },
    databaseStats: {
      usage_events: 48200,
      usage_visitors: 3420,
      import_events: 4180,
      import_jobs: 6,
      cooldowns: 1,
      minute_budgets: 12,
      web_vital_events: 14600,
      app_error_events: 18,
    },
    coordinator: [
      {
        active: false,
        status: "idle",
        source: "github-actions:update_data",
        runId: "run_46004410",
        updatedAt: now.toISOString(),
        expiresAt: new Date(now.getTime() + 1800_000).toISOString(),
        stale: false,
      },
    ],
    recentJobs: [
      {
        id: "imp_live_run_9988776655443322",
        targetHashFingerprint: "char_fp_abcdef1122334455",
        status: "running",
        errorCode: "",
        errorMessage: "",
        requestCount: 6,
        retryCount: 0,
        budgetMode: "github-idle",
        createdAt: new Date(now.getTime() - 18_000).toISOString(),
        updatedAt: now.toISOString(),
        expiresAt: new Date(now.getTime() + 3582_000).toISOString(),
        expired: false,
      },
      {
        id: "imp_done_ok_1122334455667788",
        targetHashFingerprint: "char_fp_9988776655443322",
        status: "complete",
        errorCode: "",
        errorMessage: "",
        requestCount: 11,
        retryCount: 0,
        budgetMode: "github-idle",
        createdAt: new Date(now.getTime() - 180_000).toISOString(),
        updatedAt: new Date(now.getTime() - 160_000).toISOString(),
        expiresAt: new Date(now.getTime() + 3420_000).toISOString(),
        expired: false,
      },
      {
        id: "imp_fail_429_0011223344556677",
        targetHashFingerprint: "char_fp_deadbeef12345678",
        status: "failed",
        errorCode: "rate_limited",
        errorMessage: "IdleMMO API returned HTTP 429 during museum scan",
        requestCount: 4,
        retryCount: 2,
        budgetMode: "github-active",
        createdAt: new Date(now.getTime() - 600_000).toISOString(),
        updatedAt: new Date(now.getTime() - 570_000).toISOString(),
        expiresAt: new Date(now.getTime() + 3000_000).toISOString(),
        expired: false,
      },
    ],
    demand: {
      jobsLastHour: 8,
      jobsLast24h: 112,
      jobsLast7d: 740,
      activeImportUsers15m: 3,
      activeImportUsers1h: 11,
      uniqueImportUsers24h: 64,
      uniqueImportUsers7d: 290,
      uniqueImportUsersAllTime: 1840,
      uniqueCharacters24h: 88,
      uniqueCharacters7d: 410,
      uniqueCharactersAllTime: 2910,
    },
    usage: {
      activeUsers15m: 14,
      activeUsers1h: 42,
      uniqueUsers24h: 310,
      uniqueUsers7d: 1420,
      uniqueUsers30d: 4180,
      uniqueUsersAllTime: 12900,
      sessions24h: 480,
      sessions7d: 2310,
      sessions30d: 7940,
      events24h: 3200,
      pageviews24h: 1920,
      pageviewsPerSession24h: 4.0,
      timeframes: [
        { key: "15m", label: "15m", events: 90, pageviews: 54, heartbeats: 36, users: 14, sessions: 16, pageviewsPerSession: 3.4 },
        { key: "1h", label: "1h", events: 280, pageviews: 170, heartbeats: 110, users: 42, sessions: 51, pageviewsPerSession: 3.3 },
        { key: "24h", label: "24h", events: 3200, pageviews: 1920, heartbeats: 1280, users: 310, sessions: 480, pageviewsPerSession: 4.0 },
        { key: "48h", label: "48h", events: 6100, pageviews: 3720, heartbeats: 2380, users: 540, sessions: 910, pageviewsPerSession: 4.1 },
        { key: "7d", label: "7d", events: 18400, pageviews: 11200, heartbeats: 7200, users: 1420, sessions: 2310, pageviewsPerSession: 4.8 },
        { key: "14d", label: "14d", events: 34200, pageviews: 21000, heartbeats: 13200, users: 2610, sessions: 4410, pageviewsPerSession: 4.8 },
        { key: "30d", label: "30d", events: 62500, pageviews: 38900, heartbeats: 23600, users: 4180, sessions: 7940, pageviewsPerSession: 4.9 },
        { key: "all", label: "All", events: 190000, pageviews: 120000, heartbeats: 70000, users: 12900, sessions: 28400, pageviewsPerSession: 4.2 },
      ],
      daily: dailyRows,
      hourly: hourlyRows,
      topPages: [
        { path: "/bis", views: 4120, users: 840 },
        { path: "/alchemy", views: 3810, users: 710 },
        { path: "/crafting", views: 940, users: 215 },
        { path: "/items", views: 3420, users: 790 },
      ],
      countries: [
        { country: "US", users: 1620, events: 21000 },
        { country: "GB", users: 540, events: 7200 },
        { country: "DE", users: 410, events: 5300 },
      ],
      referrers: [
        { host: "discord.com", users: 980 },
        { host: "google.com", users: 620 },
      ],
      devices: [
        { type: "desktop", users: 2840 },
        { type: "mobile", users: 1340 },
      ],
      browsers: [
        { family: "Chrome", users: 2910 },
        { family: "Firefox", users: 620 },
      ],
      timezones: [
        { timezone: "America/New_York", users: 920 },
        { timezone: "Europe/London", users: 540 },
      ],
    },
    imports: {
      timeframes: [
        { key: "15m", label: "15m", events: 6, attempts: 4, queued: 1, completed: 3, failed: 0, expired: 0, waitingForBudget: 0, queueBusy: 0, cooldown: 0, turnstileFailed: 0, rateLimited: 0, users: 3, characters: 4, avgDurationSeconds: 15, maxDurationSeconds: 22, avgRequestCount: 11, avgRetryCount: 0, completionRate: 75, failureRate: 0 },
        { key: "1h", label: "1h", events: 18, attempts: 12, queued: 1, completed: 10, failed: 1, expired: 0, waitingForBudget: 0, queueBusy: 0, cooldown: 0, turnstileFailed: 0, rateLimited: 1, users: 11, characters: 12, avgDurationSeconds: 16, maxDurationSeconds: 29, avgRequestCount: 11, avgRetryCount: 0.1, completionRate: 83.3, failureRate: 8.3 },
        { key: "24h", label: "24h", events: 240, attempts: 112, queued: 1, completed: 104, failed: 6, expired: 1, waitingForBudget: 4, queueBusy: 0, cooldown: 2, turnstileFailed: 1, rateLimited: 3, users: 64, characters: 88, avgDurationSeconds: 18, maxDurationSeconds: 45, avgRequestCount: 12, avgRetryCount: 0.2, completionRate: 92.9, failureRate: 5.4 },
        { key: "48h", label: "48h", events: 460, attempts: 215, queued: 1, completed: 201, failed: 10, expired: 2, waitingForBudget: 6, queueBusy: 1, cooldown: 3, turnstileFailed: 2, rateLimited: 5, users: 118, characters: 165, avgDurationSeconds: 18, maxDurationSeconds: 45, avgRequestCount: 12, avgRetryCount: 0.2, completionRate: 93.5, failureRate: 4.7 },
        { key: "7d", label: "7d", events: 1520, attempts: 740, queued: 1, completed: 698, failed: 31, expired: 5, waitingForBudget: 19, queueBusy: 2, cooldown: 8, turnstileFailed: 4, rateLimited: 14, users: 290, characters: 410, avgDurationSeconds: 17, maxDurationSeconds: 51, avgRequestCount: 12, avgRetryCount: 0.1, completionRate: 94.3, failureRate: 4.2 },
        { key: "14d", label: "14d", events: 2840, attempts: 1380, queued: 1, completed: 1304, failed: 54, expired: 9, waitingForBudget: 32, queueBusy: 4, cooldown: 14, turnstileFailed: 7, rateLimited: 24, users: 510, characters: 790, avgDurationSeconds: 17, maxDurationSeconds: 58, avgRequestCount: 12, avgRetryCount: 0.1, completionRate: 94.5, failureRate: 3.9 },
        { key: "30d", label: "30d", events: 5620, attempts: 2810, queued: 1, completed: 2665, failed: 98, expired: 15, waitingForBudget: 58, queueBusy: 7, cooldown: 21, turnstileFailed: 12, rateLimited: 41, users: 980, characters: 1580, avgDurationSeconds: 17, maxDurationSeconds: 61, avgRequestCount: 12, avgRetryCount: 0.1, completionRate: 94.8, failureRate: 3.5 },
        { key: "all", label: "All", events: 11200, attempts: 5600, queued: 1, completed: 5340, failed: 190, expired: 28, waitingForBudget: 95, queueBusy: 12, cooldown: 38, turnstileFailed: 22, rateLimited: 76, users: 1840, characters: 2910, avgDurationSeconds: 17, maxDurationSeconds: 68, avgRequestCount: 12, avgRetryCount: 0.1, completionRate: 95.4, failureRate: 3.4 },
      ],
      daily: dailyRows,
      hourly: hourlyRows,
      errors: [
        { code: "rate_limited", count: 41 },
        { code: "turnstile_failed", count: 12 },
      ],
      budgets: [{ mode: "github-idle", events: 5200 }],
      busiestTargets: [
        { fingerprintTail: "aabbcc1122", events: 18, users: 4 },
        { fingerprintTail: "ddeeff3344", events: 11, users: 2 },
      ],
      recentEvents: [
        {
          eventType: "complete",
          status: "complete",
          errorCode: "",
          budgetMode: "github-idle",
          requestCount: 11,
          retryCount: 0,
          durationSeconds: 17,
          createdAt: now.toISOString(),
        },
        {
          eventType: "failed",
          status: "failed",
          errorCode: "rate_limited",
          budgetMode: "github-active",
          requestCount: 4,
          retryCount: 2,
          durationSeconds: 29,
          createdAt: new Date(now.getTime() - 570_000).toISOString(),
        },
      ],
    },
    webVitals: {
      events24h: 480,
      events7d: 3120,
      events30d: 14600,
      poor24h: 12,
      poor30d: 340,
      poorRate30d: 2.3,
      metrics: [
        { name: "LCP", events: 3600, poor: 90, poorRate: 2.5, goodRate: 91.2, avgValue: 1320, p75Value: 1780, maxValue: 5200, rating: "good" },
        { name: "CLS", events: 3600, poor: 35, poorRate: 1.0, goodRate: 96.4, avgValue: 0.02, p75Value: 0.045, maxValue: 0.42, rating: "good" },
        { name: "INP", events: 2800, poor: 48, poorRate: 1.7, goodRate: 93.1, avgValue: 88, p75Value: 134, maxValue: 610, rating: "good" },
        { name: "FCP", events: 3600, poor: 52, poorRate: 1.4, goodRate: 94.0, avgValue: 740, p75Value: 1020, maxValue: 3400, rating: "good" },
        { name: "TTFB", events: 3600, poor: 21, poorRate: 0.6, goodRate: 97.1, avgValue: 190, p75Value: 260, maxValue: 1850, rating: "good" },
      ],
      topPaths: [
        { path: "/bis", metricName: "LCP", p75Value: 1920, events: 620, poor: 14, poorRate: 2.3 },
        { path: "/items", metricName: "INP", p75Value: 148, events: 510, poor: 11, poorRate: 2.2 },
      ],
      devices: [
        { type: "desktop", events: 10200, poor: 180, poorRate: 1.8 },
        { type: "mobile", events: 4400, poor: 160, poorRate: 3.6 },
      ],
    },
    appErrors: {
      events24h: 2,
      events7d: 7,
      events30d: 18,
      uniqueDigests24h: 1,
      topPaths: [{ path: "/profiles", events: 9, digests: 2 }],
      topDigests: [{ digest: "NEXT_NOT_FOUND_404", events: 9, paths: 2, lastSeenAt: now.toISOString() }],
      browsers: [{ family: "Chrome", events: 12 }],
      recentEvents: [
        {
          eventType: "client_error",
          path: "/profiles",
          digest: "ERR_CHUNK_RETRY",
          appVersion: "2026.11.27",
          browserClass: "Chrome",
          createdAt: now.toISOString(),
        },
      ],
    },
  };
}

async function waitForServer(url: string, timeoutMs = 45000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.status > 0) return;
    } catch {
      // Wait for boot
    }
    await new Promise((r) => setTimeout(r, 350));
  }
  throw new Error(`Server at ${url} did not respond within ${timeoutMs}ms`);
}

test.describe("/admin/import-health security, interactive console & responsive verification", () => {
  let serverProc: ChildProcess | null = null;

  test.beforeAll(async () => {
    const nextBin = path.join(process.cwd(), "node_modules", "next", "dist", "bin", "next");
    serverProc = spawn(process.execPath, [nextBin, "start", "-p", String(EPHEMERAL_PORT), "-H", "127.0.0.1"], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        ADMIN_DASHBOARD_SECRET: EPHEMERAL_SECRET,
      },
      stdio: "ignore",
    });
    await waitForServer(`${EPHEMERAL_BASE}/admin/import-health`);
  });

  test.afterAll(async () => {
    if (serverProc && !serverProc.killed) {
      serverProc.kill("SIGTERM");
    }
  });

  test("rejects unauthenticated requests with 401 and noindex/no-store headers", async ({ request }) => {
    const pageRes = await request.get(`${EPHEMERAL_BASE}/admin/import-health`);
    expect(pageRes.status()).toBe(401);
    expect(pageRes.headers()["www-authenticate"]).toContain("Basic realm=");
    expect(pageRes.headers()["cache-control"]).toContain("no-store");
    expect(pageRes.headers()["x-robots-tag"]).toContain("noindex");

    const apiRes = await request.get(`${EPHEMERAL_BASE}/api/admin/import-health`);
    expect(apiRes.status()).toBe(401);
    expect(apiRes.headers()["cache-control"]).toContain("no-store");
  });

  test("desktop 1440px and tablet 1024px render interactive console tabs, route filter, confirmation modal, and job inspector cleanly", async ({
    browser,
  }, testInfo) => {
    test.setTimeout(90000);
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      httpCredentials: { username: "zenith", password: EPHEMERAL_SECRET },
    });
    await seedPopulatedProfile(context);
    const page = await context.newPage();

    let postedActions: unknown[] = [];
    await page.route("**/api/admin/import-health*", async (route) => {
      const req = route.request();
      if (req.method() === "POST") {
        postedActions.push(req.postDataJSON());
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          headers: { "cache-control": "no-store" },
          body: JSON.stringify({ ok: true, message: "Cooldown cleared by test" }),
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: { "cache-control": "no-store", "x-admin-cache": "HIT" },
        body: JSON.stringify(buildMockTelemetry()),
      });
    });

    const monitors = await attachRuntimeMonitors(page);
    await page.goto(`${EPHEMERAL_BASE}/admin/import-health`, { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("heading", { level: 1, name: "Operations Console" })).toBeVisible();
    await expect(page.getByText("Cache: HIT")).toBeVisible();
    await expect(page.getByRole("progressbar", { name: "Minute request budget usage" })).toBeVisible();
    await assertNoHorizontalOverflow(page);

    // Zero middots anywhere inside <main>
    await expect(page.locator("main")).not.toContainText("·");

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/verify_admin_engine_1440.png`,
      fullPage: false,
      animations: "disabled",
    });

    // Click running job row -> verify Job Forensics ModalSheet
    await page.getByText("imp_live_r...443322").click();
    const jobModal = page.getByRole("dialog", { name: "Import Job Forensics" });
    await expect(jobModal).toBeVisible();
    await expect(jobModal).toContainText("imp_live_run_9988776655443322");
    await page.keyboard.press("Escape");
    await expect(jobModal).toBeHidden();

    // Click Unblock -> verify Confirmation ModalSheet protects against accidental mutation
    await page.getByRole("button", { name: "Unblock" }).click();
    const confirmModal = page.getByRole("dialog", { name: "Clear Rate-Limit Cooldown" });
    await expect(confirmModal).toBeVisible();
    expect(postedActions).toHaveLength(0);
    await confirmModal.getByRole("button", { name: "Unblock Cooldown" }).click();
    await expect(confirmModal).toBeHidden();
    expect(postedActions).toHaveLength(1);

    // Switch to Traffic & Audience tab -> verify ?tab=traffic URL sync and route search filter (/crafting)
    await page.getByRole("tab", { name: /Traffic & Audience/i }).click();
    await expect(page).toHaveURL(/tab=traffic/);
    await page.getByPlaceholder(/Filter routes/i).fill("/crafting");
    await expect(page.getByRole("cell", { name: "/crafting" })).toBeVisible();
    await expect(page.getByRole("cell", { name: "/bis" })).toHaveCount(0);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/verify_admin_traffic_1440.png`,
      fullPage: false,
      animations: "disabled",
    });

    // Check Import Pipeline, Errors & Web Vitals, D1 & Infra tabs
    await page.getByRole("tab", { name: /Import Pipeline/i }).click();
    await expect(page).toHaveURL(/tab=imports/);
    await page.getByRole("tab", { name: /Errors & Web Vitals/i }).click();
    await expect(page.getByText("Good <= 2,500ms")).toBeVisible();
    await page.getByRole("tab", { name: /D1 & Infra/i }).click();
    await expect(page.getByRole("cell", { name: "usage_events" })).toBeVisible();

    await assertAxeClean(page, testInfo, "serious");
    await monitors.assertHealthy(0.1);

    // Tablet 1024px check
    await page.setViewportSize({ width: 1024, height: 900 });
    await page.getByRole("tab", { name: /Live Engine/i }).click();
    await page.waitForTimeout(150);
    await assertNoHorizontalOverflow(page);
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/verify_admin_tablet_1024.png`,
      fullPage: false,
      animations: "disabled",
    });

    await context.close();
  });

  test("mobile 375px and 320px render clean stacked telemetry without overflow or CLS violations", async ({
    browser,
  }, testInfo) => {
    test.setTimeout(90000);
    const context = await browser.newContext({
      viewport: { width: 375, height: 812 },
      hasTouch: true,
      httpCredentials: { username: "zenith", password: EPHEMERAL_SECRET },
    });
    await seedPopulatedProfile(context);
    const page = await context.newPage();

    await page.route("**/api/admin/import-health*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: { "cache-control": "no-store", "x-admin-cache": "HIT" },
        body: JSON.stringify(buildMockTelemetry()),
      });
    });

    const monitors = await attachRuntimeMonitors(page);
    await page.goto(`${EPHEMERAL_BASE}/admin/import-health`, { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { level: 1, name: "Operations Console" })).toBeVisible();
    await assertNoHorizontalOverflow(page);

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/verify_admin_mobile_375.png`,
      fullPage: false,
      animations: "disabled",
    });

    await page.setViewportSize({ width: 320, height: 720 });
    await page.waitForTimeout(150);
    await assertNoHorizontalOverflow(page);
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/verify_admin_mobile_320.png`,
      fullPage: false,
      animations: "disabled",
    });

    await assertAxeClean(page, testInfo, "serious");
    await monitors.assertHealthy(0.1);
    await context.close();
  });
});
