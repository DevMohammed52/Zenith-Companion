"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { Pagination } from "@/components/ui/Pagination";
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

const GLOBAL_PAGE_SIZE = 10;

export default function ConquestGlobalLeaders({
  data,
  seasonLeaders,
  guildLevels,
}: {
  data: ConquestData;
  seasonLeaders: UseConquestStateReturn["seasonLeaders"];
  guildLevels: Record<number, number>;
}) {
  const [contribPage, setContribPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(data.top_contributors.length / GLOBAL_PAGE_SIZE));
  const safePage = Math.min(contribPage, totalPages);
  const visibleContributors = data.top_contributors.slice(
    (safePage - 1) * GLOBAL_PAGE_SIZE,
    safePage * GLOBAL_PAGE_SIZE,
  );

  return (
    <section className={styles.globalGrid}>
      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <h3>
            <Icon name="conquest" size="md" aria-hidden="true" />
            Season Zone Leaders
          </h3>
        </div>
        <div className={styles.panelBody}>
          <div className={styles.rowList}>
            {seasonLeaders.map(({ zone, row }) => {
              const lvl = row.guild?.id != null ? guildLevels[row.guild.id] : undefined;
              return (
                <a
                  key={`${zone.key}-${row.guild?.id ?? row.guild?.name}`}
                  className={styles.leaderRow}
                  href={getGuildDatabaseUrl(row.guild)}
                >
                  <span className={styles.rank}>#{row.position ?? "-"}</span>
                  <GuildIcon guild={row.guild} />
                  <span className={styles.rowMain}>
                    <strong>{row.guild?.name ?? "Unknown Guild"}</strong>
                    <span className={styles.metaStrip}>
                      <span>{zone.name}</span>
                      <span>{formatConquestPercent(getConquestRatio(row.experience, zone.experience))} share</span>
                      {lvl ? <span>Lv {lvl}</span> : null}
                    </span>
                  </span>
                  <span className={`${styles.rowStats} ${styles.statStrip}`}>
                    <span>{formatConquestNumber(row.experience)} XP</span>
                    <span>{formatConquestNumber(row.kills)} kills</span>
                  </span>
                </a>
              );
            })}
          </div>
        </div>
      </div>

      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <h3>
            <Icon name="guilds" size="md" aria-hidden="true" />
            Top Contributors
          </h3>
        </div>
        <div className={styles.panelBody}>
          <div className={styles.rowList}>
            {visibleContributors.map((row, index) => (
              <ContributorRow
                key={`global-${row.zone.key}-${row.id ?? `${row.character?.name ?? "player"}-${index}`}`}
                row={row}
                zoneName={row.zone.name}
              />
            ))}
          </div>
          {totalPages > 1 && (
            <Pagination
              currentPage={safePage}
              totalPages={totalPages}
              totalItems={data.top_contributors.length}
              pageSize={GLOBAL_PAGE_SIZE}
              itemLabel="contributors"
              showSummary={false}
              scrollToTop={false}
              onPageChange={setContribPage}
            />
          )}
        </div>
      </div>
    </section>
  );
}
