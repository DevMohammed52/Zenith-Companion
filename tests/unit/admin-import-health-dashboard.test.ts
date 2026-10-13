import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  D1_RETENTION_POLICIES,
  computeImportTrendBars,
  countryCodeToFlagEmoji,
  deriveOperationalHealth,
  deriveVitalRating,
  formatCountryDisplay,
  formatDuration,
  formatVitalValue,
  normalizeHealth,
} from "@/app/admin/import-health/types";
import { CommandHeader } from "@/app/admin/import-health/components/CommandHeader";
import { LiveEngineTab } from "@/app/admin/import-health/components/LiveEngineTab";
import { ImportPipelineTab } from "@/app/admin/import-health/components/ImportPipelineTab";
import { TrafficAudienceTab } from "@/app/admin/import-health/components/TrafficAudienceTab";
import { ErrorsWebVitalsTab } from "@/app/admin/import-health/components/ErrorsWebVitalsTab";
import { DatabaseInfraTab } from "@/app/admin/import-health/components/DatabaseInfraTab";

describe("Admin Import Health dashboard logic & normalization", () => {
  it("does NOT mark live operational health as 'Needs review' when only historical imports failed", () => {
    const health = normalizeHealth({
      ok: true,
      service: {
        worker: "zenith-profile-import",
        budgetMode: "github-idle",
        importRequestsPerMinute: 35,
        pollAfterMs: 2000,
        importDelayMs: 1800,
        jobTtlMinutes: 60,
      },
      queue: { pending: 0, running: 0 },
      pressure: { oldestQueuedSeconds: 0, oldestRunningSeconds: 0 },
      cooldowns: { active: 0, activeCount: 0, items: [] },
      minuteUsage: {
        minuteKey: "29600000",
        used: 2,
        usedRequests: 2,
        limit: 35,
        budgetMode: "github-idle",
        sources: [],
      },
      last24h: {
        total: 10,
        completed: 5,
        failed: 5,
        waitingForBudget: 0,
        rateLimited: 0,
        avgRequestCount: 12,
        avgRetryCount: 0,
        avgDurationSeconds: 18,
        completionRate: 50,
        failureRate: 50,
        statuses: { complete: 5, failed: 5 },
      },
    });

    const state = deriveOperationalHealth(health, false);
    expect(state.label).toBe("Operational");
    expect(state.tone).toBe("good");
  });

  it("reflects real-time cooldowns, queue backpressure, stalled running jobs, budget saturation, and active scraper states", () => {
    const base = normalizeHealth({ ok: true });

    // Cooldown active
    const withCooldown = normalizeHealth({
      ...base,
      cooldowns: {
        active: 1,
        activeCount: 1,
        items: [
          {
            scope: "global",
            keyFingerprint: "global",
            reason: "429 upstream",
            untilAt: new Date(Date.now() + 60000).toISOString(),
            remainingSeconds: 60,
          },
        ],
      },
    });
    expect(deriveOperationalHealth(withCooldown, false)).toMatchObject({
      label: "Cooldown Active",
      tone: "warn",
    });

    // Queue backpressure (queued)
    const withBackpressure = normalizeHealth({
      ...base,
      queue: { pending: 6, running: 1 },
      pressure: { oldestQueuedSeconds: 240, oldestRunningSeconds: 30 },
    });
    expect(deriveOperationalHealth(withBackpressure, false)).toMatchObject({
      label: "Queue Backpressure",
      tone: "warn",
    });

    // Stalled running job (>= 300s oldestRunningSeconds)
    const withStalledRunning = normalizeHealth({
      ...base,
      queue: { pending: 0, running: 1 },
      pressure: { oldestQueuedSeconds: 0, oldestRunningSeconds: 360 },
    });
    expect(deriveOperationalHealth(withStalledRunning, false)).toMatchObject({
      label: "Queue Backpressure",
      tone: "warn",
    });

    // Minute budget saturated
    const withSaturatedBudget = normalizeHealth({
      ...base,
      minuteUsage: {
        minuteKey: "1",
        used: 35,
        usedRequests: 35,
        limit: 35,
        budgetMode: "github-idle",
        sources: [],
      },
    });
    expect(deriveOperationalHealth(withSaturatedBudget, false)).toMatchObject({
      label: "Budget Saturated",
      tone: "warn",
    });

    // Scraper active propagates github-active mode & 6/min limit
    const withActiveScraper = normalizeHealth({
      ok: true,
      coordinator: {
        mode: "github-active",
        anyActive: true,
        states: [
          {
            source: "github-actions:update_data",
            active: true,
            runId: "run_99",
            updatedAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 300000).toISOString(),
          },
        ],
      },
    });
    expect(withActiveScraper.service.budgetMode).toBe("github-active");
    expect(withActiveScraper.minuteUsage.budgetMode).toBe("github-active");
    expect(withActiveScraper.minuteUsage.limit).toBe(6);
    expect(deriveOperationalHealth(withActiveScraper, false)).toMatchObject({
      label: "Scraper Throttled",
      tone: "warn",
    });
  });

  it("computes non-overflowing import trend bar segments even under three-way .666 rounding", () => {
    const bars = computeImportTrendBars([
      {
        day: "2026-10-12",
        events: 20,
        attempts: 10,
        completed: 10,
        failed: 0,
        users: 5,
      },
      {
        day: "2026-10-13",
        events: 15,
        attempts: 8,
        completed: 5,
        failed: 2,
        users: 4,
      },
    ]);

    expect(bars).toHaveLength(2);
    expect(bars[0].completedPct).toBe(100);
    expect(bars[0].failedPct).toBe(0);
    expect(bars[0].otherPct).toBe(0);

    expect(bars[1].completedPct).toBe(50);
    expect(bars[1].failedPct).toBe(20);
    expect(bars[1].otherPct).toBe(10);

    // Regression: 1/6 + 1/6 + 4/6 previously rounded to 16.7 + 16.7 + 66.7 = 100.1 (> 100)
    const trickyRounding = computeImportTrendBars([
      {
        day: "2026-10-14",
        events: 6,
        attempts: 6,
        completed: 1,
        failed: 1,
        users: 2,
      },
    ]);
    expect(trickyRounding[0].completedPct).toBe(16.7);
    expect(trickyRounding[0].failedPct).toBe(16.7);
    expect(trickyRounding[0].otherPct).toBe(66.6);
    expect(
      trickyRounding[0].completedPct + trickyRounding[0].failedPct + trickyRounding[0].otherPct,
    ).toBeLessThanOrEqual(100);
  });

  it("formats ISO country codes with flag emoji and region display names", () => {
    expect(countryCodeToFlagEmoji("US")).toBe("🇺🇸");
    expect(countryCodeToFlagEmoji("DE")).toBe("🇩🇪");
    expect(countryCodeToFlagEmoji("unknown")).toBe("🌐");

    const us = formatCountryDisplay("us");
    expect(us.code).toBe("US");
    expect(us.flag).toBe("🇺🇸");
    expect(us.name).toContain("United States");

    const unk = formatCountryDisplay("unknown");
    expect(unk.flag).toBe("🌐");
    expect(unk.name).toBe("Unknown Region");
  });

  it("evaluates Core Web Vitals ratings, preserves explicit goodRate, and sets 0% goodRate when events === 0", () => {
    expect(deriveVitalRating("LCP", 2100, 10)).toBe("good");
    expect(deriveVitalRating("LCP", 3200, 10)).toBe("needs-improvement");
    expect(deriveVitalRating("LCP", 4500, 10)).toBe("poor");

    expect(deriveVitalRating("CLS", 0.05, 10)).toBe("good");
    expect(deriveVitalRating("CLS", 0.18, 10)).toBe("needs-improvement");
    expect(deriveVitalRating("CLS", 0.32, 10)).toBe("poor");

    expect(deriveVitalRating("INP", 150, 10)).toBe("good");
    expect(deriveVitalRating("INP", 350, 10)).toBe("needs-improvement");
    expect(deriveVitalRating("INP", 600, 10)).toBe("poor");

    expect(formatVitalValue("CLS", 0.045)).toBe("0.045");
    expect(formatVitalValue("LCP", 1850)).toBe("1,850ms");
    expect(formatDuration(125)).toBe("2m 5s");

    const normalized = normalizeHealth({
      ok: true,
      webVitals: {
        events24h: 10,
        events7d: 20,
        events30d: 40,
        poor24h: 2,
        poor30d: 4,
        poorRate30d: 10,
        metrics: [
          {
            name: "LCP",
            events: 0,
            poor: 0,
            poorRate: 0,
            goodRate: 100,
            avgValue: 0,
            p75Value: 0,
            maxValue: 0,
            rating: "good",
          },
          {
            name: "INP",
            events: 40,
            poor: 4,
            poorRate: 10,
            goodRate: 72.5,
            avgValue: 160,
            p75Value: 190,
            maxValue: 480,
            rating: "good",
          },
        ],
        topPaths: [
          // Partial topPath without precomputed poorRate
          { path: "/alchemy", metricName: "LCP", events: 8, poor: 2, poorRate: undefined as unknown as number },
        ],
        devices: [],
      },
    });

    const lcp = normalized.webVitals.metrics.find((m) => m.name === "LCP");
    const inp = normalized.webVitals.metrics.find((m) => m.name === "INP");
    expect(lcp?.goodRate).toBe(0);
    expect(inp?.goodRate).toBe(72.5);
    expect(normalized.webVitals.topPaths[0].poorRate).toBe(25);
  });

  it("normalizes both coordinator array/object payloads, aliases, and all 8 D1 table policies", () => {
    const normalized = normalizeHealth({
      ok: true,
      databaseStats: {
        usage_events: 1200,
        usage_visitors: 340,
        import_events: 85,
        import_jobs: 2,
        cooldowns: 0,
        minute_budgets: 4,
        web_vital_events: 620,
        app_error_events: 3,
      },
      imports: {
        byError: [{ errorCode: "rate_limited", count: 4 }],
        topCharacters: [{ targetHashFingerprint: "abcdef1234567890", events: 9, users: 2 }],
      },
    });

    expect(normalized.coordinator.map((c) => c.source)).toEqual(
      expect.arrayContaining([
        "github-actions:update_data",
        "github-actions:update_guild_data",
      ]),
    );
    expect(normalized.imports.errors).toEqual([{ code: "rate_limited", count: 4 }]);
    expect(normalized.imports.busiestTargets).toEqual([
      { fingerprintTail: "7890".padStart(10, "abcdef123456".slice(-6)), events: 9, users: 2 },
    ]);
    expect(D1_RETENTION_POLICIES).toHaveLength(8);
    expect(D1_RETENTION_POLICIES.map((p) => p.table).sort()).toEqual(
      Object.keys(normalized.databaseStats).sort(),
    );
  });

  it("renders CommandHeader and all 5 console tabs with valid ARIA roles and full 24h/30d trend buckets", () => {
    const dailyRows = Array.from({ length: 20 }, (_, idx) => ({
      day: `2026-09-${String(idx + 1).padStart(2, "0")}`,
      events: 10,
      pageviews: 8,
      attempts: 4,
      completed: 3,
      failed: 1,
      users: 3,
    }));

    const health = normalizeHealth({
      ok: true,
      recentJobs: [
        {
          id: "imp_active_test_123456789",
          targetHashFingerprint: "char_hash_fingerprint_999",
          status: "queued",
          errorCode: "",
          errorMessage: "",
          requestCount: 2,
          retryCount: 0,
          budgetMode: "github-idle",
          createdAt: "2026-10-13T00:00:00.000Z",
          updatedAt: "2026-10-13T00:01:00.000Z",
          expiresAt: "2026-10-13T01:00:00.000Z",
          expired: false,
        },
      ],
      cooldowns: {
        active: 1,
        activeCount: 1,
        items: [
          {
            scope: "ip",
            keyFingerprint: "fp_blocked_user",
            reason: "Too many imports",
            untilAt: "2026-10-13T00:05:00.000Z",
            remainingSeconds: 180,
          },
        ],
      },
      imports: {
        daily: dailyRows,
        byError: [{ errorCode: "rate_limited", count: 3 }],
        topCharacters: [{ targetHashFingerprint: "char_1234567890", events: 5, users: 2 }],
      },
      usage: {
        daily: dailyRows,
        topPages: [{ path: "/alchemy", views: 120, users: 45 }],
        countries: [{ country: "US", users: 30, events: 90 }],
      },
    });

    const headerHtml = renderToStaticMarkup(
      createElement(CommandHeader, {
        health,
        loading: false,
        actionBusy: null,
        cacheHeader: "HIT",
        selectedFrame: "30d",
        onSelectFrame: () => {},
        activeTab: "engine",
        onSelectTab: () => {},
        autoRefreshSec: 30,
        countdownSec: 28,
        onChangeAutoRefresh: () => {},
        onRefreshNow: () => {},
        onRunQueue: () => {},
      }),
    );
    expect(headerHtml).toContain('role="tablist"');
    expect(headerHtml).not.toContain('<nav class=');
    expect(headerHtml).toContain('aria-controls="tabpanel-engine"');
    expect(headerHtml).toContain("Cache: HIT");
    expect(headerHtml).toContain("Auto (28s)");

    const tab1Html = renderToStaticMarkup(
      createElement(LiveEngineTab, {
        health,
        actionBusy: null,
        onExecuteAction: () => {},
      }),
    );
    expect(tab1Html).toContain('id="tabpanel-engine"');
    expect(tab1Html).toContain('role="progressbar"');
    expect(tab1Html).toContain('aria-label="Minute request budget usage"');
    expect(tab1Html).toContain("Force Unlock");
    expect(tab1Html).toContain("Cancel");
    expect(tab1Html).toContain("Unblock");

    const importFrame = health.imports.timeframes.find((f) => f.key === "30d")!;
    const tab2Html = renderToStaticMarkup(
      createElement(ImportPipelineTab, {
        health,
        importFrame,
        selectedFrame: "30d",
        selectedLabel: "30d",
      }),
    );
    expect(tab2Html).toContain('id="tabpanel-imports"');
    // Verify all 20 daily rows render (not truncated to 14)
    expect((tab2Html.match(/3 ok/g) || []).length).toBe(20);

    const usageFrame = health.usage.timeframes.find((f) => f.key === "30d")!;
    const tab3Html = renderToStaticMarkup(
      createElement(TrafficAudienceTab, {
        health,
        usageFrame,
        selectedFrame: "30d",
        selectedLabel: "30d",
      }),
    );
    expect(tab3Html).toContain('id="tabpanel-traffic"');
    expect(tab3Html).toContain("/alchemy");
    expect(tab3Html).toContain("🇺🇸");
    expect((tab3Html.match(/8 views/g) || []).length).toBe(20);

    const tab4Html = renderToStaticMarkup(createElement(ErrorsWebVitalsTab, { health }));
    expect(tab4Html).toContain('id="tabpanel-vitals"');
    expect(tab4Html).toContain("0% good");
    expect(tab4Html).not.toContain("100% non-poor");

    const tab5Html = renderToStaticMarkup(createElement(DatabaseInfraTab, { health }));
    expect(tab5Html).toContain('id="tabpanel-database"');
    expect(tab5Html).toContain("usage_events");
    expect(tab5Html).toContain("minute_budgets");
  });
});

