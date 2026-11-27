"use client";

import { useState, type ReactNode } from "react";
import { Badge, Button, Card, EmptyState, ProgressBar, type BadgeVariant } from "@/components/ui";
import { Icon } from "@/components/ui/Icon";
import type { IconConcept } from "@/lib/icons";
import type { Tone } from "../types";
import styles from "../AdminDashboard.module.css";

export function toneBadgeVariant(tone: Tone): BadgeVariant {
  switch (tone) {
    case "good":
      return "success";
    case "warn":
      return "warning";
    case "bad":
      return "danger";
    default:
      return "neutral";
  }
}

export function toneClass(tone: Tone): string {
  switch (tone) {
    case "good":
      return styles.toneGood;
    case "warn":
      return styles.toneWarn;
    case "bad":
      return styles.toneBad;
    default:
      return styles.toneNeutral;
  }
}

export interface KpiStripItem {
  label: string;
  value: string;
  sublabel?: string;
  tone?: Tone;
  icon?: IconConcept;
}

/**
 * Unified horizontal metric strip separated by 1px vertical hairline dividers
 * to avoid noisy nested card borders inside panels.
 */
export function KpiStrip({
  items,
  ariaLabel,
}: {
  items: KpiStripItem[];
  ariaLabel: string;
}) {
  return (
    <div className={styles.kpiStrip} role="region" aria-label={ariaLabel}>
      {items.map((item) => (
        <div key={item.label} className={styles.kpiCell}>
          <span className={styles.kpiLabel}>
            {item.icon ? <Icon name={item.icon} size="xs" aria-hidden="true" /> : null}
            <span>{item.label}</span>
          </span>
          <strong className={`${styles.kpiValue} ${item.tone ? toneClass(item.tone) : ""}`}>
            {item.value}
          </strong>
          {item.sublabel ? <span className={styles.kpiSub}>{item.sublabel}</span> : null}
        </div>
      ))}
    </div>
  );
}

export function Panel({
  icon,
  title,
  subtitle,
  action,
  children,
}: {
  icon: IconConcept;
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card variant="elevated" padding="md" className={styles.panelCard}>
      <div className={styles.panelHeader}>
        <div className={styles.panelTitleGroup}>
          <h2 className={styles.panelTitle}>
            <Icon name={icon} size="md" aria-hidden="true" />
            <span>{title}</span>
          </h2>
          {subtitle ? <p className={styles.panelSubtitle}>{subtitle}</p> : null}
        </div>
        {action ? <div className={styles.panelAction}>{action}</div> : null}
      </div>
      {children}
    </Card>
  );
}

export function CopyButton({
  value,
  label = "Copy",
  onCopied,
}: {
  value: string;
  label?: string;
  onCopied?: (value: string, label: string) => void;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      onCopied?.(value, label);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Ignore clipboard denials in non-secure test contexts
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className={styles.copyBtn}
      onClick={() => void handleCopy()}
      aria-label={copied ? `Copied ${value}` : `${label} ${value}`}
      title={value}
      icon={<Icon name={copied ? "check" : "copy"} size="xs" aria-hidden="true" />}
    >
      {copied ? "Copied" : label}
    </Button>
  );
}

export function ShareBreakdownList({
  items,
  emptyTitle,
}: {
  items: Array<{ key: string; label: string; valueText: string; value: number }>;
  emptyTitle: string;
}) {
  if (!items.length) {
    return <EmptyBlock text={emptyTitle} />;
  }
  const total = Math.max(1, items.reduce((sum, item) => sum + item.value, 0));

  return (
    <div className={styles.shareList}>
      {items.map((item) => {
        const pct = total > 0 ? Math.round((item.value / total) * 1000) / 10 : 0;
        return (
          <div key={item.key} className={styles.shareListRow}>
            <div className={styles.shareListTop}>
              <span className={styles.shareListLabel} title={item.label}>
                {item.label}
              </span>
              <span className={styles.shareListMeta}>
                {item.valueText} ({pct}%)
              </span>
            </div>
            <ProgressBar
              value={pct}
              min={0}
              max={100}
              size="sm"
              showReadout={false}
              ariaLabel={`${item.label} share ${pct}%`}
            />
          </div>
        );
      })}
    </div>
  );
}

export function StatusPill({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: Tone;
}) {
  return (
    <Badge variant={toneBadgeVariant(tone)} size="sm">
      {label}
    </Badge>
  );
}

export function EmptyBlock({ text }: { text: string }) {
  return <EmptyState variant="no-data" size="sm" title={text} />;
}
