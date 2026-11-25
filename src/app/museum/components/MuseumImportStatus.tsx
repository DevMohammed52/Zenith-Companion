"use client";

import { Banner } from "@/components/ui/Banner";
import { ModalSheet } from "@/components/ui/ModalSheet";
import type { ProfileMuseumSnapshot } from "@/lib/museum";
import {
  formatDateTime,
  formatNumber,
  formatPageList,
  museumStatusLabel,
} from "../utils/museum-helpers";
import styles from "../page.module.css";

export function MuseumImportStatus({
  museum,
  sourceTail,
  coverageText,
  itemsCount,
  expectedItemCount,
  hasCountMismatch,
  readableWarnings,
  uniqueWarnings,
  isOpen,
  onClose,
}: {
  museum: ProfileMuseumSnapshot | undefined;
  sourceTail: string | undefined;
  coverageText: string;
  itemsCount: number;
  expectedItemCount: number;
  hasCountMismatch: boolean;
  readableWarnings: string[];
  uniqueWarnings: string[];
  isOpen: boolean;
  onClose: () => void;
}) {
  const showWarningBanner = Boolean(
    museum?.errorMessage || uniqueWarnings.length > 0 || hasCountMismatch,
  );

  const warningParts = [
    museum?.errorMessage,
    hasCountMismatch
      ? `${formatNumber(itemsCount)} saved entries vs ${formatNumber(expectedItemCount)} expected from import metadata.`
      : null,
    readableWarnings.length > 0 ? readableWarnings.slice(0, 2).join(" / ") : null,
  ].filter(Boolean);

  return (
    <>
      {showWarningBanner && (
        <Banner
          variant="warning"
          title="Partial museum import notice"
        >
          {warningParts.join(" ")}
        </Banner>
      )}

      <ModalSheet
        isOpen={isOpen}
        onClose={onClose}
        title="Museum Snapshot Info"
        description="Sync coverage and profile source details for this browser-saved collection."
        maxWidth="sm"
      >
        <div className={styles.snapshotDetailsList}>
          <div className={styles.snapshotDetailRow}>
            <span>Status</span>
            <strong>{museumStatusLabel(museum?.status)}</strong>
          </div>
          <div className={styles.snapshotDetailRow}>
            <span>Imported</span>
            <strong>{formatDateTime(museum?.importedAt)}</strong>
          </div>
          <div className={styles.snapshotDetailRow}>
            <span>Game endpoint update</span>
            <strong>{formatDateTime(museum?.endpointUpdatedAt)}</strong>
          </div>
          <div className={styles.snapshotDetailRow}>
            <span>Character hash tail</span>
            <strong>{sourceTail ? `...${sourceTail}` : "Waiting for import"}</strong>
          </div>
          <div className={styles.snapshotDetailRow}>
            <span>Pages saved</span>
            <strong>{coverageText}</strong>
          </div>
          <div className={styles.snapshotDetailRow}>
            <span>Pages skipped</span>
            <strong>{formatPageList(museum?.pagination?.failedPages)}</strong>
          </div>
          {uniqueWarnings.length > 0 && (
            <div className={styles.snapshotDetailRow}>
              <span>Warnings</span>
              <strong>{uniqueWarnings.join(" / ")}</strong>
            </div>
          )}
        </div>
      </ModalSheet>
    </>
  );
}
