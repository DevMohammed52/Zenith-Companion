"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useToast } from "@/components/ui";
import {
  TIMEFRAME_ORDER,
  buildMarkdownHealthReport,
  findFrame,
  normalizeHealth,
  type AdminActionRequest,
  type AdminTabKey,
  type AutoRefreshSeconds,
  type ImportHealth,
  type RecentJobRow,
  type TimeframeKey,
} from "../types";

const VALID_TABS = new Set<AdminTabKey>(["engine", "imports", "traffic", "vitals", "database"]);
const VALID_FRAMES = new Set<TimeframeKey>(TIMEFRAME_ORDER);

export interface PendingAdminAction {
  payload: AdminActionRequest;
  busyKey: string;
  title: string;
  description: string;
  confirmLabel: string;
  destructive: boolean;
}

function describeActionForConfirmation(payload: AdminActionRequest): Omit<PendingAdminAction, "payload" | "busyKey"> {
  switch (payload.action) {
    case "process_queue":
      return {
        title: "Process Next Queue Job",
        description: "Immediately triggers the worker to pick up the oldest queued import job within the current API budget.",
        confirmLabel: "Run Queue",
        destructive: false,
      };
    case "clear_coordinator":
      return {
        title: payload.source ? `Force Unlock ${payload.source}` : "Force Unlock All Scrapers",
        description: payload.source
          ? `Marks ${payload.source} as idle so user profile imports resume at 35 req/min. Only unlock if the GitHub Actions run has exited or hung.`
          : "Resets all GitHub Actions coordinator locks to idle (35 req/min). Only force unlock if no scheduled scraper is actively calling IdleMMO.",
        confirmLabel: "Force Unlock",
        destructive: true,
      };
    case "cancel_job":
      return {
        title: "Cancel Import Job",
        description: `Marks job ${payload.jobId} as failed with cancelled_by_admin and records an audit transition in D1.`,
        confirmLabel: "Cancel Job",
        destructive: true,
      };
    case "clear_cooldown":
      return {
        title: "Clear Rate-Limit Cooldown",
        description: `Removes active ${payload.scope} cooldown lock for fingerprint ${payload.keyFingerprint}.`,
        confirmLabel: "Unblock Cooldown",
        destructive: true,
      };
  }
}

export function useImportHealthState() {
  const { toast } = useToast();

  const [health, setHealth] = useState<ImportHealth | null>(null);
  const [selectedFrame, setSelectedFrameState] = useState<TimeframeKey>("24h");
  const [activeTab, setActiveTabState] = useState<AdminTabKey>("engine");
  const [autoRefreshSec, setAutoRefreshSec] = useState<AutoRefreshSeconds>(0);
  const [countdownSec, setCountdownSec] = useState<number>(0);
  const [isTabHidden, setIsTabHidden] = useState<boolean>(false);
  const [cacheHeader, setCacheHeader] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [actionBusy, setActionBusy] = useState<string | null>(null);
  const [error, setError] = useState<string>("");
  const [pendingAction, setPendingAction] = useState<PendingAdminAction | null>(null);
  const [inspectedJob, setInspectedJob] = useState<RecentJobRow | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const inFlightRef = useRef(false);
  const remainingRef = useRef<number>(0);

  useEffect(() => {
    inFlightRef.current = loading || Boolean(actionBusy);
  }, [loading, actionBusy]);

  // Read initial ?tab= and ?frame= after hydration to avoid SSR mismatch
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get("tab") as AdminTabKey | null;
    const frameParam = params.get("frame") as TimeframeKey | null;
    if (tabParam && VALID_TABS.has(tabParam)) {
      setActiveTabState(tabParam);
    }
    if (frameParam && VALID_FRAMES.has(frameParam)) {
      setSelectedFrameState(frameParam);
    }
  }, []);

  const syncUrlParams = useCallback((nextTab: AdminTabKey, nextFrame: TimeframeKey) => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    url.searchParams.set("tab", nextTab);
    url.searchParams.set("frame", nextFrame);
    window.history.replaceState(window.history.state, "", url.toString());
  }, []);

  const setActiveTab = useCallback(
    (tab: AdminTabKey) => {
      setActiveTabState(tab);
      syncUrlParams(tab, selectedFrame);
    },
    [selectedFrame, syncUrlParams],
  );

  const setSelectedFrame = useCallback(
    (frame: TimeframeKey) => {
      setSelectedFrameState(frame);
      syncUrlParams(activeTab, frame);
    },
    [activeTab, syncUrlParams],
  );

  const loadHealth = useCallback(async (fresh = false) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError("");
    try {
      const url = fresh ? "/api/admin/import-health?fresh=true" : "/api/admin/import-health";
      const response = await fetch(url, {
        cache: "no-store",
        credentials: "same-origin",
        signal: controller.signal,
      });
      const headerVal = response.headers.get("x-admin-cache") || (fresh ? "BYPASS" : "LIVE");
      setCacheHeader(headerVal);

      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body?.error?.message || "Could not load import health telemetry.");
      }
      setHealth(normalizeHealth(body));
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return;
      }
      setError(err instanceof Error ? err.message : "Could not load import health telemetry.");
    } finally {
      if (abortRef.current === controller) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadHealth(false);
    return () => {
      abortRef.current?.abort();
    };
  }, [loadHealth]);

  // Track tab visibility so backgrounded console tabs do not burn Cloudflare Worker budget
  useEffect(() => {
    if (typeof document === "undefined") return;
    const handleVisibility = () => {
      const hidden = document.visibilityState === "hidden";
      setIsTabHidden(hidden);
      if (!hidden && autoRefreshSec > 0 && !inFlightRef.current) {
        remainingRef.current = autoRefreshSec;
        setCountdownSec(autoRefreshSec);
        void loadHealth(false);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [autoRefreshSec, loadHealth]);

  useEffect(() => {
    if (autoRefreshSec <= 0) {
      remainingRef.current = 0;
      return;
    }
    remainingRef.current = autoRefreshSec;
    const timer = window.setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") {
        return;
      }
      if (remainingRef.current <= 1) {
        remainingRef.current = autoRefreshSec;
        setCountdownSec(autoRefreshSec);
        if (!inFlightRef.current) {
          void loadHealth(false);
        }
      } else {
        remainingRef.current -= 1;
        setCountdownSec(remainingRef.current);
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [autoRefreshSec, loadHealth]);

  const executeActionNow = useCallback(
    async (payload: AdminActionRequest, busyKey: string) => {
      setActionBusy(busyKey);
      setError("");
      try {
        const response = await fetch("/api/admin/import-health", {
          method: "POST",
          credentials: "same-origin",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify(payload),
          cache: "no-store",
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(body?.error?.message || `Action "${payload.action}" failed.`);
        }
        toast.success(body?.message || `Action "${payload.action}" completed.`);
        setInspectedJob(null);
        await loadHealth(true);
        if (autoRefreshSec > 0) {
          remainingRef.current = autoRefreshSec;
          setCountdownSec(autoRefreshSec);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Could not execute admin action.";
        setError(msg);
        toast.error(msg);
      } finally {
        setActionBusy(null);
      }
    },
    [autoRefreshSec, loadHealth, toast],
  );

  const requestAction = useCallback(
    (payload: AdminActionRequest, busyKey: string) => {
      if (payload.action === "process_queue") {
        void executeActionNow(payload, busyKey);
        return;
      }
      const meta = describeActionForConfirmation(payload);
      setPendingAction({
        payload,
        busyKey,
        ...meta,
      });
    },
    [executeActionNow],
  );

  const confirmPendingAction = useCallback(async () => {
    if (!pendingAction) return;
    const actionToRun = pendingAction;
    setPendingAction(null);
    await executeActionNow(actionToRun.payload, actionToRun.busyKey);
  }, [executeActionNow, pendingAction]);

  const handleChangeAutoRefresh = useCallback((sec: AutoRefreshSeconds) => {
    remainingRef.current = sec;
    setAutoRefreshSec(sec);
    setCountdownSec(sec);
  }, []);

  const handleRefreshNow = useCallback(() => {
    if (autoRefreshSec > 0) {
      remainingRef.current = autoRefreshSec;
      setCountdownSec(autoRefreshSec);
    }
    void loadHealth(true);
  }, [autoRefreshSec, loadHealth]);

  const copyValue = useCallback(
    async (value: string, label = "Value") => {
      if (!value) return;
      try {
        await navigator.clipboard.writeText(value);
        toast.success(`Copied ${label} to clipboard.`);
      } catch {
        toast.error("Clipboard permission unavailable.");
      }
    },
    [toast],
  );

  const copyMarkdownSummary = useCallback(async () => {
    if (!health) return;
    const report = buildMarkdownHealthReport(health, selectedFrame);
    await copyValue(report, "Markdown health summary");
  }, [copyValue, health, selectedFrame]);

  const downloadSnapshotJson = useCallback(() => {
    if (!health || typeof window === "undefined") return;
    const blob = new Blob([JSON.stringify(health, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `zenith-import-health-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    toast.success("Downloaded telemetry JSON snapshot.");
  }, [health, toast]);

  const importFrame = health
    ? findFrame(health.imports.timeframes, selectedFrame) || health.imports.timeframes[0]
    : undefined;
  const usageFrame = health
    ? findFrame(health.usage.timeframes, selectedFrame) || health.usage.timeframes[0]
    : undefined;
  const selectedLabel = importFrame?.label || usageFrame?.label || selectedFrame;
  const isInitialLoading = loading && !health && !error;

  return {
    health,
    selectedFrame,
    setSelectedFrame,
    activeTab,
    setActiveTab,
    autoRefreshSec,
    countdownSec,
    isTabHidden,
    cacheHeader,
    loading,
    isInitialLoading,
    actionBusy,
    error,
    setError,
    pendingAction,
    setPendingAction,
    confirmPendingAction,
    inspectedJob,
    setInspectedJob,
    importFrame,
    usageFrame,
    selectedLabel,
    handleChangeAutoRefresh,
    handleRefreshNow,
    loadHealth,
    requestAction,
    copyValue,
    copyMarkdownSummary,
    downloadSnapshotJson,
  };
}

export type UseImportHealthStateResult = ReturnType<typeof useImportHealthState>;
