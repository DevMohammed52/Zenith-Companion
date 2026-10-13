"use client";

import { Database, HardDrive, Layers, ShieldCheck } from "lucide-react";
import styles from "../AdminDashboard.module.css";
import {
  D1_RETENTION_POLICIES,
  formatNumber,
  formatPercent,
  type ImportHealth,
} from "../types";
import { MetricCard, Panel } from "./DashboardPrimitives";

export function DatabaseInfraTab({ health }: { health: ImportHealth }) {
  const { databaseStats, service } = health;

  const tableRows = D1_RETENTION_POLICIES.map((policy) => ({
    ...policy,
    count: Number(databaseStats[policy.table] || 0),
  }));

  const totalRows = tableRows.reduce((sum, item) => sum + item.count, 0);
  const maxTableCount = Math.max(1, ...tableRows.map((item) => item.count));

  const telemetryRows =
    databaseStats.usage_events +
    databaseStats.usage_visitors +
    databaseStats.web_vital_events +
    databaseStats.app_error_events;
  const importEngineRows = databaseStats.import_events + databaseStats.import_jobs;
  const rateLimitRows = databaseStats.minute_budgets + databaseStats.cooldowns;

  return (
    <div
      id="tabpanel-database"
      className={styles.tabContent}
      role="tabpanel"
      aria-labelledby="tab-database"
    >
      <div className={styles.grid4}>
        <MetricCard
          icon={Database}
          label="Total D1 Rows"
          value={formatNumber(totalRows)}
          detail="Across all 8 operational tables"
        />
        <MetricCard
          icon={Layers}
          label="Telemetry Rows"
          value={formatNumber(telemetryRows)}
          detail="usage_events, visitors, vitals, errors"
        />
        <MetricCard
          icon={HardDrive}
          label="Import Engine Rows"
          value={formatNumber(importEngineRows)}
          detail={`${formatNumber(databaseStats.import_events)} events · ${formatNumber(databaseStats.import_jobs)} jobs`}
        />
        <MetricCard
          icon={ShieldCheck}
          label="Rate-Limit Store"
          value={formatNumber(rateLimitRows)}
          detail={`Store: ${service.rateLimitStore || "d1-minute-budgets"}`}
        />
      </div>

      <Panel
        icon={Database}
        title="D1 Table Row Count Gauges"
        subtitle="Live row count inventory and relative storage share across all 8 Cloudflare D1 tables"
      >
        <div className={styles.grid8}>
          {tableRows.map((row) => {
            const shareOfTotal = totalRows > 0 ? Math.round((row.count / totalRows) * 1000) / 10 : 0;
            const barWidth = row.count > 0 ? Math.max(3, (row.count / maxTableCount) * 100) : 0;
            return (
              <div key={row.table} className={styles.vitalCard}>
                <div className={styles.vitalTop}>
                  <span className={styles.vitalName}>{row.label}</span>
                  <span className={`${styles.chip} ${styles.toneNeutral}`}>{row.category}</span>
                </div>

                <div>
                  <div className={styles.vitalP75}>{formatNumber(row.count)}</div>
                  <span className={styles.panelSubtitle}>rows stored</span>
                </div>

                <div className={styles.vitalFooter}>
                  <div className={styles.vitalSubRow}>
                    <span>DB Share</span>
                    <span className={styles.mono}>{formatPercent(shareOfTotal)}</span>
                  </div>
                  <div className={styles.shareTrack}>
                    <div className={styles.shareFill} style={{ width: `${barWidth}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Panel>

      <Panel
        icon={HardDrive}
        title="Storage &amp; Retention Policy Matrix"
        subtitle="Operational role, TTL window, and automated cleanup mechanism per D1 table"
      >
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Table Name</th>
                <th>Subsystem</th>
                <th>Live Rows</th>
                <th>Operational Role</th>
                <th>TTL / Retention Policy</th>
                <th>Cleanup Mechanism</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row) => (
                <tr key={row.table}>
                  <td className={styles.mono}>
                    <strong>{row.label}</strong>
                  </td>
                  <td>
                    <span className={`${styles.chip} ${styles.toneNeutral}`}>{row.category}</span>
                  </td>
                  <td className={styles.mono}>{formatNumber(row.count)}</td>
                  <td>{row.role}</td>
                  <td className={styles.mono}>{row.ttlPolicy}</td>
                  <td>{row.cleanupMechanism}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
