"use client";

import { Badge, Button, ModalSheet } from "@/components/ui";
import { Icon } from "@/components/ui/Icon";
import type { PendingAdminAction } from "../hooks/useImportHealthState";
import { formatDate, formatDuration, statusTone, type RecentJobRow } from "../types";
import { CopyButton, toneBadgeVariant } from "./DashboardPrimitives";
import styles from "../AdminDashboard.module.css";

export function AdminConfirmModal({
  pendingAction,
  busy,
  onClose,
  onConfirm,
}: {
  pendingAction: PendingAdminAction | null;
  busy: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <ModalSheet
      isOpen={Boolean(pendingAction)}
      onClose={onClose}
      title={pendingAction?.title || "Confirm Action"}
      maxWidth="sm"
    >
      {pendingAction ? (
        <div className={styles.modalBody}>
          <p className={styles.modalCopy}>{pendingAction.description}</p>
          <div className={styles.modalActions}>
            <Button variant="secondary" size="md" onClick={onClose} disabled={busy}>
              Cancel
            </Button>
            <Button
              variant={pendingAction.destructive ? "danger" : "primary"}
              size="md"
              loading={busy}
              onClick={onConfirm}
            >
              {pendingAction.confirmLabel}
            </Button>
          </div>
        </div>
      ) : null}
    </ModalSheet>
  );
}

export function JobInspectorModal({
  job,
  onClose,
  onCancelJob,
  onCopied,
}: {
  job: RecentJobRow | null;
  onClose: () => void;
  onCancelJob: (job: RecentJobRow) => void;
  onCopied?: (value: string, label: string) => void;
}) {
  const canCancel =
    Boolean(job) &&
    !job?.expired &&
    (job?.status === "queued" ||
      job?.status === "pending" ||
      job?.status === "running" ||
      job?.status === "waiting_for_budget");

  const durationSeconds =
    job && job.createdAt && job.updatedAt
      ? Math.max(
          0,
          Math.round((new Date(job.updatedAt).getTime() - new Date(job.createdAt).getTime()) / 1000),
        )
      : 0;

  return (
    <ModalSheet
      isOpen={Boolean(job)}
      onClose={onClose}
      title="Import Job Forensics"
      maxWidth="md"
    >
      {job ? (
        <div className={styles.modalBody}>
          <div className={styles.jobMetaGrid}>
            <div className={styles.jobMetaItem}>
              <span>Job ID</span>
              <div className={styles.codeCell}>
                <code className={styles.mono}>{job.id}</code>
                <CopyButton value={job.id} label="Copy" onCopied={onCopied} />
              </div>
            </div>

            <div className={styles.jobMetaItem}>
              <span>Status</span>
              <Badge variant={toneBadgeVariant(statusTone(job.status))} size="sm">
                {job.status}
              </Badge>
            </div>

            <div className={styles.jobMetaItem}>
              <span>Target Fingerprint</span>
              <div className={styles.codeCell}>
                <code className={styles.mono}>{job.targetHashFingerprint || "-"}</code>
                {job.targetHashFingerprint ? (
                  <CopyButton value={job.targetHashFingerprint} label="Copy" onCopied={onCopied} />
                ) : null}
              </div>
            </div>

            <div className={styles.jobMetaItem}>
              <span>Requests &amp; Retries</span>
              <strong className={styles.mono}>
                {job.requestCount} requests | {job.retryCount} retries
              </strong>
            </div>

            <div className={styles.jobMetaItem}>
              <span>Budget Mode</span>
              <strong className={styles.mono}>{job.budgetMode}</strong>
            </div>

            <div className={styles.jobMetaItem}>
              <span>Elapsed / TTL</span>
              <strong className={styles.mono}>
                {formatDuration(durationSeconds)} ({job.expired ? "Expired" : `Exp ${formatDate(job.expiresAt)}`})
              </strong>
            </div>

            <div className={styles.jobMetaItem}>
              <span>Created At</span>
              <strong className={styles.mono}>{formatDate(job.createdAt)}</strong>
            </div>

            <div className={styles.jobMetaItem}>
              <span>Last Updated</span>
              <strong className={styles.mono}>{formatDate(job.updatedAt)}</strong>
            </div>
          </div>

          {job.errorCode || job.errorMessage ? (
            <div className={styles.errorDetailBox}>
              <strong>{job.errorCode || "Error"}</strong>
              {job.errorMessage ? <p>{job.errorMessage}</p> : null}
            </div>
          ) : null}

          <div className={styles.modalActions}>
            <Button variant="secondary" size="md" onClick={onClose}>
              Close
            </Button>
            {canCancel ? (
              <Button
                variant="danger"
                size="md"
                icon={<Icon name="ban" size="sm" aria-hidden="true" />}
                onClick={() => onCancelJob(job)}
              >
                Cancel Job
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}
    </ModalSheet>
  );
}
