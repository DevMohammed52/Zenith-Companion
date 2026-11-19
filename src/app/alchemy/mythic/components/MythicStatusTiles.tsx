"use client";

import React from "react";
import type { MythicLabStats } from "../types";
import styles from "../page.module.css";

export function MythicStatusTiles({
  activeRowsCount,
  labStats,
  mythicRecipesCount,
}: {
  activeRowsCount: number;
  labStats: MythicLabStats;
  mythicRecipesCount: number;
}) {
  return (
    <section className={styles.labStatus} aria-label="Mythic lab status">
      <div className={styles.statusTile}>
        <span>Projects</span>
        <strong>{activeRowsCount.toLocaleString()}</strong>
        <small>{labStats.usesRemaining.toLocaleString()} uses queued</small>
      </div>
      <div className={styles.statusTile}>
        <span>Profitable</span>
        <strong>{labStats.profitableProjects.toLocaleString()}</strong>
        <small>
          {activeRowsCount > 0 ? "based on current inputs" : "pin recipes to model"}
        </small>
      </div>
      <div
        className={`${styles.statusTile} ${
          labStats.priceGapProjects > 0 ? styles.warn : ""
        }`}
      >
        <span>Price Gaps</span>
        <strong>
          {labStats.priceGapProjects > 0
            ? labStats.priceGapProjects.toLocaleString()
            : "Clear"}
        </strong>
        <small>
          {labStats.priceGapProjects > 0
            ? "custom prices recommended"
            : "inputs look complete"}
        </small>
      </div>
      <div
        className={`${styles.statusTile} ${
          labStats.warningProjects > 0 ? styles.warn : ""
        }`}
      >
        <span>Market Risk</span>
        <strong>
          {labStats.warningProjects > 0
            ? labStats.warningProjects.toLocaleString()
            : "Clear"}
        </strong>
        <small>
          {labStats.warningProjects > 0
            ? "review liquidity notes"
            : `${mythicRecipesCount.toLocaleString()} recipes indexed`}
        </small>
      </div>
    </section>
  );
}
