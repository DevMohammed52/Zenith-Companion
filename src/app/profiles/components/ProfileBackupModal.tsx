"use client";

import React from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { ModalSheet } from "@/components/ui/ModalSheet";
import { TextArea } from "@/components/ui/TextArea";
import styles from "../Profiles.module.css";

export interface ProfileBackupDetailsProps {
  transferText: string;
  setTransferText: (text: string) => void;
  onExport: () => void;
  onImport: () => void;
}

export function ProfileBackupDetails({
  transferText,
  setTransferText,
  onExport,
  onImport,
}: ProfileBackupDetailsProps) {
  return (
    <details id="profile-backup" className={styles.accordionCard} tabIndex={-1}>
      <summary className={styles.accordionSummary}>
        <span className={styles.accordionTitleGroup}>
          <strong>Backup or restore local profiles</strong>
          <span>Click to export or paste browser profile JSON backups</span>
        </span>
        <span className={styles.accordionCue}>
          <span>JSON transfer</span>
          <Icon name="chevronDown" size="sm" className={styles.accordionChevron} aria-hidden="true" />
        </span>
      </summary>
      <div className={styles.accordionBody}>
        <p className="text-muted" style={{ margin: 0, fontSize: "0.86rem", lineHeight: 1.45 }}>
          Use this to move Zenith profiles between browsers. This stays local and is separate from IdleMMO character sync.
        </p>
        <div className={styles.actionRow}>
          <Button
            variant="secondary"
            size="md"
            icon={<Icon name="download" size="sm" aria-hidden="true" />}
            onClick={onExport}
          >
            Copy backup JSON
          </Button>
          <Button
            variant="secondary"
            size="md"
            icon={<Icon name="upload" size="sm" aria-hidden="true" />}
            onClick={onImport}
          >
            Restore from JSON
          </Button>
        </div>
        <TextArea
          aria-label="Profile backup JSON"
          isDataImport
          minRows={5}
          value={transferText}
          placeholder="Paste a Zenith profile backup JSON here..."
          onChange={(event) => setTransferText(event.target.value)}
        />
      </div>
    </details>
  );
}

export interface ProfileConfirmModalProps {
  confirmDetails: {
    title: string;
    body: string;
    action: string;
    onConfirm: () => void;
  } | null;
  onClose: () => void;
  confirmDialogRef: React.RefObject<HTMLDivElement | null>;
  confirmCancelRef: React.RefObject<HTMLButtonElement | null>;
}

export function ProfileConfirmModal({
  confirmDetails,
  onClose,
  confirmDialogRef,
  cancelRef,
}: {
  confirmDetails: ProfileConfirmModalProps["confirmDetails"];
  onClose: () => void;
  confirmDialogRef: React.RefObject<HTMLDivElement | null>;
  cancelRef: React.RefObject<HTMLButtonElement | null>;
}) {
  return (
    <ModalSheet
      isOpen={Boolean(confirmDetails)}
      onClose={onClose}
      title={confirmDetails?.title || ""}
      maxWidth="sm"
      footer={
        confirmDetails ? (
          <div className={styles.confirmFooter}>
            <Button ref={cancelRef} variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDetails.onConfirm}>
              {confirmDetails.action}
            </Button>
          </div>
        ) : undefined
      }
    >
      <div ref={confirmDialogRef} tabIndex={-1}>
        <p className={styles.confirmBody}>{confirmDetails?.body || ""}</p>
      </div>
    </ModalSheet>
  );
}
