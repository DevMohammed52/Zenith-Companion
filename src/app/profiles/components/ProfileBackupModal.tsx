"use client";

import React from "react";
import { Download, Upload, X } from "lucide-react";

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
    <details id="profile-backup" className="profile-json-transfer" tabIndex={-1}>
      <summary>Backup or restore local profiles</summary>
      <p>This is only for moving Zenith profiles between browsers. It is separate from IdleMMO character import.</p>
      <div className="profile-inline-actions">
        <button type="button" onClick={onExport}><Download size={15} /> Copy backup JSON</button>
        <button type="button" onClick={onImport}><Upload size={15} /> Restore from JSON</button>
      </div>
      <textarea
        aria-label="Profile backup JSON"
        className="control-input profile-transfer"
        value={transferText}
        placeholder="Paste a Zenith profile backup JSON here..."
        onChange={(event) => setTransferText(event.target.value)}
      />
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
  if (!confirmDetails) return null;

  return (
    <div className="modal-overlay profile-confirm-overlay" role="presentation" onClick={onClose}>
      <div
        className="modal-content profile-confirm-modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="profile-confirm-title"
        aria-describedby="profile-confirm-copy"
        ref={confirmDialogRef}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <h2 id="profile-confirm-title">{confirmDetails.title}</h2>
          <button className="close-btn" type="button" aria-label="Close confirmation" onClick={onClose}>
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <div className="modal-body">
          <p className="profile-confirm-copy" id="profile-confirm-copy">{confirmDetails.body}</p>
          <div className="profile-confirm-actions">
            <button type="button" ref={cancelRef} className="profile-action" onClick={onClose}>Cancel</button>
            <button type="button" className="profile-action danger" onClick={confirmDetails.onConfirm}>{confirmDetails.action}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
