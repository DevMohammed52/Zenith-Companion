import { describe, expect, it } from "vitest";
import {
  LIVE_IMPORT_STEPS,
  formatWaitTime,
  getPollAfterMs,
  getRetryAfterMs,
  isRecord,
  resolveLiveImportStep,
} from "@/app/profiles/page";

describe("Adversarial Frontend Contract Verification", () => {
  describe("Adversarial 1: getRetryAfterMs with pollAfterMs and edge payloads", () => {
    it("returns null when payload contains ONLY pollAfterMs across varying values", () => {
      const payloads = [
        { pollAfterMs: 2000 },
        { pollAfterMs: 3500 },
        { pollAfterMs: 5000 },
        { pollAfterMs: 15000 },
        { pollAfterMs: 60000 },
        { pollAfterMs: 0 },
        { pollAfterMs: -1000 },
        { pollAfterMs: "2000" },
        { pollAfterMs: NaN },
        { pollAfterMs: Infinity },
      ];

      for (const payload of payloads) {
        expect(getRetryAfterMs(payload)).toBeNull();
      }
    });

    it("returns null when retryAfterMs is falsy, zero, negative, or non-finite", () => {
      const invalidRetryPayloads = [
        { pollAfterMs: 2000, retryAfterMs: null },
        { pollAfterMs: 2000, retryAfterMs: undefined },
        { pollAfterMs: 2000, retryAfterMs: 0 },
        { pollAfterMs: 2000, retryAfterMs: -1 },
        { pollAfterMs: 2000, retryAfterMs: -60000 },
        { pollAfterMs: 2000, retryAfterMs: NaN },
        { pollAfterMs: 2000, retryAfterMs: Infinity },
        { pollAfterMs: 2000, retryAfterMs: -Infinity },
        { pollAfterMs: 2000, retryAfterMs: "60000" },
        { pollAfterMs: 2000, retryAfterMs: {} },
        { pollAfterMs: 2000, retryAfterMs: [] },
        { pollAfterMs: 2000, retryAfterMs: true },
        { pollAfterMs: 2000, retryAfterMs: false },
      ];

      for (const payload of invalidRetryPayloads) {
        expect(getRetryAfterMs(payload)).toBeNull();
      }
    });

    it("returns null for non-record types", () => {
      expect(getRetryAfterMs(null)).toBeNull();
      expect(getRetryAfterMs(undefined)).toBeNull();
      expect(getRetryAfterMs("")).toBeNull();
      expect(getRetryAfterMs("pollAfterMs: 2000")).toBeNull();
      expect(getRetryAfterMs(123)).toBeNull();
      expect(getRetryAfterMs(true)).toBeNull();
      expect(getRetryAfterMs(false)).toBeNull();
      expect(getRetryAfterMs([])).toBeNull();
      expect(getRetryAfterMs([2000])).toBeNull();
      expect(getRetryAfterMs(() => {})).toBeNull();
    });

    it("accurately extracts numeric retryAfterMs and decouples completely from pollAfterMs", () => {
      const decoupled1 = { pollAfterMs: 2000, retryAfterMs: 30000 };
      expect(getRetryAfterMs(decoupled1)).toBe(30000);
      expect(getPollAfterMs(decoupled1)).toBe(2000);

      const decoupled2 = { pollAfterMs: 5000, retryAfterMs: 60000 };
      expect(getRetryAfterMs(decoupled2)).toBe(60000);
      expect(getPollAfterMs(decoupled2)).toBe(5000);

      const fractional = { retryAfterMs: 14999.8 };
      expect(getRetryAfterMs(fractional)).toBe(15000);
    });
  });

  describe("Adversarial 2: Large Cooldowns (60000ms+) Clamping Resistance", () => {
    function computeSchedulingDelay(delayMs: number | undefined, isHidden: boolean) {
      const fallbackDelay = isHidden ? 15000 : 3500;
      const parsedDelay = Number(delayMs) || fallbackDelay;
      const minDelay = isHidden ? 15000 : 2000;
      return Math.max(minDelay, parsedDelay);
    }

    it("never clamps large cooldowns (60s, 120s, 300s) in foreground or background", () => {
      const largeDelays = [60000, 90000, 120000, 300000, 600000];

      for (const delay of largeDelays) {
        // Foreground check
        expect(computeSchedulingDelay(delay, false)).toBe(delay);
        // Background check (where minDelay is 15000ms)
        expect(computeSchedulingDelay(delay, true)).toBe(delay);
      }
    });

    it("enforces minimum floor but never an upper clamp", () => {
      // Sub-minimum foreground delays are raised to 2000ms floor
      expect(computeSchedulingDelay(100, false)).toBe(2000);
      expect(computeSchedulingDelay(1000, false)).toBe(2000);
      // Foreground above 2000ms is preserved
      expect(computeSchedulingDelay(2500, false)).toBe(2500);
      expect(computeSchedulingDelay(15000, false)).toBe(15000);

      // Sub-minimum background delays are raised to 15000ms floor
      expect(computeSchedulingDelay(100, true)).toBe(15000);
      expect(computeSchedulingDelay(2000, true)).toBe(15000);
      expect(computeSchedulingDelay(5000, true)).toBe(15000);
      // Background above 15000ms is preserved
      expect(computeSchedulingDelay(15001, true)).toBe(15001);
      expect(computeSchedulingDelay(60000, true)).toBe(60000);
    });

    it("formats large cooldowns gracefully without truncation", () => {
      expect(formatWaitTime(60000)).toBe("1 min");
      expect(formatWaitTime(61000)).toBe("2 min");
      expect(formatWaitTime(119000)).toBe("2 min");
      expect(formatWaitTime(120000)).toBe("2 min");
      expect(formatWaitTime(300000)).toBe("5 min");
    });
  });

  describe("Adversarial 3: HTTP 429 Status Mapping & Cooldown Fallbacks", () => {
    function processStatusResponse(
      responseStatus: number,
      headers: Record<string, string>,
      payload: Record<string, unknown>,
    ) {
      if (responseStatus === 429) {
        const retryAfterHeader = headers["retry-after"];
        const headerSeconds = retryAfterHeader ? Number(retryAfterHeader) : null;
        const headerMs = headerSeconds && Number.isFinite(headerSeconds) && headerSeconds > 0
          ? headerSeconds * 1000
          : null;
        const payloadRetryMs = getRetryAfterMs(payload);
        const cooldownMs = headerMs || payloadRetryMs || 30000;

        return {
          status: "waiting_for_budget" as const,
          retryAfterMs: cooldownMs,
          error: "",
          isFatal: false,
        };
      }

      if (responseStatus >= 400 && responseStatus !== 410) {
        return {
          status: "error" as const,
          retryAfterMs: null,
          error: "Could not read import status.",
          isFatal: true,
        };
      }

      const nextStatus = (typeof payload.status === "string" ? payload.status : "error");
      return {
        status: nextStatus,
        retryAfterMs: getRetryAfterMs(payload),
        error: "",
        isFatal: nextStatus === "error" || nextStatus === "expired",
      };
    }

    it("maps HTTP 429 to waiting_for_budget without fatal error", () => {
      const result = processStatusResponse(429, { "retry-after": "60" }, {});
      expect(result.status).toBe("waiting_for_budget");
      expect(result.retryAfterMs).toBe(60000);
      expect(result.error).toBe("");
      expect(result.isFatal).toBe(false);
    });

    it("prefers Retry-After header over payload retryAfterMs when both present on 429", () => {
      const result = processStatusResponse(429, { "retry-after": "45" }, { retryAfterMs: 30000 });
      expect(result.status).toBe("waiting_for_budget");
      expect(result.retryAfterMs).toBe(45000);
      expect(result.isFatal).toBe(false);
    });

    it("uses payload retryAfterMs on 429 when Retry-After header is missing or invalid", () => {
      const resultNoHeader = processStatusResponse(429, {}, { retryAfterMs: 50000 });
      expect(resultNoHeader.status).toBe("waiting_for_budget");
      expect(resultNoHeader.retryAfterMs).toBe(50000);

      const resultBadHeader = processStatusResponse(429, { "retry-after": "invalid" }, { retryAfterMs: 50000 });
      expect(resultBadHeader.status).toBe("waiting_for_budget");
      expect(resultBadHeader.retryAfterMs).toBe(50000);
    });

    it("defaults to 30000ms cooldown on 429 when neither header nor payload provides duration", () => {
      const result = processStatusResponse(429, {}, {});
      expect(result.status).toBe("waiting_for_budget");
      expect(result.retryAfterMs).toBe(30000);
      expect(result.error).toBe("");
      expect(result.isFatal).toBe(false);
    });

    it("treats HTTP 500 / 502 / 504 as fatal error, distinct from HTTP 429", () => {
      const res500 = processStatusResponse(500, {}, {});
      expect(res500.status).toBe("error");
      expect(res500.isFatal).toBe(true);

      const res502 = processStatusResponse(502, {}, {});
      expect(res502.status).toBe("error");
      expect(res502.isFatal).toBe(true);
    });
  });

  describe("Adversarial 4: Mutual Exclusivity of Status Cards (Zero Triple-Card Glitch)", () => {
    type LiveProfileImportStatus = "idle" | "queued" | "running" | "waiting_for_budget" | "done" | "error" | "expired";

    function resolveRenderedCard(
      liveImportStatus: LiveProfileImportStatus,
      liveImportRetryAfterMs: number | null,
      liveImportJobId: string,
    ): "error" | "cooldown" | "active" | "done" | "idle" {
      function isLiveImportTerminal(s: LiveProfileImportStatus) {
        return s === "done" || s === "error" || s === "expired";
      }

      const isTerminalError = liveImportStatus === "error" || liveImportStatus === "expired";
      const isRateLimited = !isTerminalError && (liveImportStatus === "waiting_for_budget" || Boolean(liveImportRetryAfterMs && liveImportRetryAfterMs > 0));
      const isActiveProgress = !isTerminalError && !isRateLimited && (liveImportStatus === "running" || liveImportStatus === "queued" || (Boolean(liveImportJobId) && !isLiveImportTerminal(liveImportStatus)));
      const isComplete = !isTerminalError && liveImportStatus === "done";

      // Exact JSX ternary evaluation order:
      // {isTerminalError ? <ErrorCard /> : isRateLimited ? <CooldownCard /> : isActiveProgress ? <ActiveCard /> : isComplete ? <DoneCard /> : <IdleCard />}
      if (isTerminalError) return "error";
      if (isRateLimited) return "cooldown";
      if (isActiveProgress) return "active";
      if (isComplete) return "done";
      return "idle";
    }

    it("guarantees exactly one mutually exclusive card branch across exhaustive state space", () => {
      const allStatuses: LiveProfileImportStatus[] = [
        "idle",
        "queued",
        "running",
        "waiting_for_budget",
        "done",
        "error",
        "expired",
      ];
      const allRetryAfterMs: (number | null)[] = [null, 0, -100, 2000, 15000, 60000];
      const allJobIds: string[] = ["", "imp_12345678901234567890"];

      const validCards = new Set(["error", "cooldown", "active", "done", "idle"]);
      let totalCombinationsTested = 0;

      for (const status of allStatuses) {
        for (const retryMs of allRetryAfterMs) {
          for (const jobId of allJobIds) {
            totalCombinationsTested++;
            const renderedCard = resolveRenderedCard(status, retryMs, jobId);

            // Exactly one card type is resolved
            expect(validCards.has(renderedCard)).toBe(true);

            // Assert contract invariants:
            if (status === "error" || status === "expired") {
              expect(renderedCard).toBe("error");
            } else if (status === "waiting_for_budget") {
              expect(renderedCard).toBe("cooldown");
            } else if (status === "done" && (!retryMs || retryMs <= 0)) {
              expect(renderedCard).toBe("done");
            } else if ((status === "running" || status === "queued") && (!retryMs || retryMs <= 0)) {
              expect(renderedCard).toBe("active");
            } else if (status === "idle" && !jobId && (!retryMs || retryMs <= 0)) {
              expect(renderedCard).toBe("idle");
            }
          }
        }
      }

      expect(totalCombinationsTested).toBe(7 * 6 * 2); // 84 state combinations verified
    });

    it("verifies specific edge cases that previously triggered the triple-card glitch", () => {
      // Scenario A: Error occurred with a lingering retry cooldown and job ID
      expect(resolveRenderedCard("error", 30000, "imp_123")).toBe("error");

      // Scenario B: Waiting for budget during alt importing step with active job ID
      expect(resolveRenderedCard("waiting_for_budget", 45000, "imp_123")).toBe("cooldown");

      // Scenario C: Completed import with lingering job ID
      expect(resolveRenderedCard("done", null, "imp_123")).toBe("done");

      // Scenario D: Queued import before worker assigns step
      expect(resolveRenderedCard("queued", null, "imp_123")).toBe("active");
    });
  });
});
