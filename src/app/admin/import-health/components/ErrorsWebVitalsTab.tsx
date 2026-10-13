"use client";

import {
  Activity,
  AlertTriangle,
  Bug,
  Compass,
  Gauge,
  Route,
} from "lucide-react";
import styles from "../AdminDashboard.module.css";
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
import { CopyButton, EmptyBlock, MetricCard, Panel, toneClass } from "./DashboardPrimitives";

export function ErrorsWebVitalsTab({ health }: { health: ImportHealth }) {
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

  const maxRouteErrors = Math.max(1, ...appErrors.topPaths.map((r) => r.events));
  const maxBrowserErrors = Math.max(1, ...appErrors.browsers.map((b) => b.events));

  return (
    <div
      id="tabpanel-vitals"
      className={styles.tabContent}
      role="tabpanel"
      aria-labelledby="tab-vitals"
    >
      <Panel
        icon={Gauge}
        title="Core Web Vitals Scorecard (30d RUM)"
        subtitle={`${formatNumber(webVitals.events30d)} samples in 30d (${formatNumber(webVitals.events24h)} in 24h) · Overall poor rate: ${formatPercent(webVitals.poorRate30d)}`}
      >
        <div className={styles.grid5}>
          {scorecardMetrics.map((metric) => {
            const tone = metric.events > 0 ? vitalRatingTone(metric.rating) : "neutral";
            return (
              <div key={metric.name} className={styles.vitalCard}>
                <div className={styles.vitalTop}>
                  <span className={styles.vitalName}>{metric.name}</span>
                  <span className={`${styles.chip} ${toneClass(tone)}`}>
                    {metric.events > 0 ? metric.rating : "no samples"}
                  </span>
                </div>

                <div>
                  <div className={styles.vitalP75}>
                    {metric.events > 0 ? formatVitalValue(metric.name, metric.p75Value) : "—"}
                  </div>
                  <span className={styles.panelSubtitle}>
                    p75 · avg {metric.events > 0 ? formatVitalValue(metric.name, metric.avgValue) : "—"}
                  </span>
                </div>

                <div className={styles.vitalFooter}>
                  <div className={styles.vitalSubRow}>
                    <span>{formatNumber(metric.events)} samples</span>
                    <span>{formatPercent(metric.goodRate)} good</span>
                  </div>
                  <div className={styles.shareTrack}>
                    <div
                      className={styles.shareFillGood}
                      style={{ width: `${metric.events > 0 ? Math.max(3, metric.goodRate) : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Panel>

      <Panel
        icon={Route}
        title="Routes Needing Attention"
        subtitle="Slowest route and metric combinations ranked by poor RUM sample count (30d)"
      >
        {webVitals.topPaths.length > 0 ? (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Route Path</th>
                  <th>Metric</th>
                  <th>Global p75</th>
                  <th>Poor Count</th>
                  <th>Total Samples</th>
                  <th>Poor Rate %</th>
                </tr>
              </thead>
              <tbody>
                {webVitals.topPaths.map((row, idx) => {
                  const metricMeta = metricByName.get(row.metricName.toUpperCase());
                  const p75Val = row.p75Value ?? metricMeta?.p75Value ?? 0;
                  const tone = row.poorRate >= 25 ? "bad" : row.poor > 0 ? "warn" : "good";
                  return (
                    <tr key={`${row.path}-${row.metricName}-${idx}`}>
                      <td className={styles.mono}>{row.path}</td>
                      <td>
                        <span className={`${styles.chip} ${styles.toneNeutral}`}>
                          {row.metricName}
                        </span>
                      </td>
                      <td className={styles.mono}>
                        {p75Val > 0 ? formatVitalValue(row.metricName, p75Val) : "—"}
                      </td>
                      <td className={styles.mono}>{formatNumber(row.poor)}</td>
                      <td className={styles.mono}>{formatNumber(row.events)}</td>
                      <td>
                        <div className={styles.shareBarWrap}>
                          <div className={styles.shareTrack}>
                            <div
                              className={styles.shareFill}
                              style={{ width: `${Math.max(2, row.poorRate)}%` }}
                            />
                          </div>
                          <span className={`${styles.chip} ${toneClass(tone)}`}>
                            {formatPercent(row.poorRate)}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyBlock text="No slow route signals recorded in Web Vitals." />
        )}
      </Panel>

      <Panel
        icon={Bug}
        title="Application Errors Explorer"
        subtitle="Client and server error boundary telemetry grouped by digest and route"
      >
        <div className={styles.grid4}>
          <MetricCard
            icon={AlertTriangle}
            label="24h Errors"
            value={formatNumber(appErrors.events24h)}
            detail="Last 24 hours"
            tone={appErrors.events24h > 0 ? "warn" : "good"}
          />
          <MetricCard
            icon={Activity}
            label="7d Errors"
            value={formatNumber(appErrors.events7d)}
            detail="Rolling 7-day total"
            tone={appErrors.events7d > 0 ? "warn" : "neutral"}
          />
          <MetricCard
            icon={Activity}
            label="30d Errors"
            value={formatNumber(appErrors.events30d)}
            detail="Rolling 30-day total"
          />
          <MetricCard
            icon={Bug}
            label="Unique Digests (24h)"
            value={formatNumber(appErrors.uniqueDigests24h)}
            detail="Distinct crash signatures"
            tone={appErrors.uniqueDigests24h > 0 ? "warn" : "neutral"}
          />
        </div>

        <div className={styles.grid2}>
          <div>
            <h3 className={styles.panelTitle} style={{ marginBottom: "0.55rem" }}>
              Top Error Digests (30d)
            </h3>
            {appErrors.topDigests.length > 0 ? (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Digest</th>
                      <th>Events</th>
                      <th>Routes</th>
                      <th>Last Seen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appErrors.topDigests.map((item) => (
                      <tr key={item.digest}>
                        <td>
                          <div className={styles.codeCell}>
                            <span className={styles.mono}>{item.digest || "no-digest"}</span>
                            {item.digest ? <CopyButton value={item.digest} label="Copy" /> : null}
                          </div>
                        </td>
                        <td className={styles.mono}>{formatNumber(item.events)}</td>
                        <td className={styles.mono}>{formatNumber(item.paths)}</td>
                        <td className={styles.mono}>{formatDate(item.lastSeenAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyBlock text="No error digests recorded." />
            )}
          </div>

          <div className={styles.tabContent}>
            <div>
              <h3 className={styles.panelTitle} style={{ marginBottom: "0.55rem" }}>
                Top Affected Routes (30d)
              </h3>
              {appErrors.topPaths.length > 0 ? (
                <div className={styles.rankList}>
                  {appErrors.topPaths.map((route) => (
                    <div key={route.path} className={styles.rankItem}>
                      <div className={styles.rankHeader}>
                        <span className={`${styles.rankLabel} ${styles.mono}`}>{route.path}</span>
                        <span className={styles.rankMeta}>
                          {formatNumber(route.events)} errors · {formatNumber(route.digests)} digests
                        </span>
                      </div>
                      <div className={styles.shareTrack}>
                        <div
                          className={styles.shareFill}
                          style={{ width: `${Math.max(3, (route.events / maxRouteErrors) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyBlock text="No route errors recorded." />
              )}
            </div>

            <div>
              <h3 className={styles.panelTitle} style={{ marginBottom: "0.55rem" }}>
                <Compass size={14} /> Browser Breakdown (30d)
              </h3>
              {appErrors.browsers.length > 0 ? (
                <div className={styles.rankList}>
                  {appErrors.browsers.map((b) => (
                    <div key={b.family} className={styles.rankItem}>
                      <div className={styles.rankHeader}>
                        <span className={styles.rankLabel}>{b.family}</span>
                        <span className={styles.rankMeta}>{formatNumber(b.events)} errors</span>
                      </div>
                      <div className={styles.shareTrack}>
                        <div
                          className={styles.shareFill}
                          style={{ width: `${Math.max(3, (b.events / maxBrowserErrors) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyBlock text="No browser error distribution recorded." />
              )}
            </div>
          </div>
        </div>

        <div>
          <h3 className={styles.panelTitle} style={{ marginBottom: "0.55rem" }}>
            Recent Error Log
          </h3>
          {appErrors.recentEvents.length > 0 ? (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Event Type</th>
                    <th>Route Path</th>
                    <th>Digest</th>
                    <th>Browser</th>
                    <th>App Version</th>
                  </tr>
                </thead>
                <tbody>
                  {appErrors.recentEvents.map((ev, index) => (
                    <tr key={`${ev.createdAt}-${index}`}>
                      <td className={styles.mono}>{formatDate(ev.createdAt)}</td>
                      <td>
                        <span className={`${styles.chip} ${styles.toneBad}`}>{ev.eventType}</span>
                      </td>
                      <td className={styles.mono}>{ev.path}</td>
                      <td>
                        {ev.digest ? (
                          <div className={styles.codeCell}>
                            <span className={styles.mono}>{ev.digest}</span>
                            <CopyButton value={ev.digest} label="Copy" />
                          </div>
                        ) : (
                          <span className={styles.mono}>—</span>
                        )}
                      </td>
                      <td className={styles.mono}>{ev.browserClass}</td>
                      <td className={styles.mono}>{ev.appVersion || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyBlock text="Zero recent application errors." />
          )}
        </div>
      </Panel>
    </div>
  );
}
