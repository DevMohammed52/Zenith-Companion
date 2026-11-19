import type { CSSProperties, ReactNode } from "react";
import { BarChart3, CircleDollarSign, Search, Shield, Sparkles, Swords } from "lucide-react";
import {
  COMPARISON_STAT_KEYS,
  STAT_LABELS,
  formatGold,
  formatNumber,
  secondsToDuration,
} from "@/lib/pets";
import type { ComparedPet } from "../types";
import { formatBattleEv, metricValue } from "../utils/compare-helpers";
import styles from "../page.module.css";

function MetricRow({
  label,
  icon,
  rows,
  metricKey,
  bounds,
  lowerIsBetter = false,
  formatter,
}: {
  label: string;
  icon: ReactNode;
  rows: ComparedPet[];
  metricKey: string;
  bounds: Record<string, { max: number; min: number }>;
  lowerIsBetter?: boolean;
  formatter: (value: number) => string;
}) {
  const bound = bounds[metricKey] || { max: 0, min: 0 };
  return (
    <tr>
      <td>
        <span className={styles.metricLabel}>
          {icon}
          {label}
        </span>
      </td>
      {rows.map((row) => {
        const value = metricValue(row, metricKey);
        const isBest = value > 0 && (lowerIsBetter ? value === bound.min : value === bound.max);
        return (
          <td key={row.id} className={isBest ? styles.bestCell : ""}>
            <span className={styles.metricValue}>{formatter(value)}</span>
            {isBest && <span className={styles.bestBadge}>Best</span>}
          </td>
        );
      })}
    </tr>
  );
}

export function CompareMetricsTable({
  rows,
  metricBounds,
}: {
  rows: ComparedPet[];
  metricBounds: Record<string, { max: number; min: number }>;
}) {
  return (
    <section className={styles.panel}>
      <div className={styles.panelHeader}>
        <div>
          <span className={styles.kicker}>Breakdown</span>
          <h2>Side-by-Side Metrics</h2>
        </div>
      </div>
      <div
        className={styles.tableWrap}
        tabIndex={0}
        aria-label="Side-by-side pet comparison metrics"
      >
        <div className={styles.tableScrollHint}>Swipe sideways for metrics</div>
        <table
          className={styles.compareTable}
          style={{ "--compare-cols": rows.length } as CSSProperties}
        >
          <thead>
            <tr>
              <th>Metric</th>
              {rows.map((row) => (
                <th key={row.id}>{row.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <MetricRow
              label="Total power"
              icon={<Swords size={15} />}
              rows={rows}
              metricKey="power"
              bounds={metricBounds}
              formatter={(value) => formatNumber(value)}
            />
            <MetricRow
              label="Hunting time"
              icon={<Search size={15} />}
              rows={rows}
              metricKey="hunt"
              bounds={metricBounds}
              lowerIsBetter
              formatter={(value) => secondsToDuration(value)}
            />
            <MetricRow
              label="Recorded battle EV"
              icon={<BarChart3 size={15} />}
              rows={rows}
              metricKey="battle"
              bounds={metricBounds}
              formatter={(value) => (value ? `${formatBattleEv(value)}/hr` : "-")}
            />
            <MetricRow
              label="Lowest sale listing"
              icon={<CircleDollarSign size={15} />}
              rows={rows}
              metricKey="market"
              bounds={metricBounds}
              formatter={(value) => formatGold(value)}
            />
            {COMPARISON_STAT_KEYS.map((key) => (
              <MetricRow
                key={key}
                label={STAT_LABELS[key]}
                icon={key === "protection" ? <Shield size={15} /> : <Sparkles size={15} />}
                rows={rows}
                metricKey={key}
                bounds={metricBounds}
                formatter={(value) =>
                  key === "movement_speed" ||
                  key === "critical_damage" ||
                  key === "critical_chance"
                    ? formatNumber(value, 2)
                    : formatNumber(value)
                }
              />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
