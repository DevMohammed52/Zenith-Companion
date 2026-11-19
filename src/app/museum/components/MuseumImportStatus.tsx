import { AlertTriangle, CheckCircle2, Clock3 } from "lucide-react";
import type { useProfiles } from "@/lib/profiles";
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
}: {
  museum: NonNullable<ReturnType<typeof useProfiles>["activeProfile"]>["museum"] | undefined;
  sourceTail: string | undefined;
  coverageText: string;
  itemsCount: number;
  expectedItemCount: number;
  hasCountMismatch: boolean;
  readableWarnings: string[];
  uniqueWarnings: string[];
}) {
  const statusClass =
    museum?.status === "private"
      ? styles.statusPrivate
      : museum?.status === "unavailable"
        ? styles.statusUnavailable
        : museum?.status === "partial"
          ? styles.statusPartial
          : "";

  return (
    <>
      <section className={styles.museumSourceStrip} aria-label="Museum import state">
        <div className={`${styles.museumStatus} ${statusClass}`}>
          <CheckCircle2 size={16} aria-hidden="true" />
          <span>Status</span>
          <strong>{museumStatusLabel(museum?.status)}</strong>
        </div>
        <div>
          <Clock3 size={16} aria-hidden="true" />
          <span>Imported</span>
          <strong>{formatDateTime(museum?.importedAt)}</strong>
        </div>
        <details className={styles.museumImportDetails}>
          <summary>Import details</summary>
          <div>
            <span>Game refresh</span>
            <strong>{formatDateTime(museum?.endpointUpdatedAt)}</strong>
          </div>
          <div>
            <span>Character</span>
            <strong>
              {sourceTail ? `...${sourceTail}` : "Waiting for profile import"}
            </strong>
          </div>
          <div>
            <span>Pages saved</span>
            <strong>{coverageText}</strong>
          </div>
          <div
            className={
              museum?.pagination?.failedPages?.length
                ? `${styles.museumStatus} ${styles.statusPartial}`
                : ""
            }
          >
            <span>Pages skipped</span>
            <strong>{formatPageList(museum?.pagination?.failedPages)}</strong>
          </div>
        </details>
      </section>

      {(museum?.errorMessage || uniqueWarnings.length > 0 || hasCountMismatch) && (
        <section
          className={styles.museumWarningStrip}
          aria-label="Museum import notes"
        >
          <AlertTriangle size={17} aria-hidden="true" />
          <div>
            {museum?.errorMessage && <strong>{museum.errorMessage}</strong>}
            {hasCountMismatch && (
              <strong>
                {formatNumber(itemsCount)} saved items, {formatNumber(expectedItemCount)} expected from import metadata.
              </strong>
            )}
            {readableWarnings.length > 0 && (
              <p>{readableWarnings.slice(0, 2).join(" / ")}</p>
            )}
            {uniqueWarnings.length > 0 && (
              <details className={styles.museumTechnicalDetails}>
                <summary>Technical details</summary>
                <p>{uniqueWarnings.join(" / ")}</p>
              </details>
            )}
          </div>
        </section>
      )}
    </>
  );
}
