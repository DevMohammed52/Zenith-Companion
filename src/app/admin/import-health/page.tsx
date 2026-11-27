"use client";

import { BackToTop, Banner, Skeleton, SkeletonContainer } from "@/components/ui";
import { useImportHealthState } from "./hooks/useImportHealthState";
import { CommandHeader } from "./components/CommandHeader";
import { LiveEngineTab } from "./components/LiveEngineTab";
import { ImportPipelineTab } from "./components/ImportPipelineTab";
import { TrafficAudienceTab } from "./components/TrafficAudienceTab";
import { ErrorsWebVitalsTab } from "./components/ErrorsWebVitalsTab";
import { DatabaseInfraTab } from "./components/DatabaseInfraTab";
import { AdminConfirmModal, JobInspectorModal } from "./components/AdminConfirmModal";
import { formatDate } from "./types";
import styles from "./AdminDashboard.module.css";

export default function ImportHealthPage() {
  const state = useImportHealthState();
  const { health, importFrame, usageFrame } = state;

  return (
    <main className={styles.page} aria-label="Import Health and Operations Console">
      <CommandHeader
        health={health}
        loading={state.loading}
        actionBusy={state.actionBusy}
        cacheHeader={state.cacheHeader}
        selectedFrame={state.selectedFrame}
        onSelectFrame={state.setSelectedFrame}
        activeTab={state.activeTab}
        onSelectTab={state.setActiveTab}
        autoRefreshSec={state.autoRefreshSec}
        countdownSec={state.countdownSec}
        isTabHidden={state.isTabHidden}
        onChangeAutoRefresh={state.handleChangeAutoRefresh}
        onRefreshNow={state.handleRefreshNow}
        onRunQueue={() => state.requestAction({ action: "process_queue" }, "process_queue")}
        onCopySummary={() => void state.copyMarkdownSummary()}
        onDownloadJson={state.downloadSnapshotJson}
      />

      {state.error ? (
        <Banner
          variant="error"
          title="Operations telemetry issue"
          action={{ label: "Retry", onClick: () => state.handleRefreshNow() }}
          onDismiss={() => state.setError("")}
        >
          {state.error}
        </Banner>
      ) : null}

      <div className={styles.workspaceStage}>
        {state.isInitialLoading ? (
          <SkeletonContainer busy={true} className={styles.skeletonList}>
            <Skeleton height={86} />
            <div className={styles.grid2}>
              <Skeleton height={300} />
              <Skeleton height={300} />
            </div>
            <Skeleton height={280} />
          </SkeletonContainer>
        ) : null}

        {health && importFrame && usageFrame ? (
          <>
            {state.activeTab === "engine" ? (
              <LiveEngineTab
                health={health}
                actionBusy={state.actionBusy}
                onExecuteAction={state.requestAction}
                onInspectJob={state.setInspectedJob}
                onCopied={(val, lbl) => void state.copyValue(val, lbl)}
              />
            ) : null}

            {state.activeTab === "imports" ? (
              <ImportPipelineTab
                health={health}
                importFrame={importFrame}
                selectedFrame={state.selectedFrame}
                selectedLabel={state.selectedLabel}
              />
            ) : null}

            {state.activeTab === "traffic" ? (
              <TrafficAudienceTab
                health={health}
                usageFrame={usageFrame}
                selectedFrame={state.selectedFrame}
                selectedLabel={state.selectedLabel}
              />
            ) : null}

            {state.activeTab === "vitals" ? (
              <ErrorsWebVitalsTab
                health={health}
                onCopied={(val, lbl) => void state.copyValue(val, lbl)}
              />
            ) : null}

            {state.activeTab === "database" ? <DatabaseInfraTab health={health} /> : null}

            <footer className={styles.footnoteStrip}>
              <div className={styles.footnoteGroup}>
                <span>
                  Worker <strong>{health.service.worker}</strong>
                </span>
                <span className={styles.hairlineV} aria-hidden="true" />
                <span>
                  Budget <strong>{health.minuteUsage.budgetMode}</strong> (
                  {health.minuteUsage.usedRequests}/{health.minuteUsage.limit} req/min)
                </span>
              </div>
              <div className={styles.footnoteGroup}>
                <span>
                  Window <strong>{state.selectedLabel}</strong>
                </span>
                <span className={styles.hairlineV} aria-hidden="true" />
                <span>Generated {formatDate(health.generatedAt)}</span>
              </div>
            </footer>
          </>
        ) : null}
      </div>

      <AdminConfirmModal
        pendingAction={state.pendingAction}
        busy={Boolean(state.actionBusy)}
        onClose={() => state.setPendingAction(null)}
        onConfirm={() => void state.confirmPendingAction()}
      />

      <JobInspectorModal
        job={state.inspectedJob}
        onClose={() => state.setInspectedJob(null)}
        onCancelJob={(job) => state.requestAction({ action: "cancel_job", jobId: job.id }, `cancel_job:${job.id}`)}
        onCopied={(val, lbl) => void state.copyValue(val, lbl)}
      />

      <BackToTop />
    </main>
  );
}
