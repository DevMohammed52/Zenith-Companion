"use client";

import { useState } from "react";
import {
  Badge,
  ProgressBar,
  SearchInput,
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
  CORE_WEB_VITAL_NAMES,
  deriveVitalRating,
  formatDate,
  formatNumber,
  formatPercent,
  formatVitalValue,
  vitalRatingTone,
  type ImportHealth,
  type WebVitalMetricSummary,
} from "../types";
import { vitalTargetThreshold } from "../utils/health-format";
import {
  CopyButton,
  EmptyBlock,
  KpiStrip,
  Panel,
  ShareBreakdownList,
  toneBadgeVariant,
} from "./DashboardPrimitives";
import styles from "../AdminDashboard.module.css";

type MetricFilter = "ALL" | (typeof CORE_WEB_VITAL_NAMES)[number];

export function ErrorsWebVitalsTab({
  health,
  onCopied,
}: {
  health: ImportHealth;
  onCopied?: (value: string, label: string) => void;
}) {
  const [vitalMetricFilter, setVitalMetricFilter] = useState<MetricFilter>("ALL");
  const [routeSearch, setRouteSearch] = useState("");
  const { webVitals, appErrors } = health;

  const metricByName = new Map<string, WebVitalMetricSummary>();
  for (const m of webVitals.metrics) {
    metricByName.set(m.name.toUpperCase(), m);
  }

  const scorecardMetrics: WebVitalMetricSummary[] = CORE_WEB_VITAL_NAMES.map((name) => {
    const existing = metricByName.get(name);
    if (existing) return existing;
    return {
      name,
      events: 0,
      poor: 0,
      poorRate: 0,
      goodRate: 0,
      avgValue: 0,
      p75Value: 0,
      maxValue: 0,
      rating: deriveVitalRating(name, 0, 0),
    };
  });

  const q = routeSearch.trim().toLowerCase();
  const filteredVitalPaths = webVitals.topPaths.filter((row) => {
    if (vitalMetricFilter !== "ALL" && row.metricName.toUpperCase() !== vitalMetricFilter) {
      return false;
    }
    return !q || row.path.toLowerCase().includes(q);
  });

  const errorRouteItems = appErrors.topPaths.map((route) => ({
    key: route.path,
    label: route.path,
    value: route.events,
    valueText: `${formatNumber(route.events)} errors | ${formatNumber(route.digests)} digests`,
  }));

  const errorBrowserItems = appErrors.browsers.map((b) => ({
    key: b.family,
    label: b.family,
    value: b.events,
    valueText: `${formatNumber(b.events)} errors`,
  }));

  return (
    <div
      id="tabpanel-vitals"
      className={styles.tabContent}
      role="tabpanel"
      aria-labelledby="tab-vitals"
    >
      <Panel
        icon="gauge"
        title="Core Web Vitals Scorecard (30d RUM)"
        subtitle={`${formatNumber(webVitals.events30d)} samples in 30d (${formatNumber(webVitals.events24h)} in 24h) | Poor rate ${formatPercent(webVitals.poorRate30d)}`}
      >
        <div className={styles.grid5}>
          {scorecardMetrics.map((metric) => {
            const tone = metric.events > 0 ? vitalRatingTone(metric.rating) : "neutral";
            const barVariant = tone === "good" ? "success" : tone === "bad" ? "danger" : "default";
            return (
              <div key={metric.name} className={styles.vitalTile}>
                <div className={styles.vitalTop}>
                  <span className={styles.vitalName}>{metric.name}</span>
                  <Badge variant={toneBadgeVariant(tone)} size="sm">
                    {metric.events > 0 ? metric.rating : "no samples"}
                  </Badge>
                </div>

                <div>
                  <div className={styles.vitalBig}>
                    {metric.events > 0 ? formatVitalValue(metric.name, metric.p75Value) : "-"}
                  </div>
                  <div className={styles.vitalSub}>
                    p75 | avg {metric.events > 0 ? formatVitalValue(metric.name, metric.avgValue) : "-"}
                  </div>
                  <div className={styles.vitalSub}>{vitalTargetThreshold(metric.name)}</div>
                </div>

                <ProgressBar
                  value={metric.events > 0 ? metric.goodRate : 0}
                  min={0}
                  max={100}
                  size="sm"
                  variant={barVariant}
                  valueText={`${formatNumber(metric.events)} | ${formatPercent(metric.goodRate)} good`}
                  ariaLabel={`${metric.name} good rate`}
                />
              </div>
            );
          })}
        </div>
      </Panel>

      <Panel
        icon="route"
        title="Routes Needing Attention"
        subtitle="Slowest route and metric combinations ranked by poor RUM sample count (30d)"
      >
        {webVitals.topPaths.length > 0 ? (
          <>
            <div className={styles.filterToolbar}>
              <div className={styles.filterSearch}>
                <SearchInput
                  value={routeSearch}
                  onChange={setRouteSearch}
                  placeholder="Filter slow route..."
                  showShortcutHint={false}
                />
              </div>
              <SegmentedControl
                ariaLabel="Filter by Web Vital metric"
                size="sm"
                options={[
                  { value: "ALL", label: "All" },
                  ...CORE_WEB_VITAL_NAMES.map((m) => ({ value: m, label: m })),
                ]}
                value={vitalMetricFilter}
                onChange={(val) => setVitalMetricFilter(val as MetricFilter)}
              />
            </div>

            {filteredVitalPaths.length > 0 ? (
              <TableContainer>
                <Table density="compact" aria-label="Routes needing Web Vitals attention">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Route Path</TableHead>
                      <TableHead>Metric</TableHead>
                      <TableHead align="right">Global p75</TableHead>
                      <TableHead align="right">Poor Count</TableHead>
                      <TableHead align="right">Samples</TableHead>
                      <TableHead>Poor Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVitalPaths.map((row, idx) => {
                      const metricMeta = metricByName.get(row.metricName.toUpperCase());
                      const p75Val = row.p75Value ?? metricMeta?.p75Value ?? 0;
                      const variant = row.poorRate >= 25 ? "danger" : row.poor > 0 ? "default" : "success";
                      return (
                        <TableRow key={`${row.path}-${row.metricName}-${idx}`}>
                          <TableCell className={styles.mono}>{row.path}</TableCell>
                          <TableCell>
                            <Badge variant="neutral" size="sm">
                              {row.metricName}
                            </Badge>
                          </TableCell>
                          <TableCell align="right" className={styles.mono}>
                            {p75Val > 0 ? formatVitalValue(row.metricName, p75Val) : "-"}
                          </TableCell>
                          <TableCell align="right" className={styles.mono}>
                            {formatNumber(row.poor)}
                          </TableCell>
                          <TableCell align="right" className={styles.mono}>
                            {formatNumber(row.events)}
                          </TableCell>
                          <TableCell>
                            <ProgressBar
                              value={row.poorRate}
                              min={0}
                              max={100}
                              size="sm"
                              variant={variant}
                              valueText={formatPercent(row.poorRate)}
                              ariaLabel={`${row.path} ${row.metricName} poor rate`}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <EmptyBlock text="No slow routes match the current filter." />
            )}
          </>
        ) : (
          <EmptyBlock text="No slow route signals recorded in Web Vitals." />
        )}
      </Panel>

      <Panel
        icon="bug"
        title="Application Errors Explorer"
        subtitle="Client and server error boundary telemetry grouped by digest and route"
      >
        <KpiStrip
          ariaLabel="Application error counts"
          items={[
            {
              label: "24h Errors",
              value: formatNumber(appErrors.events24h),
              sublabel: "Last 24 hours",
              tone: appErrors.events24h > 0 ? "warn" : "good",
              icon: "warning",
            },
            {
              label: "7d Errors",
              value: formatNumber(appErrors.events7d),
              sublabel: "Rolling 7 days",
              tone: appErrors.events7d > 0 ? "warn" : "neutral",
              icon: "cataclysm",
            },
            {
              label: "30d Errors",
              value: formatNumber(appErrors.events30d),
              sublabel: "Rolling 30 days",
              icon: "cataclysm",
            },
            {
              label: "Unique Digests (24h)",
              value: formatNumber(appErrors.uniqueDigests24h),
              sublabel: "Distinct crash signatures",
              tone: appErrors.uniqueDigests24h > 0 ? "warn" : "neutral",
              icon: "bug",
            },
          ]}
        />

        <div className={styles.grid2}>
          <div>
            <h3 className={styles.subSectionTitle}>Top Error Digests (30d)</h3>
            {appErrors.topDigests.length > 0 ? (
              <TableContainer>
                <Table density="compact" aria-label="Top error digests">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Digest</TableHead>
                      <TableHead align="right">Events</TableHead>
                      <TableHead align="right">Routes</TableHead>
                      <TableHead align="right">Last Seen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {appErrors.topDigests.map((item) => (
                      <TableRow key={item.digest}>
                        <TableCell>
                          <div className={styles.codeCell}>
                            <span className={styles.mono}>{item.digest || "no-digest"}</span>
                            {item.digest ? (
                              <CopyButton value={item.digest} label="Copy" onCopied={onCopied} />
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell align="right" className={styles.mono}>
                          {formatNumber(item.events)}
                        </TableCell>
                        <TableCell align="right" className={styles.mono}>
                          {formatNumber(item.paths)}
                        </TableCell>
                        <TableCell align="right" className={styles.mono}>
                          {formatDate(item.lastSeenAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <EmptyBlock text="No error digests recorded." />
            )}
          </div>

          <div className={styles.tabContent}>
            <div>
              <h3 className={styles.subSectionTitle}>Top Affected Routes (30d)</h3>
              <ShareBreakdownList items={errorRouteItems} emptyTitle="No route errors recorded." />
            </div>
            <div>
              <h3 className={styles.subSectionTitle}>Browser Breakdown (30d)</h3>
              <ShareBreakdownList items={errorBrowserItems} emptyTitle="No browser errors recorded." />
            </div>
          </div>
        </div>

        <div>
          <h3 className={styles.subSectionTitle}>Recent Error Log</h3>
          {appErrors.recentEvents.length > 0 ? (
            <TableContainer>
              <Table density="compact" aria-label="Recent error boundary log">
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Digest</TableHead>
                    <TableHead>Browser</TableHead>
                    <TableHead>Version</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {appErrors.recentEvents.map((ev, index) => (
                    <TableRow key={`${ev.createdAt}-${index}`}>
                      <TableCell className={styles.mono}>{formatDate(ev.createdAt)}</TableCell>
                      <TableCell>
                        <Badge variant="danger" size="sm">
                          {ev.eventType}
                        </Badge>
                      </TableCell>
                      <TableCell className={styles.mono}>{ev.path}</TableCell>
                      <TableCell>
                        {ev.digest ? (
                          <div className={styles.codeCell}>
                            <span className={styles.mono}>{ev.digest}</span>
                            <CopyButton value={ev.digest} label="Copy" onCopied={onCopied} />
                          </div>
                        ) : (
                          <span className={styles.mono}>-</span>
                        )}
                      </TableCell>
                      <TableCell className={styles.mono}>{ev.browserClass}</TableCell>
                      <TableCell className={styles.mono}>{ev.appVersion || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <EmptyBlock text="Zero recent application errors." />
          )}
        </div>
      </Panel>
    </div>
  );
}
