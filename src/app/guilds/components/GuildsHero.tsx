"use client";

import React from "react";
import { Activity, Database, Shield, Users } from "lucide-react";
import ZenithIcon from "@/components/icons/ZenithIcon";
import {
  formatGuildAge,
  formatGuildNumber,
  type GuildDatabase,
  type GuildRefreshTier,
} from "@/lib/guilds";
import styles from "../page.module.css";

export interface GuildsHeroProps {
  database: GuildDatabase | null;
  tierCounts: Record<GuildRefreshTier, number>;
  filteredGuildsCount: number;
}

export function GuildsHero({
  database,
  tierCounts,
  filteredGuildsCount,
}: GuildsHeroProps) {
  return (
    <>
      <section className={styles.hero}>
        <div>
          <div className={styles.eyebrow}><ZenithIcon name="guild" size={15} /> Guild reference</div>
          <h1 className={styles.title}>Guild Database</h1>
          <p className={styles.subtitle}>
            Search guilds, compare season ranks and refresh tiers, and view rosters, leaders, bios, and controlled zones.
          </p>
        </div>

        <div className={styles.freshness}>
          <span>Baseline fetched</span>
          <strong>{formatGuildAge(database?.meta.source_fetched_at)}</strong>
          <span>{database?.meta.source_fetched_at ? new Date(database.meta.source_fetched_at).toLocaleString() : "Waiting for data"}</span>
        </div>
      </section>

      <section className={styles.statsGrid} aria-label="Guild database summary">
        <div className={styles.stat}>
          <span className={styles.statIcon}>
            <Database size={18} />
          </span>
          <div>
            <div className={styles.statValue}>{formatGuildNumber(database?.meta.totals.guilds)}</div>
            <div className={styles.statLabel}>Guilds indexed</div>
          </div>
        </div>
        <div className={styles.stat}>
          <span className={styles.statIcon}>
            <Users size={18} />
          </span>
          <div>
            <div className={styles.statValue}>{formatGuildNumber(database?.meta.totals.members)}</div>
            <div className={styles.statLabel}>Member rows</div>
          </div>
        </div>
        <div className={styles.stat}>
          <span className={styles.statIcon}>
            <Activity size={18} />
          </span>
          <div>
            <div className={styles.statValue}>{formatGuildNumber(tierCounts.hot)}</div>
            <div className={styles.statLabel}>Active refresh tier</div>
          </div>
        </div>
        <div className={styles.stat}>
          <span className={styles.statIcon}>
            <Shield size={18} />
          </span>
          <div>
            <div className={styles.statValue}>{formatGuildNumber(filteredGuildsCount)}</div>
            <div className={styles.statLabel}>Filtered guilds</div>
          </div>
        </div>
      </section>
    </>
  );
}
