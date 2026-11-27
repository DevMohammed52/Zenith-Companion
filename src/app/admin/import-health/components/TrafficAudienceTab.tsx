"use client";

import { useState } from "react";
import {
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
  formatCountryDisplay,
  formatNumber,
  formatPercent,
  formatShortDate,
  type ImportHealth,
  type TimeframeKey,
  type UsageFrame,
} from "../types";
import {
  EmptyBlock,
  KpiStrip,
  Panel,
  ShareBreakdownList,
} from "./DashboardPrimitives";
import { TrafficDualChart } from "./InteractiveCharts";
import styles from "../AdminDashboard.module.css";

type RouteSortKey = "views" | "users" | "ratio";

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
  const [routeQuery, setRouteQuery] = useState("");
  const [routeSort, setRouteSort] = useState<RouteSortKey>("views");

  const trendMode =
    manualTrendMode && manualTrendMode.frame === selectedFrame
      ? manualTrendMode.mode
      : defaultTrendMode;

  const trendRows = (
    trendMode === "daily" ? health.usage.daily : health.usage.hourly
  ).slice(trendMode === "daily" ? -30 : -24);
  const maxViews = Math.max(1, ...trendRows.map((r) => Number(r.pageviews || 0)));

  const totalPageViews = Math.max(
    1,
    health.usage.topPages.reduce((sum, p) => sum + p.views, 0),
  );

  const normalizedQuery = routeQuery.trim().toLowerCase();
  const visiblePages = health.usage.topPages
    .filter((page) => !normalizedQuery || page.path.toLowerCase().includes(normalizedQuery))
    .slice()
    .sort((a, b) => {
      if (routeSort === "users") return b.users - a.users || b.views - a.views;
      if (routeSort === "ratio") {
        const ra = a.users > 0 ? a.views / a.users : 0;
        const rb = b.users > 0 ? b.views / b.users : 0;
        return rb - ra || b.views - a.views;
      }
      return b.views - a.views;
    });

  const countryItems = health.usage.countries.map((row) => {
    const formatted = formatCountryDisplay(row.country);
    return {
      key: row.country,
      label: formatted.fullLabel,
      value: row.users,
      valueText: `${formatNumber(row.users)} users | ${formatNumber(row.events)} ev`,
    };
  });

  const referrerItems = health.usage.referrers.map((row) => ({
    key: row.host,
    label: row.host || "Direct / None",
    value: row.users,
    valueText: `${formatNumber(row.users)} users`,
  }));

  const deviceItems = health.usage.devices.map((row) => ({
    key: row.type,
    label: row.type,
    value: row.users,
    valueText: `${formatNumber(row.users)} users`,
  }));

  const browserItems = health.usage.browsers.map((row) => ({
    key: row.family,
    label: row.family,
    value: row.users,
    valueText: `${formatNumber(row.users)} users`,
  }));

  const timezoneItems = health.usage.timezones.map((row) => ({
    key: row.timezone,
    label: row.timezone,
    value: row.users,
    valueText: `${formatNumber(row.users)} users`,
  }));

  return (
    <div
      id="tabpanel-traffic"
      className={styles.tabContent}
      role="tabpanel"
      aria-labelledby="tab-traffic"
    >
      <KpiStrip
        ariaLabel={`Traffic summary for ${selectedLabel}`}
        items={[
          {
            label: `Unique Users (${selectedLabel})`,
            value: formatNumber(usageFrame.users),
            sublabel: `All-time: ${formatNumber(health.usage.uniqueUsersAllTime)}`,
            icon: "guilds",
          },
          {
            label: "Active Now",
            value: formatNumber(health.usage.activeUsers15m),
            sublabel: `1h active: ${formatNumber(health.usage.activeUsers1h)}`,
            tone: health.usage.activeUsers15m > 0 ? "good" : "neutral",
            icon: "cataclysm",
          },
          {
            label: "Sessions",
            value: formatNumber(usageFrame.sessions),
            sublabel: `30d total: ${formatNumber(health.usage.sessions30d)}`,
            icon: "archiveLayers",
          },
          {
            label: "Pageviews",
            value: formatNumber(usageFrame.pageviews),
            sublabel: `${formatNumber(usageFrame.heartbeats)} heartbeats | ${formatNumber(usageFrame.events)} pings`,
            icon: "barChart",
          },
          {
            label: "Views / Session",
            value: formatNumber(usageFrame.pageviewsPerSession),
            sublabel: `24h avg: ${formatNumber(health.usage.pageviewsPerSession24h)}`,
            icon: "skillProfit",
          },
        ]}
      />

      <Panel
        icon="barChart"
        title="Traffic Trend (Pageviews &amp; Unique Users)"
        subtitle={
          trendMode === "daily"
            ? "Interactive 30-day visitor and pageview volume"
            : "Interactive 24-hour visitor and pageview volume"
        }
        action={
          <SegmentedControl
            ariaLabel="Traffic trend granularity"
            size="sm"
            options={[
              { value: "hourly", label: "Hourly (24h)" },
              { value: "daily", label: "Daily (30d)" },
            ]}
            value={trendMode}
            onChange={(mode) =>
              setManualTrendMode({ frame: selectedFrame, mode: mode as "hourly" | "daily" })
            }
          />
        }
      >
        {trendRows.length > 0 ? (
          <>
            <TrafficDualChart rows={trendRows} />
            <div className={styles.trendBucketGrid}>
              {trendRows.map((row) => {
                const rawBucket = row.day || row.hour || "";
                const bucketLabel = row.day
                  ? formatShortDate(row.day)
                  : String(row.hour || "").slice(11, 16) || rawBucket;
                const views = Number(row.pageviews || 0);
                const users = Number(row.users || 0);
                const viewsPct = views > 0 ? Math.min(100, Math.max(3, (views / maxViews) * 100)) : 0;

                return (
                  <div key={rawBucket} className={styles.trendBucketRow}>
                    <span className={styles.mono}>{bucketLabel}</span>
                    <div className={styles.trendTrackMini} title={`${views} pageviews, ${users} unique users`}>
                      <div className={styles.trendSegOther} style={{ width: `${viewsPct}%` }} />
                    </div>
                    <div className={styles.trendNumbersCompact}>
                      <span>{formatNumber(views)} views</span>
                      <span className={styles.toneGood}>{formatNumber(users)} users</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <EmptyBlock text="No traffic trend data recorded for this window." />
        )}
      </Panel>

      <Panel
        icon="route"
        title="Route Analytics (30d)"
        subtitle="Filter any route path (for example /crafting, /bis, /alchemy) to inspect visits and repeat engagement"
      >
        {health.usage.topPages.length > 0 ? (
          <>
            <div className={styles.filterToolbar}>
              <div className={styles.filterSearch}>
                <SearchInput
                  value={routeQuery}
                  onChange={setRouteQuery}
                  placeholder="Filter routes (e.g. /crafting, /bis)..."
                  showShortcutHint={false}
                />
              </div>
              <SegmentedControl
                ariaLabel="Sort routes"
                size="sm"
                options={[
                  { value: "views", label: "Most Views" },
                  { value: "users", label: "Most Users" },
                  { value: "ratio", label: "Views / User" },
                ]}
                value={routeSort}
                onChange={(val) => setRouteSort(val as RouteSortKey)}
              />
            </div>

            {visiblePages.length > 0 ? (
              <TableContainer>
                <Table density="compact" aria-label="Route traffic ranking">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Route Path</TableHead>
                      <TableHead align="right">Pageviews</TableHead>
                      <TableHead align="right">Unique Users</TableHead>
                      <TableHead align="right">Views / User</TableHead>
                      <TableHead>Traffic Share</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visiblePages.map((page) => {
                      const sharePct = Math.round((page.views / totalPageViews) * 1000) / 10;
                      const perUser = page.users > 0 ? page.views / page.users : 0;
                      return (
                        <TableRow key={page.path}>
                          <TableCell className={styles.mono}>{page.path}</TableCell>
                          <TableCell align="right" className={styles.mono}>
                            {formatNumber(page.views)}
                          </TableCell>
                          <TableCell align="right" className={styles.mono}>
                            {formatNumber(page.users)}
                          </TableCell>
                          <TableCell align="right" className={styles.mono}>
                            {formatNumber(perUser)}
                          </TableCell>
                          <TableCell>
                            <ProgressBar
                              value={sharePct}
                              min={0}
                              max={100}
                              size="sm"
                              valueText={formatPercent(sharePct)}
                              ariaLabel={`${page.path} traffic share ${sharePct}%`}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <EmptyBlock text={`No routes match "${routeQuery}".`} />
            )}
          </>
        ) : (
          <EmptyBlock text="No pageview telemetry recorded yet." />
        )}
      </Panel>

      <div className={styles.grid2}>
        <Panel icon="globe" title="Countries (30d)" subtitle="Resolved ISO regions">
          <ShareBreakdownList items={countryItems} emptyTitle="No country telemetry yet." />
        </Panel>

        <Panel icon="skillProfit" title="External Referrers (30d)" subtitle="Top referring hosts">
          <ShareBreakdownList items={referrerItems} emptyTitle="No external referrers recorded in 30d." />
        </Panel>
      </div>

      <div className={styles.grid3}>
        <Panel icon="device" title="Devices (30d)">
          <ShareBreakdownList items={deviceItems} emptyTitle="No device telemetry yet." />
        </Panel>

        <Panel icon="map" title="Browsers (30d)">
          <ShareBreakdownList items={browserItems} emptyTitle="No browser telemetry yet." />
        </Panel>

        <Panel icon="timer" title="Timezones (30d)">
          <ShareBreakdownList items={timezoneItems} emptyTitle="No timezone telemetry yet." />
        </Panel>
      </div>
    </div>
  );
}
