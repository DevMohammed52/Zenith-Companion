"use client";

import { useState } from "react";
import { formatNumber, formatShortDate, type ImportTrendBarMetrics, type TrendRow } from "../types";
import styles from "../AdminDashboard.module.css";

/**
 * Interactive SVG stacked outcome chart paired with accessible bucket rows.
 * Hovering or focusing any column highlights exact Completed/Failed/Protected numbers.
 */
export function ImportOutcomeChart({ bars }: { bars: ImportTrendBarMetrics[] }) {
  const [activeIndex, setActiveIndex] = useState<number>(Math.max(0, bars.length - 1));
  const clampedIndex = Math.min(activeIndex, Math.max(0, bars.length - 1));
  const activeBar = bars[clampedIndex];
  const maxTotal = Math.max(1, ...bars.map((b) => Math.max(b.attempts, b.completed + b.failed)));

  const svgWidth = Math.max(360, bars.length * 22);
  const svgHeight = 148;
  const chartBottom = 122;
  const chartHeight = 104;
  const barWidth = Math.max(8, Math.min(18, Math.floor((svgWidth - 20) / Math.max(1, bars.length)) - 4));
  const stepX = bars.length > 0 ? (svgWidth - 16) / bars.length : 22;

  return (
    <div className={styles.chartStage}>
      {activeBar ? (
        <div className={styles.chartReadoutRow} aria-live="polite">
          <span className={styles.monoStrong}>{activeBar.rawBucket || activeBar.label}</span>
          <span className={styles.hairlineV} aria-hidden="true" />
          <span className={styles.toneGood}>Completed {formatNumber(activeBar.completed)}</span>
          <span className={styles.hairlineV} aria-hidden="true" />
          <span className={activeBar.failed > 0 ? styles.toneBad : styles.mutedInline}>
            Failed {formatNumber(activeBar.failed)}
          </span>
          <span className={styles.hairlineV} aria-hidden="true" />
          <span className={styles.mutedInline}>Protected {formatNumber(activeBar.other)}</span>
          <span className={styles.hairlineV} aria-hidden="true" />
          <span>{formatNumber(activeBar.attempts)} attempts</span>
        </div>
      ) : null}

      <div className={styles.svgScrollWrap}>
        <svg
          className={styles.interactiveSvg}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          role="img"
          aria-label="Import volume and outcome trend chart"
        >
          <line x1="8" y1={chartBottom} x2={svgWidth - 8} y2={chartBottom} className={styles.chartAxis} />
          <line
            x1="8"
            y1={chartBottom - chartHeight * 0.5}
            x2={svgWidth - 8}
            y2={chartBottom - chartHeight * 0.5}
            className={styles.chartGridLine}
          />
          {bars.map((bar, index) => {
            const x = 10 + index * stepX + (stepX - barWidth) / 2;
            const completedH = (bar.completed / maxTotal) * chartHeight;
            const failedH = (bar.failed / maxTotal) * chartHeight;
            const otherH = (bar.other / maxTotal) * chartHeight;
            const yCompleted = chartBottom - completedH;
            const yFailed = yCompleted - failedH;
            const yOther = yFailed - otherH;
            const isSelected = index === clampedIndex;

            return (
              <g
                key={bar.rawBucket || index}
                className={styles.chartColumn}
                tabIndex={0}
                role="button"
                aria-label={`${bar.label}: ${bar.completed} completed, ${bar.failed} failed, ${bar.attempts} attempts`}
                onMouseEnter={() => setActiveIndex(index)}
                onFocus={() => setActiveIndex(index)}
                onClick={() => setActiveIndex(index)}
              >
                <rect
                  x={x - 3}
                  y={12}
                  width={barWidth + 6}
                  height={chartBottom - 12}
                  rx={4}
                  className={isSelected ? styles.chartHighlight : styles.chartHitArea}
                />
                {otherH > 0 ? (
                  <rect
                    x={x}
                    y={Math.max(14, yOther)}
                    width={barWidth}
                    height={Math.max(2, otherH)}
                    rx={2}
                    className={styles.svgOtherBar}
                  />
                ) : null}
                {failedH > 0 ? (
                  <rect
                    x={x}
                    y={Math.max(14, yFailed)}
                    width={barWidth}
                    height={Math.max(2, failedH)}
                    rx={2}
                    className={styles.svgBadBar}
                  />
                ) : null}
                {completedH > 0 ? (
                  <rect
                    x={x}
                    y={Math.max(14, yCompleted)}
                    width={barWidth}
                    height={Math.max(2, completedH)}
                    rx={2}
                    className={styles.svgGoodBar}
                  />
                ) : null}
                {index === 0 || index === bars.length - 1 || index % 5 === 0 ? (
                  <text x={x + barWidth / 2} y={140} textAnchor="middle" className={styles.chartTick}>
                    {bar.label}
                  </text>
                ) : null}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

/**
 * Interactive dual-bar SVG chart comparing Pageviews vs Unique Users over time.
 */
export function TrafficDualChart({ rows }: { rows: TrendRow[] }) {
  const [activeIndex, setActiveIndex] = useState<number>(Math.max(0, rows.length - 1));
  const clampedIndex = Math.min(activeIndex, Math.max(0, rows.length - 1));
  const activeRow = rows[clampedIndex];
  const maxViews = Math.max(1, ...rows.map((r) => Number(r.pageviews || 0)));

  const svgWidth = Math.max(360, rows.length * 24);
  const svgHeight = 148;
  const chartBottom = 122;
  const chartHeight = 104;
  const pairWidth = Math.max(10, Math.min(20, Math.floor((svgWidth - 20) / Math.max(1, rows.length)) - 4));
  const stepX = rows.length > 0 ? (svgWidth - 16) / rows.length : 24;

  const activeRaw = activeRow ? activeRow.day || activeRow.hour || "" : "";
  const activeLabel = activeRow
    ? activeRow.day
      ? formatShortDate(activeRow.day)
      : String(activeRow.hour || "").slice(11, 16) || activeRaw
    : "";

  return (
    <div className={styles.chartStage}>
      {activeRow ? (
        <div className={styles.chartReadoutRow} aria-live="polite">
          <span className={styles.monoStrong}>{activeLabel}</span>
          <span className={styles.hairlineV} aria-hidden="true" />
          <span className={styles.toneAccent}>
            Pageviews {formatNumber(Number(activeRow.pageviews || 0))}
          </span>
          <span className={styles.hairlineV} aria-hidden="true" />
          <span className={styles.toneGood}>
            Users {formatNumber(Number(activeRow.users || 0))}
          </span>
          <span className={styles.hairlineV} aria-hidden="true" />
          <span className={styles.mutedInline}>
            Events {formatNumber(Number(activeRow.events || 0))}
          </span>
        </div>
      ) : null}

      <div className={styles.svgScrollWrap}>
        <svg
          className={styles.interactiveSvg}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          role="img"
          aria-label="Pageviews and unique users trend chart"
        >
          <line x1="8" y1={chartBottom} x2={svgWidth - 8} y2={chartBottom} className={styles.chartAxis} />
          <line
            x1="8"
            y1={chartBottom - chartHeight * 0.5}
            x2={svgWidth - 8}
            y2={chartBottom - chartHeight * 0.5}
            className={styles.chartGridLine}
          />
          {rows.map((row, index) => {
            const rawBucket = row.day || row.hour || "";
            const label = row.day
              ? formatShortDate(row.day)
              : String(row.hour || "").slice(11, 16) || rawBucket;
            const views = Number(row.pageviews || 0);
            const users = Number(row.users || 0);
            const viewsH = views > 0 ? Math.max(3, (views / maxViews) * chartHeight) : 0;
            const usersH = users > 0 ? Math.max(3, (users / maxViews) * chartHeight) : 0;
            const x = 10 + index * stepX + (stepX - pairWidth) / 2;
            const singleW = Math.max(4, Math.floor((pairWidth - 2) / 2));
            const isSelected = index === clampedIndex;

            return (
              <g
                key={rawBucket || index}
                className={styles.chartColumn}
                tabIndex={0}
                role="button"
                aria-label={`${label}: ${views} pageviews, ${users} unique users`}
                onMouseEnter={() => setActiveIndex(index)}
                onFocus={() => setActiveIndex(index)}
                onClick={() => setActiveIndex(index)}
              >
                <rect
                  x={x - 3}
                  y={12}
                  width={pairWidth + 6}
                  height={chartBottom - 12}
                  rx={4}
                  className={isSelected ? styles.chartHighlight : styles.chartHitArea}
                />
                {viewsH > 0 ? (
                  <rect
                    x={x}
                    y={chartBottom - viewsH}
                    width={singleW}
                    height={viewsH}
                    rx={2}
                    className={styles.svgAccentBar}
                  />
                ) : null}
                {usersH > 0 ? (
                  <rect
                    x={x + singleW + 2}
                    y={chartBottom - usersH}
                    width={singleW}
                    height={usersH}
                    rx={2}
                    className={styles.svgGoodBar}
                  />
                ) : null}
                {index === 0 || index === rows.length - 1 || index % 5 === 0 ? (
                  <text x={x + pairWidth / 2} y={140} textAnchor="middle" className={styles.chartTick}>
                    {label}
                  </text>
                ) : null}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
