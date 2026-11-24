"use client";

import React, { ReactNode } from "react";
import styles from "./StatCard.module.css";

export interface StatDelta {
  direction: "up" | "down" | "neutral";
  value: string;
  sentiment?: "positive" | "negative" | "neutral";
}

export interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  delta?: StatDelta;
  context?: string;
  icon?: ReactNode;
  className?: string;
}

export function StatCard({
  label,
  value,
  unit,
  delta,
  context,
  icon,
  className = "",
}: StatCardProps) {
  const sentiment = delta?.sentiment || (delta?.direction === "up" ? "positive" : delta?.direction === "down" ? "negative" : "neutral");
  const deltaClass = delta ? styles[`delta_${sentiment}`] : "";
  const glyph = delta?.direction === "up" ? "▲" : delta?.direction === "down" ? "▼" : "•";

  return (
    <dl className={`${styles.statCard} ${className}`.trim()}>
      <div className={styles.header}>
        <dt className={styles.label}>{label}</dt>
        {icon && <span className={styles.iconSlot} aria-hidden="true">{icon}</span>}
      </div>

      <dd className={styles.valueRow}>
        <span className={styles.value}>
          {typeof value === "number" ? value.toLocaleString() : value}
          {unit && <span className={styles.unit}>{unit}</span>}
        </span>

        {delta && (
          <span
            className={`${styles.delta} ${deltaClass}`}
            aria-label={`${delta.direction === "up" ? "Increased" : delta.direction === "down" ? "Decreased" : "Changed"} by ${delta.value}`}
          >
            <span aria-hidden="true">{glyph}</span>
            <span>{delta.value}</span>
          </span>
        )}
      </dd>

      {context && <dd className={styles.context}>{context}</dd>}
    </dl>
  );
}
