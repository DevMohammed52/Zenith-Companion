"use client";

import { Database, Lock } from "lucide-react";
import { Card } from "@/components/ui/Card";
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
          <Database size={18} style={{ color: "var(--text-accent)" }} />
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

      <div
        style={{
          marginTop: "1.25rem",
          paddingTop: "0.85rem",
          borderTop: "1px solid var(--border-subtle)",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
        }}
      >
        <Lock size={14} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
        <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", lineHeight: 1.45 }}>
          Local-first privacy: Character profiles, custom item prices, and planner data are stored strictly inside your browser and are never transmitted to external servers.
        </span>
      </div>
    </Card>
  );
}
