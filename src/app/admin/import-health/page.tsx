"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, X } from "lucide-react";
import { ErrorState, LoadingState } from "@/components/StateBlock";
import styles from "./AdminDashboard.module.css";
import {
  findFrame,
  formatDate,
  normalizeHealth,
  type AdminActionRequest,
  type AdminTabKey,
  type AutoRefreshSeconds,
  type ImportHealth,
  type TimeframeKey,
} from "./types";
import { CommandHeader } from "./components/CommandHeader";
import { LiveEngineTab } from "./components/LiveEngineTab";
import { ImportPipelineTab } from "./components/ImportPipelineTab";
import { TrafficAudienceTab } from "./components/TrafficAudienceTab";
import { ErrorsWebVitalsTab } from "./components/ErrorsWebVitalsTab";
import { DatabaseInfraTab } from "./components/DatabaseInfraTab";

export default function ImportHealthPage() {
  const [health, setHealth] = useState<ImportHealth | null>(null);
  const [selectedFrame, setSelectedFrame] = useState<TimeframeKey>("24h");
  const [activeTab, setActiveTab] = useState<AdminTabKey>("engine");
  const [autoRefreshSec, setAutoRefreshSec] = useState<AutoRefreshSeconds>(0);
  const [countdownSec, setCountdownSec] = useState<number>(0);
  const [cacheHeader, setCacheHeader] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [actionBusy, setActionBusy] = useState<string | null>(null);
  const [error, setError] = useState<string>("");
  const [actionFeedback, setActionFeedback] = useState<string>("");

  const inFlightRef = useRef(false);
  useEffect(() => {
    inFlightRef.current = loading || Boolean(actionBusy);
  }, [loading, actionBusy]);

  const loadHealth = useCallback(async (fresh = false) => {
    setLoading(true);
    setError("");
    try {
      const url = fresh ? "/api/admin/import-health?fresh=true" : "/api/admin/import-health";
      const response = await fetch(url, {
        cache: "no-store",
        credentials: "same-origin",
      });
      const headerVal = response.headers.get("x-admin-cache") || (fresh ? "BYPASS" : "LIVE");
      setCacheHeader(headerVal);

      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body?.error?.message || "Could not load import health telemetry.");
      }
      setHealth(normalizeHealth(body));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load import health telemetry.");
    } finally {
      setLoading(false);
    }
  }, []);

  const remainingRef = useRef<number>(0);

  useEffect(() => {
    void loadHealth(false);
  }, [loadHealth]);

  useEffect(() => {
    if (autoRefreshSec <= 0) {
      remainingRef.current = 0;
      return;
    }
    remainingRef.current = autoRefreshSec;
    const timer = window.setInterval(() => {
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

  async function executeAction(payload: AdminActionRequest, busyKey: string) {
    setActionBusy(busyKey);
    setError("");
    setActionFeedback("");
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
      setActionFeedback(body?.message || `Action "${payload.action}" executed.`);
      await loadHealth(true);
      if (autoRefreshSec > 0) {
        remainingRef.current = autoRefreshSec;
        setCountdownSec(autoRefreshSec);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not execute admin action.");
    } finally {
      setActionBusy(null);
    }
  }

  function handleChangeAutoRefresh(sec: AutoRefreshSeconds) {
    remainingRef.current = sec;
    setAutoRefreshSec(sec);
    setCountdownSec(sec);
  }

  function handleRefreshNow() {
    if (autoRefreshSec > 0) {
      remainingRef.current = autoRefreshSec;
      setCountdownSec(autoRefreshSec);
    }
    void loadHealth(true);
  }

  const importFrame = health
    ? findFrame(health.imports.timeframes, selectedFrame) || health.imports.timeframes[0]
    : undefined;
  const usageFrame = health
    ? findFrame(health.usage.timeframes, selectedFrame) || health.usage.timeframes[0]
    : undefined;
  const selectedLabel = importFrame?.label || usageFrame?.label || selectedFrame;
  const isInitialLoading = loading && !health && !error;

  return (
    <main className={styles.page}>
      <CommandHeader
        health={health}
        loading={loading}
        actionBusy={actionBusy}
        cacheHeader={cacheHeader}
        selectedFrame={selectedFrame}
        onSelectFrame={setSelectedFrame}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        autoRefreshSec={autoRefreshSec}
        countdownSec={countdownSec}
        onChangeAutoRefresh={handleChangeAutoRefresh}
        onRefreshNow={handleRefreshNow}
        onRunQueue={() => void executeAction({ action: "process_queue" }, "process_queue")}
      />

      {error ? (
        <div className={`${styles.alertBanner} ${styles.toneBad}`} role="alert">
          <div className={styles.alertContent}>
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnCompact}`}
            onClick={() => setError("")}
            aria-label="Dismiss error alert"
          >
            <X size={15} />
            <span>Dismiss</span>
          </button>
        </div>
      ) : null}

      {actionFeedback ? (
        <div className={`${styles.alertBanner} ${styles.toneGood}`} role="status">
          <div className={styles.alertContent}>
            <CheckCircle2 size={18} />
            <span>{actionFeedback}</span>
          </div>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnCompact}`}
            onClick={() => setActionFeedback("")}
            aria-label="Dismiss status message"
          >
            <X size={15} />
            <span>Dismiss</span>
          </button>
        </div>
      ) : null}

      {isInitialLoading ? (
        <LoadingState
          title="Loading operations console"
          description="Fetching worker queue telemetry, rate-limit budgets, and D1 database stats."
        />
      ) : null}

      {!health && !loading && error ? (
        <ErrorState
          compact
          title="Telemetry stream unavailable"
          description={error}
        />
      ) : null}

      {health && importFrame && usageFrame ? (
        <>
          {activeTab === "engine" ? (
            <LiveEngineTab
              health={health}
              actionBusy={actionBusy}
              onExecuteAction={(payload, key) => void executeAction(payload, key)}
            />
          ) : null}

          {activeTab === "imports" ? (
            <ImportPipelineTab
              health={health}
              importFrame={importFrame}
              selectedFrame={selectedFrame}
              selectedLabel={selectedLabel}
            />
          ) : null}

          {activeTab === "traffic" ? (
            <TrafficAudienceTab
              health={health}
              usageFrame={usageFrame}
              selectedFrame={selectedFrame}
              selectedLabel={selectedLabel}
            />
          ) : null}

          {activeTab === "vitals" ? <ErrorsWebVitalsTab health={health} /> : null}

          {activeTab === "database" ? <DatabaseInfraTab health={health} /> : null}

          <footer className={styles.footnote}>
            <span>
              Worker: <strong>{health.service.worker}</strong> · Budget:{" "}
              <strong>{health.minuteUsage.budgetMode}</strong> (
              {health.minuteUsage.usedRequests}/{health.minuteUsage.limit} req/min)
            </span>
            <span>
              Window: <strong>{selectedLabel}</strong> · Generated {formatDate(health.generatedAt)}
            </span>
          </footer>
        </>
      ) : null}
    </main>
  );
}
