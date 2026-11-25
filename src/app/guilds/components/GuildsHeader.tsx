"use client";

import React from "react";
import { Button, Card, Icon } from "@/components/ui";
import {
  formatGuildAge,
  formatGuildNumber,
  type GuildDatabase,
} from "@/lib/guilds";
import styles from "../page.module.css";

export interface GuildsHeaderProps {
  database: GuildDatabase | null;
  conquestGuildCount: number;
  openSlotsGuildCount: number;
  onOpenGuide: () => void;
}

export function GuildsHeader({
  database,
  conquestGuildCount,
  openSlotsGuildCount,
  onOpenGuide,
}: GuildsHeaderProps) {
  return (
    <Card padding="md" className={styles.heroCard}>
      <header className={styles.heroTop}>
        <div className={styles.heroTitleBlock}>
          <span className={styles.eyebrow}>
            <Icon name="guilds" size="sm" aria-hidden="true" />
            <span>Guild Registry</span>
          </span>
          <h1 className={styles.pageTitle}>Guild Database</h1>
          <p className={styles.pageSubtitle}>
            Compare seasonal rankings, check roster capacity and open slots, inspect leadership rosters, and trace live Conquest presence.
          </p>

          <div className={styles.contextStrip} aria-label="Registry summary">
            <span className={styles.contextItem}>
              <strong>{formatGuildNumber(database?.meta.totals.guilds)}</strong> guilds
            </span>
            <span className={styles.vDivider} aria-hidden="true" />
            <span className={styles.contextItem}>
              <strong>{formatGuildNumber(database?.meta.totals.members)}</strong> members tracked
            </span>
            <span className={styles.vDivider} aria-hidden="true" />
            <span className={styles.contextItem}>
              <strong>{formatGuildNumber(openSlotsGuildCount)}</strong> active with open slots
            </span>
            <span className={styles.vDivider} aria-hidden="true" />
            <span className={styles.contextItem}>
              <strong>{formatGuildNumber(conquestGuildCount)}</strong> active in Conquest
            </span>
            <span className={styles.vDivider} aria-hidden="true" />
            <span className={styles.contextItem}>
              Updated {formatGuildAge(database?.meta.source_fetched_at)}
            </span>
          </div>
        </div>

        <div className={styles.heroActions}>
          <Button
            variant="secondary"
            size="sm"
            icon={<Icon name="info" size="sm" />}
            onClick={onOpenGuide}
          >
            Guild Rules &amp; Offline
          </Button>
        </div>
      </header>
    </Card>
  );
}
