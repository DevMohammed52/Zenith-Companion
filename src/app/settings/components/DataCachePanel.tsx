"use client";

import { Card, Icon } from "@/components/ui";
import { formatAge, type UseSettingsStateReturn } from "../types";
import OfflineStoragePanel from "./OfflineStoragePanel";
import styles from "../Settings.module.css";

export default function DataCachePanel({
  state,
}: {
  state: Pick<
    UseSettingsStateReturn,
    "marketItemCount" | "marketMeta" | "itemCount" | "entityCount"
  >;
}) {
  const { marketItemCount, marketMeta, itemCount, entityCount } = state;

  return (
    <Card
      className={`settings-panel settings-panel-wide ${styles.fullWidth}`}
      title={
        <h2 className={styles.cardTitle}>
          <Icon name="database" size={18} className={styles.headerAccentIcon} />
          Data Cache & Storage
        </h2>
      }
      subtitle={
        <p className={styles.cardSubtitle}>
          Local cached databases and service worker storage for offline capability and instant calculator lookups.
        </p>
      }
    >
      <div className={`settings-summary-grid ${styles.storageMetricsGrid}`}>
        <div className={`settings-summary-card ${styles.storageMetricCard}`}>
          <span className={styles.storageMetricLabel}>Market Cache</span>
          <strong className={styles.storageMetricValue}>
            {marketItemCount.toLocaleString()} items
          </strong>
          <small className={styles.storageMetricSub}>
            {formatAge(marketMeta?.last_updated)}
          </small>
        </div>

        <div className={`settings-summary-card ${styles.storageMetricCard}`}>
          <span className={styles.storageMetricLabel}>Item Database</span>
          <strong className={styles.storageMetricValue}>
            {itemCount.toLocaleString()} items
          </strong>
          <small className={styles.storageMetricSub}>Local static dataset</small>
        </div>

        <div className={`settings-summary-card ${styles.storageMetricCard}`}>
          <span className={styles.storageMetricLabel}>Game Entities</span>
          <strong className={styles.storageMetricValue}>
            {entityCount.toLocaleString()} entities
          </strong>
          <small className={styles.storageMetricSub}>
            Enemies, dungeons, and world bosses
          </small>
        </div>
      </div>

      <OfflineStoragePanel />

      <div className={styles.privacyFooterNote}>
        <Icon name="locked" size={14} className={styles.privacyFooterIcon} />
        <span className={styles.privacyFooterCopy}>
          Local-first privacy: Character profiles, custom item prices, and planner data are stored strictly inside your browser and are never transmitted to external servers.
        </span>
      </div>
    </Card>
  );
}
