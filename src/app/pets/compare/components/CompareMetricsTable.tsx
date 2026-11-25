import type { CSSProperties } from "react";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import type { IconConcept } from "@/lib/icons";
import {
  COMPARISON_STAT_KEYS,
  STAT_LABELS,
  type StatKey,
  formatGold,
  formatNumber,
  secondsToDuration,
} from "@/lib/pets";
import type { ComparedPet } from "../types";
import { formatBattleEv, metricValue } from "../utils/compare-helpers";
import styles from "../page.module.css";

const STAT_ICONS: Record<StatKey, IconConcept> = {
  attack_power: "attackPower",
  protection: "defense",
  agility: "agility",
  accuracy: "accuracy",
  movement_speed: "speed",
  max_health: "health",
  max_stamina: "stamina",
  critical_damage: "critDamage",
  critical_chance: "critChance",
};

function MetricRow({
  label,
  iconName,
  rows,
  metricKey,
  bounds,
  lowerIsBetter = false,
  formatter,
}: {
  label: string;
  iconName: IconConcept;
  rows: ComparedPet[];
  metricKey: string;
  bounds: Record<string, { max: number; min: number }>;
  lowerIsBetter?: boolean;
  formatter: (value: number) => string;
}) {
  const bound = bounds[metricKey] || { max: 0, min: 0 };
  return (
    <tr>
      <th scope="row" className={styles.metricRowHead}>
        <span className={styles.metricLabel}>
          <Icon name={iconName} size="sm" aria-hidden="true" />
          <span>{label}</span>
        </span>
      </th>
      {rows.map((row) => {
        const value = metricValue(row, metricKey);
        const isBest =
          rows.length > 1 &&
          value > 0 &&
          (lowerIsBetter ? value === bound.min : value === bound.max);

        return (
          <td key={row.id} className={isBest ? styles.bestCell : styles.numCell}>
            <span className={styles.metricCellInner}>
              {isBest && (
                <Badge variant="neutral" size="sm" className={styles.bestBadge}>
                  Best
                </Badge>
              )}
              <span className={styles.metricValue}>{formatter(value)}</span>
            </span>
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
    <section className={styles.panel} aria-labelledby="compare-metrics-heading">
      <div className={styles.panelHeader}>
        <div>
          <span className={styles.sectionKicker}>Breakdown</span>
          <h2 id="compare-metrics-heading" className={styles.panelTitle}>
            Side-by-Side Metrics
          </h2>
        </div>
      </div>

      <div
        className={styles.tableWrap}
        role="region"
        tabIndex={0}
        aria-label="Side-by-side pet comparison metrics"
      >
        <table
          className={styles.compareTable}
          style={{ "--compare-cols": rows.length } as CSSProperties}
        >
          <thead>
            <tr>
              <th scope="col" className={styles.metricColHead}>
                Metric
              </th>
              {rows.map((row) => (
                <th key={row.id} scope="col" className={styles.numColHead}>
                  {row.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <MetricRow
              label="Total power"
              iconName="combat"
              rows={rows}
              metricKey="power"
              bounds={metricBounds}
              formatter={(value) => formatNumber(value)}
            />
            <MetricRow
              label="Hunting time"
              iconName="timer"
              rows={rows}
              metricKey="hunt"
              bounds={metricBounds}
              lowerIsBetter
              formatter={(value) => secondsToDuration(value)}
            />
            <MetricRow
              label="Battle EV / hr"
              iconName="skillProfit"
              rows={rows}
              metricKey="battle"
              bounds={metricBounds}
              formatter={(value) => (value ? `${formatBattleEv(value)}/hr` : "-")}
            />
            <MetricRow
              label="Lowest listing"
              iconName="gold"
              rows={rows}
              metricKey="market"
              bounds={metricBounds}
              formatter={(value) => formatGold(value)}
            />
            {COMPARISON_STAT_KEYS.map((key) => (
              <MetricRow
                key={key}
                label={STAT_LABELS[key]}
                iconName={STAT_ICONS[key]}
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
