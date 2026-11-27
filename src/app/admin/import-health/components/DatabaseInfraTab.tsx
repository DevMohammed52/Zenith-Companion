"use client";

import { useState } from "react";
import {
  Badge,
  ProgressBar,
  SegmentedControl,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui";
import {
  D1_RETENTION_POLICIES,
  formatNumber,
  formatPercent,
  type ImportHealth,
} from "../types";
import { KpiStrip, Panel } from "./DashboardPrimitives";
import styles from "../AdminDashboard.module.css";

type CategoryFilter = "All" | "Telemetry" | "Import Engine" | "Rate Limiting";

export function DatabaseInfraTab({ health }: { health: ImportHealth }) {
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("All");
  const { databaseStats, service } = health;

  const tableRows = D1_RETENTION_POLICIES.map((policy) => ({
    ...policy,
    count: Number(databaseStats[policy.table] || 0),
  }));

  const filteredRows =
    categoryFilter === "All"
      ? tableRows
      : tableRows.filter((row) => row.category === categoryFilter);

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
      <KpiStrip
        ariaLabel="Cloudflare D1 database inventory"
        items={[
          {
            label: "Total D1 Rows",
            value: formatNumber(totalRows),
            sublabel: "Across all 8 tables",
            icon: "database",
          },
          {
            label: "Telemetry Rows",
            value: formatNumber(telemetryRows),
            sublabel: "usage, visitors, vitals, errors",
            icon: "archiveLayers",
          },
          {
            label: "Import Engine Rows",
            value: formatNumber(importEngineRows),
            sublabel: `${formatNumber(databaseStats.import_events)} events | ${formatNumber(databaseStats.import_jobs)} jobs`,
            icon: "hardDrive",
          },
          {
            label: "Rate-Limit Store",
            value: formatNumber(rateLimitRows),
            sublabel: service.rateLimitStore || "d1-minute-budgets",
            icon: "defense",
          },
        ]}
      />

      <Panel
        icon="database"
        title="D1 Table Row Inventory"
        subtitle="Relative row share across all 8 Cloudflare D1 tables (keeps growth visible within free-tier storage)"
      >
        <div className={styles.grid4}>
          {tableRows.map((row) => {
            const shareOfTotal = totalRows > 0 ? Math.round((row.count / totalRows) * 1000) / 10 : 0;
            return (
              <div key={row.table} className={styles.vitalTile}>
                <div className={styles.vitalTop}>
                  <span className={styles.vitalName}>{row.label}</span>
                  <Badge variant="neutral" size="sm">
                    {row.category}
                  </Badge>
                </div>

                <div>
                  <div className={styles.vitalBig}>{formatNumber(row.count)}</div>
                  <div className={styles.vitalSub}>rows stored</div>
                </div>

                <ProgressBar
                  value={row.count}
                  min={0}
                  max={maxTableCount}
                  size="sm"
                  valueText={`Share ${formatPercent(shareOfTotal)}`}
                  ariaLabel={`${row.label} D1 storage share`}
                />
              </div>
            );
          })}
        </div>
      </Panel>

      <Panel
        icon="hardDrive"
        title="Storage &amp; Retention Policy Matrix"
        subtitle="Operational role, TTL window, and automated cron cleanup per table"
        action={
          <SegmentedControl
            ariaLabel="Filter tables by subsystem"
            size="sm"
            options={[
              { value: "All", label: "All" },
              { value: "Telemetry", label: "Telemetry" },
              { value: "Import Engine", label: "Import Engine" },
              { value: "Rate Limiting", label: "Rate Limiting" },
            ]}
            value={categoryFilter}
            onChange={(val) => setCategoryFilter(val as CategoryFilter)}
          />
        }
      >
        <TableContainer>
          <Table density="compact" aria-label="D1 table retention policies">
            <TableHeader>
              <TableRow>
                <TableHead>Table</TableHead>
                <TableHead>Subsystem</TableHead>
                <TableHead align="right">Rows</TableHead>
                <TableHead>Operational Role</TableHead>
                <TableHead>TTL / Retention</TableHead>
                <TableHead>Cleanup Mechanism</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRows.map((row) => (
                <TableRow key={row.table}>
                  <TableCell className={styles.mono}>
                    <strong>{row.label}</strong>
                  </TableCell>
                  <TableCell>
                    <Badge variant="neutral" size="sm">
                      {row.category}
                    </Badge>
                  </TableCell>
                  <TableCell align="right" className={styles.mono}>
                    {formatNumber(row.count)}
                  </TableCell>
                  <TableCell>{row.role}</TableCell>
                  <TableCell className={styles.mono}>{row.ttlPolicy}</TableCell>
                  <TableCell>{row.cleanupMechanism}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Panel>
    </div>
  );
}
