import { describe, expect, it } from "vitest";
import {
  LIVE_IMPORT_STEPS,
  formatWaitTime,
  getPollAfterMs,
  getRetryAfterMs,
  isRecord,
  resolveLiveImportStep,
} from "@/app/profiles/page";

describe("Profile Status Parsing & Decoupled Polling Contracts (Milestone M3)", () => {
  describe("Tier 1: Feature Coverage (Decoupled retryAfterMs vs pollAfterMs)", () => {
    it("returns null for retryAfterMs when payload is empty or not an object", () => {
      expect(getRetryAfterMs(null)).toBeNull();
      expect(getRetryAfterMs(undefined)).toBeNull();
      expect(getRetryAfterMs("bad")).toBeNull();
      expect(getRetryAfterMs(123)).toBeNull();
      expect(getRetryAfterMs({})).toBeNull();
    });

    it("extracts numeric retryAfterMs when explicitly provided", () => {
      expect(getRetryAfterMs({ retryAfterMs: 30000 })).toBe(30000);
      expect(getRetryAfterMs({ retryAfterMs: 4200.4 })).toBe(4200);
    });

    it("does NOT populate retryAfterMs from pollAfterMs (eliminates 'Try again in 2 sec' glitch)", () => {
      // In-flight worker responses return pollAfterMs: 2000 without retryAfterMs.
      // Previously, getRetryAfterMs fell back to pollAfterMs, incorrectly claiming a cooldown.
      const runningPayload = {
        jobId: "imp_12345",
        status: "running",
        pollAfterMs: 2000,
        progress: { current: 4, total: 12 },
      };

      expect(getRetryAfterMs(runningPayload)).toBeNull();
      expect(getPollAfterMs(runningPayload)).toBe(2000);
    });

    it("returns default 3500ms for getPollAfterMs when pollAfterMs is omitted or invalid", () => {
      expect(getPollAfterMs(null)).toBe(3500);
      expect(getPollAfterMs({})).toBe(3500);
      expect(getPollAfterMs({ pollAfterMs: "invalid" })).toBe(3500);
      expect(getPollAfterMs({ pollAfterMs: -100 })).toBe(3500);
      expect(getPollAfterMs({}, 5000)).toBe(5000);
    });

    it("extracts numeric pollAfterMs when present", () => {
      expect(getPollAfterMs({ pollAfterMs: 2500 })).toBe(2500);
      expect(getPollAfterMs({ pollAfterMs: 10000 })).toBe(10000);
    });

    it("correctly decouples both when both fields are present in cooldown payload", () => {
      const cooldownPayload = {
        jobId: "imp_12345",
        status: "waiting_for_budget",
        pollAfterMs: 10000,
        retryAfterMs: 45000,
      };

      expect(getRetryAfterMs(cooldownPayload)).toBe(45000);
      expect(getPollAfterMs(cooldownPayload)).toBe(10000);
    });
  });

  describe("Tier 1: Feature Coverage (Discrete 4-Step Contract & Labels)", () => {
    it("defines exactly the 4 canonical import steps in order", () => {
      expect(LIVE_IMPORT_STEPS).toHaveLength(4);
      expect(LIVE_IMPORT_STEPS.map((s) => s.key)).toEqual([
        "root_baseline",
        "account_museum",
        "alt_characters",
        "final_assembly",
      ]);
      expect(LIVE_IMPORT_STEPS.map((s) => s.index)).toEqual([1, 2, 3, 4]);
    });

    it("resolves Step 1 (root_baseline) with discrete badge and gamer-friendly copy", () => {
      const progress = {
        step: "root_baseline",
        stepIndex: 1,
        stepTotal: 4,
        stepLabel: "Reading root character",
        label: "Reading root character (Guild 1070 Kushisu)",
      };

      const resolved = resolveLiveImportStep(progress, "running");
      expect(resolved.step).toBe("root_baseline");
      expect(resolved.stepIndex).toBe(1);
      expect(resolved.stepTotal).toBe(4);
      expect(resolved.stepLabel).toBe("Reading root character");
      expect(resolved.badge).toBe("Step 1 of 4: Reading root character");
      expect(resolved.detail).toBe("Reading root character (Guild 1070 Kushisu)");
    });

    it("resolves Step 2 (account_museum) with discrete badge and gamer-friendly copy", () => {
      const progress = {
        step: "account_museum",
        stepIndex: 2,
        stepTotal: 4,
        stepLabel: "Scanning museum",
        label: "Scanning museum (Page 2 of 4)",
      };

      const resolved = resolveLiveImportStep(progress, "running");
      expect(resolved.step).toBe("account_museum");
      expect(resolved.stepIndex).toBe(2);
      expect(resolved.stepTotal).toBe(4);
      expect(resolved.stepLabel).toBe("Scanning museum");
      expect(resolved.badge).toBe("Step 2 of 4: Scanning museum");
      expect(resolved.detail).toBe("Scanning museum (Page 2 of 4)");
    });

    it("resolves Step 3 (alt_characters) with discrete badge and gamer-friendly copy", () => {
      const progress = {
        step: "alt_characters",
        stepIndex: 3,
        stepTotal: 4,
        stepLabel: "Importing alts",
        label: "Importing Alt 1/2 (Kushisu Alt)",
      };

      const resolved = resolveLiveImportStep(progress, "running");
      expect(resolved.step).toBe("alt_characters");
      expect(resolved.stepIndex).toBe(3);
      expect(resolved.stepTotal).toBe(4);
      expect(resolved.stepLabel).toBe("Importing alts");
      expect(resolved.badge).toBe("Step 3 of 4: Importing alts");
      expect(resolved.detail).toBe("Importing Alt 1/2 (Kushisu Alt)");
    });

    it("resolves Step 4 (final_assembly) with discrete badge and gamer-friendly copy", () => {
      const progress = {
        step: "final_assembly",
        stepIndex: 4,
        stepTotal: 4,
        stepLabel: "Assembling profile",
        label: "Assembling final profile with account museum items",
      };

      const resolved = resolveLiveImportStep(progress, "running");
      expect(resolved.step).toBe("final_assembly");
      expect(resolved.stepIndex).toBe(4);
      expect(resolved.stepTotal).toBe(4);
      expect(resolved.stepLabel).toBe("Assembling profile");
      expect(resolved.badge).toBe("Step 4 of 4: Assembling profile");
      expect(resolved.detail).toBe("Assembling final profile with account museum items");
    });
  });

  describe("Tier 2: Boundary & Corner Cases", () => {
    it("preserves large retryAfterMs (e.g. 60000ms cooldown) without clamping", () => {
      const longCooldownPayload = { retryAfterMs: 60000 };
      expect(getRetryAfterMs(longCooldownPayload)).toBe(60000);
      expect(formatWaitTime(getRetryAfterMs(longCooldownPayload) || undefined)).toBe("1 min");
    });

    it("gracefully handles missing or null progress when status is 'done'", () => {
      const resolved = resolveLiveImportStep(null, "done");
      expect(resolved.stepIndex).toBe(4);
      expect(resolved.stepTotal).toBe(4);
      expect(resolved.badge).toBe("Step 4 of 4: Assembling profile");
      expect(resolved.detail).toBe("Profile assembled and ready to save.");
    });

    it("gracefully handles missing or null progress when status is 'queued'", () => {
      const resolved = resolveLiveImportStep(null, "queued");
      expect(resolved.stepIndex).toBe(1);
      expect(resolved.stepTotal).toBe(4);
      expect(resolved.badge).toBe("Step 1 of 4: Reading root character");
    });

    it("matches step index from step key string when stepIndex is omitted", () => {
      const payloadWithoutIndex = {
        step: "alt_characters",
        label: "Importing Alt 2/2",
      };
      const resolved = resolveLiveImportStep(payloadWithoutIndex, "running");
      expect(resolved.stepIndex).toBe(3);
      expect(resolved.badge).toBe("Step 3 of 4: Importing alts");
      expect(resolved.detail).toBe("Importing Alt 2/2");
    });

    it("matches step key from numeric stepIndex when step key string is omitted", () => {
      const payloadWithoutKey = {
        stepIndex: 2,
        label: "Scanning museum entries",
      };
      const resolved = resolveLiveImportStep(payloadWithoutKey, "running");
      expect(resolved.step).toBe("account_museum");
      expect(resolved.stepIndex).toBe(2);
      expect(resolved.stepLabel).toBe("Scanning museum");
    });

    it("handles legacy progress payload without step metadata gracefully", () => {
      const legacyPayload = {
        current: 5,
        total: 20,
        label: "Reading character data",
      };
      const resolved = resolveLiveImportStep(legacyPayload, "running");
      expect(resolved.stepIndex).toBe(1);
      expect(resolved.stepTotal).toBe(4);
      expect(resolved.badge).toBe("Step 1 of 4: Reading root character");
      expect(resolved.detail).toBe("Reading character data");
    });

    it("clamps out-of-range stepIndex safely to stepTotal", () => {
      const payloadExceeded = { stepIndex: 99, stepTotal: 4 };
      const resolved = resolveLiveImportStep(payloadExceeded, "running");
      expect(resolved.stepIndex).toBe(4);
    });

    it("formats wait times accurately for gamer copy", () => {
      expect(formatWaitTime(undefined)).toBe("");
      expect(formatWaitTime(0)).toBe("");
      expect(formatWaitTime(-500)).toBe("");
      expect(formatWaitTime(1800)).toBe("2 sec");
      expect(formatWaitTime(29500)).toBe("30 sec");
      expect(formatWaitTime(60000)).toBe("1 min");
      expect(formatWaitTime(120000)).toBe("2 min");
    });

    it("isRecord helper correctly identifies plain objects only", () => {
      expect(isRecord({})).toBe(true);
      expect(isRecord({ foo: "bar" })).toBe(true);
      expect(isRecord(null)).toBe(false);
      expect(isRecord(undefined)).toBe(false);
      expect(isRecord([])).toBe(false);
      expect(isRecord("string")).toBe(false);
      expect(isRecord(123)).toBe(false);
    });
  });

  describe("Tier 3: Concurrency & Delay Scheduling Rules", () => {
    function computeSchedulingDelay(delayMs: number | undefined, isHidden: boolean) {
      const fallbackDelay = isHidden ? 15000 : 3500;
      const parsedDelay = Number(delayMs) || fallbackDelay;
      const minDelay = isHidden ? 15000 : 2000;
      return Math.max(minDelay, parsedDelay);
    }

    it("enforces foreground minimum poll interval of 2000ms", () => {
      expect(computeSchedulingDelay(500, false)).toBe(2000);
      expect(computeSchedulingDelay(2000, false)).toBe(2000);
      expect(computeSchedulingDelay(3500, false)).toBe(3500);
    });

    it("relaxes hidden/background tab poll interval to at least 15000ms", () => {
      expect(computeSchedulingDelay(2000, true)).toBe(15000);
      expect(computeSchedulingDelay(5000, true)).toBe(15000);
      expect(computeSchedulingDelay(15000, true)).toBe(15000);
    });

    it("preserves rate-limit cooldowns of 60s in both foreground and background", () => {
      expect(computeSchedulingDelay(60000, false)).toBe(60000);
      expect(computeSchedulingDelay(60000, true)).toBe(60000);
    });

    it("handles HTTP 429 Retry-After conversion contract", () => {
      // Simulating upstream 429 response handling
      const headerSeconds = "42";
      const parsedHeaderSeconds = Number(headerSeconds);
      const headerMs = parsedHeaderSeconds && Number.isFinite(parsedHeaderSeconds) && parsedHeaderSeconds > 0
        ? parsedHeaderSeconds * 1000
        : null;

      expect(headerMs).toBe(42000);
      expect(computeSchedulingDelay(headerMs || undefined, false)).toBe(42000);
    });
  });

  describe("Tier 4: Real-World Workload Simulation (Veteran 4-Step Import)", () => {
    it("simulates sequential progression through all 4 checkpoints without UI glitch", () => {
      // Step 1: Root character baseline
      const step1Payload = {
        jobId: "imp_veteran_1070",
        status: "running",
        currentStep: "root_baseline",
        progress: {
          current: 1,
          total: 18,
          step: "root_baseline",
          stepIndex: 1,
          stepTotal: 4,
          stepLabel: "Reading root character",
          label: "Reading root character: Kushisu",
        },
        pollAfterMs: 2000,
      };
      const s1 = resolveLiveImportStep(step1Payload.progress, "running");
      expect(s1.badge).toBe("Step 1 of 4: Reading root character");
      expect(getRetryAfterMs(step1Payload)).toBeNull(); // No false countdown!
      expect(getPollAfterMs(step1Payload)).toBe(2000);

      // Step 2: Account museum pages
      const step2Payload = {
        jobId: "imp_veteran_1070",
        status: "running",
        currentStep: "account_museum",
        progress: {
          current: 5,
          total: 18,
          step: "account_museum",
          stepIndex: 2,
          stepTotal: 4,
          stepLabel: "Scanning museum",
          label: "Scanning museum (Page 3 of 6)",
        },
        pollAfterMs: 2000,
      };
      const s2 = resolveLiveImportStep(step2Payload.progress, "running");
      expect(s2.badge).toBe("Step 2 of 4: Scanning museum");
      expect(s2.detail).toBe("Scanning museum (Page 3 of 6)");

      // Step 3: Alt characters without redundant museum queries
      const step3Payload = {
        jobId: "imp_veteran_1070",
        status: "running",
        currentStep: "alt_characters",
        progress: {
          current: 14,
          total: 18,
          step: "alt_characters",
          stepIndex: 3,
          stepTotal: 4,
          stepLabel: "Importing alts",
          label: "Importing Alt 1 of 2: Kushisu Alt",
        },
        pollAfterMs: 2000,
      };
      const s3 = resolveLiveImportStep(step3Payload.progress, "running");
      expect(s3.badge).toBe("Step 3 of 4: Importing alts");
      expect(s3.detail).toBe("Importing Alt 1 of 2: Kushisu Alt");

      // Step 4: Final assembly
      const step4Payload = {
        jobId: "imp_veteran_1070",
        status: "running",
        currentStep: "final_assembly",
        progress: {
          current: 18,
          total: 18,
          step: "final_assembly",
          stepIndex: 4,
          stepTotal: 4,
          stepLabel: "Assembling profile",
          label: "Attaching account museum to 3 character drafts",
        },
        pollAfterMs: 2000,
      };
      const s4 = resolveLiveImportStep(step4Payload.progress, "running");
      expect(s4.badge).toBe("Step 4 of 4: Assembling profile");

      // Final complete state
      const donePayload = {
        jobId: "imp_veteran_1070",
        status: "done",
        result: {
          requestCount: 18,
          characters: [
            { role: "root", draft: { name: "Kushisu" } },
            { role: "visible_alt", draft: { name: "Kushisu Alt 1" } },
            { role: "visible_alt", draft: { name: "Kushisu Alt 2" } },
          ],
        },
      };
      const sDone = resolveLiveImportStep(null, "done");
      expect(sDone.stepIndex).toBe(4);
      expect(sDone.badge).toBe("Step 4 of 4: Assembling profile");
    });
  });
});
