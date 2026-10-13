"use client";

import { useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Check, Copy } from "lucide-react";
import styles from "../AdminDashboard.module.css";
import type { Tone } from "../types";

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

export function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
  tone = "neutral",
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  detail: string;
  tone?: Tone;
}) {
  return (
    <div className={`${styles.metricCard} ${tone !== "neutral" ? toneClass(tone) : ""}`}>
      <span className={styles.metricLabel}>
        <Icon size={15} />
        {label}
      </span>
      <div className={styles.metricValue}>{value}</div>
      <div className={styles.metricDetail}>{detail}</div>
    </div>
  );
}

export function Panel({
  icon: Icon,
  title,
  subtitle,
  action,
  children,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className={styles.panel}>
      <div className={styles.panelHeader}>
        <div className={styles.panelTitleGroup}>
          <h2 className={styles.panelTitle}>
            <Icon size={16} />
            <span>{title}</span>
          </h2>
          {subtitle ? <span className={styles.panelSubtitle}>{subtitle}</span> : null}
        </div>
        {action ? <div>{action}</div> : null}
      </div>
      {children}
    </section>
  );
}

export function CopyButton({
  value,
  label = "Copy",
}: {
  value: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Fallback for environments without clipboard API permission
    }
  }

  return (
    <button
      type="button"
      className={styles.copyBtn}
      onClick={() => void handleCopy()}
      aria-label={copied ? `Copied ${value}` : `${label} ${value}`}
      title={value}
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
      <span>{copied ? "Copied" : label}</span>
    </button>
  );
}

export function EmptyBlock({ text }: { text: string }) {
  return <div className={styles.emptyState}>{text}</div>;
}
