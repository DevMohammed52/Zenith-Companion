"use client";

import Link from "next/link";
import { Badge, Card, Icon } from "@/components/ui";
import { formatPatchDate, type PatchNotesPayload } from "../types";
import styles from "../PatchNotes.module.css";

type PatchNotesHeaderProps = {
  meta: PatchNotesPayload["meta"] | null;
  totalCount: number;
};

export function PatchNotesHeader({ meta, totalCount }: PatchNotesHeaderProps) {
  const latestVersion = meta?.latestVersion || "0.00.0";
  const oldestVersion = meta?.oldestVersion || "0.0.0";
  const updatedLabel = meta?.generatedAt ? formatPatchDate(meta.generatedAt, null) : "Syncing";

  return (
    <Card padding="lg" className={styles.headerCard}>
      <div className={styles.headerTop}>
        <div className={styles.titleArea}>
          <div className={styles.headerMeta}>
            <Badge
              variant="neutral"
              size="md"
              icon={<Icon name="scroll" size="xs" aria-hidden="true" />}
            >
              Latest game version: {latestVersion}
            </Badge>
            <span className={styles.metaSummary}>
              {totalCount > 0 ? `${totalCount} patch notes` : "Loading archive..."} • Since {oldestVersion} • Synced{" "}
              {updatedLabel}
            </span>
          </div>
          <h1 id="patch-notes-page-title" className={styles.title}>
            IdleMMO Patch Notes
          </h1>
          <p className={styles.subtitle}>
            Official IdleMMO release notes indexed by version, mechanic, and date. Zenith Companion app
            updates live in{" "}
            <Link href="/whats-new" className={styles.inlineLink}>
              What&apos;s New
            </Link>
            .
          </p>
        </div>
      </div>
    </Card>
  );
}
