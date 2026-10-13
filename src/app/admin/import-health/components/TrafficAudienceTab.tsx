"use client";

import { useState } from "react";
import {
  Activity,
  BarChart3,
  Clock,
  Compass,
  Globe2,
  Layers,
  Smartphone,
  TrendingUp,
  Users,
} from "lucide-react";
import styles from "../AdminDashboard.module.css";
import {
  formatCountryDisplay,
  formatNumber,
  formatPercent,
  formatShortDate,
  type ImportHealth,
  type TimeframeKey,
  type UsageFrame,
} from "../types";
import { EmptyBlock, MetricCard, Panel } from "./DashboardPrimitives";

function ShareBreakdownList({
  items,
  emptyText,
}: {
  items: Array<{ key: string; label: string; users: number; extra?: string }>;
  emptyText: string;
}) {
  if (!items.length) return <EmptyBlock text={emptyText} />;
  const totalUsers = Math.max(1, items.reduce((sum, item) => sum + item.users, 0));
  const maxUsers = Math.max(1, ...items.map((item) => item.users));

  return (
    <div className={styles.rankList}>
      {items.map((item) => {
        const sharePct = Math.round((item.users / totalUsers) * 1000) / 10;
        const barWidth = item.users > 0 ? Math.max(3, (item.users / maxUsers) * 100) : 0;
        return (
          <div key={item.key} className={styles.rankItem}>
            <div className={styles.rankHeader}>
              <span className={styles.rankLabel} title={item.label}>
                {item.label}
              </span>
              <span className={styles.rankMeta}>
                {formatNumber(item.users)} users · {formatPercent(sharePct)}
                {item.extra ? ` (${item.extra})` : ""}
              </span>
            </div>
            <div className={styles.shareBarWrap}>
              <div className={styles.shareTrack}>
                <div className={styles.shareFill} style={{ width: `${barWidth}%` }} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function TrafficAudienceTab({
  health,
  usageFrame,
  selectedFrame,
  selectedLabel,
}: {
  health: ImportHealth;
  usageFrame: UsageFrame;
  selectedFrame: TimeframeKey;
  selectedLabel: string;
}) {
  const defaultTrendMode =
    selectedFrame === "15m" || selectedFrame === "1h" || selectedFrame === "24h"
      ? "hourly"
      : "daily";
  const [manualTrendMode, setManualTrendMode] = useState<{
    frame: TimeframeKey;
    mode: "hourly" | "daily";
  } | null>(null);
  const trendMode =
    manualTrendMode && manualTrendMode.frame === selectedFrame
      ? manualTrendMode.mode
      : defaultTrendMode;

  const trendRows = (
    trendMode === "daily" ? health.usage.daily : health.usage.hourly
  ).slice(trendMode === "daily" ? -30 : -24);
  const maxViews = Math.max(1, ...trendRows.map((r) => Number(r.pageviews || 0)));
  const maxUsers = Math.max(1, ...trendRows.map((r) => Number(r.users || 0)));

  const totalPageViews = Math.max(
    1,
    health.usage.topPages.reduce((sum, p) => sum + p.views, 0),
  );

  const countryItems = health.usage.countries.map((row) => {
    const formatted = formatCountryDisplay(row.country);
    return {
      key: row.country,
      label: formatted.fullLabel,
      users: row.users,
      extra: `${formatNumber(row.events)} ev`,
    };
  });

  const referrerItems = health.usage.referrers.map((row) => ({
    key: row.host,
    label: row.host || "Direct / None",
    users: row.users,
  }));

  const deviceItems = health.usage.devices.map((row) => ({
    key: row.type,
    label: row.type,
    users: row.users,
  }));

  const browserItems = health.usage.browsers.map((row) => ({
    key: row.family,
    label: row.family,
    users: row.users,
  }));

  const timezoneItems = health.usage.timezones.map((row) => ({
    key: row.timezone,
    label: row.timezone,
    users: row.users,
  }));

  return (
    <div
      id="tabpanel-traffic"
      className={styles.tabContent}
      role="tabpanel"
      aria-labelledby="tab-traffic"
    >
      <Panel
        icon={Users}
        title="Traffic Telemetry Summary"
        subtitle={`Selected window: ${selectedLabel}`}
      >
        <div className={styles.grid6}>
          <MetricCard
            icon={Users}
            label="Unique Users"
            value={formatNumber(usageFrame.users)}
            detail={`All-time: ${formatNumber(health.usage.uniqueUsersAllTime)}`}
          />
          <MetricCard
            icon={Activity}
            label="Active 15m"
            value={formatNumber(health.usage.activeUsers15m)}
            detail={`Active 1h: ${formatNumber(health.usage.activeUsers1h)}`}
            tone={health.usage.activeUsers15m > 0 ? "good" : "neutral"}
          />
          <MetricCard
            icon={Layers}
            label="Sessions"
            value={formatNumber(usageFrame.sessions)}
            detail={`30d sessions: ${formatNumber(health.usage.sessions30d)}`}
          />
          <MetricCard
            icon={BarChart3}
            label="Pageviews"
            value={formatNumber(usageFrame.pageviews)}
            detail={`${formatNumber(usageFrame.events)} total pings`}
          />
          <MetricCard
            icon={Clock}
            label="Heartbeats"
            value={formatNumber(usageFrame.heartbeats)}
            detail="Active tab presence pings"
          />
          <MetricCard
            icon={TrendingUp}
            label="Views / Session"
            value={formatNumber(usageFrame.pageviewsPerSession)}
            detail={`24h avg: ${formatNumber(health.usage.pageviewsPerSession24h)}`}
          />
        </div>
      </Panel>

      <Panel
        icon={BarChart3}
        title="Traffic Trend (Pageviews &amp; Unique Users)"
        subtitle={
          trendMode === "daily"
            ? "Daily visitor & pageview volume (30-day rolling window)"
            : "Hourly visitor & pageview volume (24-hour rolling window)"
        }
        action={
          <div className={styles.segmentedGroup} role="group" aria-label="Traffic trend granularity">
            <button
              type="button"
              className={`${styles.toggleBtn} ${trendMode === "hourly" ? styles.toggleBtnActive : ""}`}
              aria-pressed={trendMode === "hourly"}
              onClick={() => setManualTrendMode({ frame: selectedFrame, mode: "hourly" })}
            >
              Hourly (24h)
            </button>
            <button
              type="button"
              className={`${styles.toggleBtn} ${trendMode === "daily" ? styles.toggleBtnActive : ""}`}
              aria-pressed={trendMode === "daily"}
              onClick={() => setManualTrendMode({ frame: selectedFrame, mode: "daily" })}
            >
              Daily (30d)
            </button>
          </div>
        }
      >
        {trendRows.length > 0 ? (
          <div className={styles.trendContainer}>
            <div className={styles.trendLegend}>
              <span className={styles.legendItem}>
                <i className={`${styles.legendSwatch} ${styles.swatchAccent}`} />
                Pageviews
              </span>
              <span className={styles.legendItem}>
                <i className={`${styles.legendSwatch} ${styles.swatchGood}`} />
                Unique Users
              </span>
            </div>

            <div className={styles.trendList}>
              {trendRows.map((row) => {
                const rawBucket = row.day || row.hour || "";
                const bucketLabel = row.day
                  ? formatShortDate(row.day)
                  : String(row.hour || "").slice(11, 16) || rawBucket;
                const views = Number(row.pageviews || 0);
                const users = Number(row.users || 0);
                const viewsPct = views > 0 ? Math.min(100, Math.max(2, (views / maxViews) * 100)) : 0;
                const usersPct = users > 0 ? Math.min(100, Math.max(2, (users / maxUsers) * 100)) : 0;

                return (
                  <div key={rawBucket} className={styles.trendRow}>
                    <span className={styles.trendBucket}>{bucketLabel}</span>
                    <div className={styles.dualBarStack}>
                      <div className={styles.dualBarTrack} title={`${views} pageviews`}>
                        <div className={styles.dualBarViews} style={{ width: `${viewsPct}%` }} />
                      </div>
                      <div className={styles.dualBarTrack} title={`${users} unique users`}>
                        <div className={styles.dualBarUsers} style={{ width: `${usersPct}%` }} />
                      </div>
                    </div>
                    <div className={styles.trendNumbers}>
                      <span>{formatNumber(views)} views</span>
                      <span>·</span>
                      <span className={styles.chip + " " + styles.toneGood}>
                        {formatNumber(users)} users
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <EmptyBlock text="No traffic trend data recorded for this window." />
        )}
      </Panel>

      <Panel
        icon={Activity}
        title="Top Pages (30d)"
        subtitle="Route traffic ranking with pageviews, unique users, and traffic share"
      >
        {health.usage.topPages.length > 0 ? (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Route Path</th>
                  <th>Pageviews</th>
                  <th>Unique Users</th>
                  <th>Traffic Share</th>
                </tr>
              </thead>
              <tbody>
                {health.usage.topPages.map((page) => {
                  const sharePct = Math.round((page.views / totalPageViews) * 1000) / 10;
                  return (
                    <tr key={page.path}>
                      <td className={styles.mono}>{page.path}</td>
                      <td className={styles.mono}>{formatNumber(page.views)}</td>
                      <td className={styles.mono}>{formatNumber(page.users)}</td>
                      <td>
                        <div className={styles.shareBarWrap}>
                          <div className={styles.shareTrack}>
                            <div
                              className={styles.shareFill}
                              style={{ width: `${Math.max(2, sharePct)}%` }}
                            />
                          </div>
                          <span className={styles.mono}>{formatPercent(sharePct)}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyBlock text="No pageview telemetry recorded yet." />
        )}
      </Panel>

      <div className={styles.grid2}>
        <Panel
          icon={Globe2}
          title="Countries (30d)"
          subtitle="ISO region codes resolved with Intl.DisplayNames and flag indicators"
        >
          <ShareBreakdownList items={countryItems} emptyText="No country telemetry yet." />
        </Panel>

        <Panel
          icon={TrendingUp}
          title="External Referrers (30d)"
          subtitle="Top referring domains by unique visitors"
        >
          <ShareBreakdownList
            items={referrerItems}
            emptyText="No external referrers recorded in the last 30 days."
          />
        </Panel>
      </div>

      <div className={styles.grid3}>
        <Panel
          icon={Smartphone}
          title="Devices (30d)"
          subtitle="Form factor distribution"
        >
          <ShareBreakdownList items={deviceItems} emptyText="No device telemetry yet." />
        </Panel>

        <Panel
          icon={Compass}
          title="Browsers (30d)"
          subtitle="User-Agent family breakdown"
        >
          <ShareBreakdownList items={browserItems} emptyText="No browser telemetry yet." />
        </Panel>

        <Panel
          icon={Clock}
          title="Timezones (30d)"
          subtitle="Top client IANA timezones"
        >
          <ShareBreakdownList items={timezoneItems} emptyText="No timezone telemetry yet." />
        </Panel>
      </div>
    </div>
  );
}
