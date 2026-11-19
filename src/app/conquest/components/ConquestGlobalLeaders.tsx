"use client";

import { Crown, Trophy } from "lucide-react";
import {
  formatConquestNumber,
  formatConquestPercent,
  getConquestRatio,
  getGuildDatabaseUrl,
  type ConquestData,
} from "@/lib/conquest";
import type { UseConquestStateReturn } from "../types";
import { ContributorRow, GuildIcon } from "./ConquestRows";
import styles from "../page.module.css";

export default function ConquestGlobalLeaders({
  data,
  seasonLeaders,
}: {
  data: ConquestData;
  seasonLeaders: UseConquestStateReturn["seasonLeaders"];
}) {
  return (
    <section className={styles.globalGrid}>
      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <h3>
            <Trophy size={18} />
            Season Zone Leaders
          </h3>
        </div>
        <div className={styles.panelBody}>
          <div className={styles.rowList}>
            {seasonLeaders.map(({ zone, row }) => (
              <a
                key={`${zone.key}-${row.guild?.id ?? row.guild?.name}`}
                className={styles.leaderRow}
                href={getGuildDatabaseUrl(row.guild)}
              >
                <span className={styles.rank}>#{row.position ?? "-"}</span>
                <GuildIcon guild={row.guild} />
                <span className={styles.rowMain}>
                  <strong>{row.guild?.name ?? "Unknown Guild"}</strong>
                  <span>
                    {zone.name} - {formatConquestPercent(getConquestRatio(row.experience, zone.experience))} share
                  </span>
                </span>
                <span className={styles.rowStats}>
                  <span>{formatConquestNumber(row.experience)} XP</span>
                  <span>{formatConquestNumber(row.kills)} kills</span>
                </span>
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <h3>
            <Crown size={18} />
            Top Contributors
          </h3>
        </div>
        <div className={styles.panelBody}>
          <div className={styles.rowList}>
            {data.top_contributors.slice(0, 12).map((row, index) => (
              <ContributorRow
                key={`global-${row.zone.key}-${row.id ?? `${row.character?.name ?? "player"}-${index}`}`}
                row={row}
                zoneName={row.zone.name}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
