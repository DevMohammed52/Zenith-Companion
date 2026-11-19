"use client";

import { Crosshair, Flame, Shield, Trophy } from "lucide-react";
import {
  formatConquestDecimal,
  formatConquestNumber,
} from "@/lib/conquest";
import {
  getDominantGuild,
  getLeaderMargin,
  getXpPerKill,
  type UseConquestStateReturn,
} from "../types";
import styles from "../page.module.css";

export default function ConquestCommandGrid({
  state,
}: {
  state: Pick<
    UseConquestStateReturn,
    "activeAssaults" | "tightestRace" | "highestYieldZone" | "lockedZones"
  >;
}) {
  const { activeAssaults, tightestRace, highestYieldZone, lockedZones } = state;

  return (
    <section className={styles.commandGrid} aria-label="Conquest highlights">
      <article className={styles.commandCard} data-tone={activeAssaults.length > 0 ? "hot" : "calm"}>
        <div className={styles.commandIcon}>
          <Flame size={18} />
        </div>
        <div>
          <span>Active Assault</span>
          <strong>{activeAssaults[0]?.zone.name ?? "None"}</strong>
          <p>
            {activeAssaults[0]?.assault.guild?.name
              ? `${activeAssaults[0].assault.guild.name} attacking`
              : "No active assaults"}
          </p>
        </div>
      </article>
      <article className={styles.commandCard} data-tone="warn">
        <div className={styles.commandIcon}>
          <Crosshair size={18} />
        </div>
        <div>
          <span>Closest Race</span>
          <strong>{tightestRace?.name ?? "None"}</strong>
          <p>
            {tightestRace
              ? `${getDominantGuild(tightestRace)?.name ?? "Leader"} +${formatConquestNumber(getLeaderMargin(tightestRace))} XP`
              : "No contested zones"}
          </p>
        </div>
      </article>
      <article className={styles.commandCard} data-tone="active">
        <div className={styles.commandIcon}>
          <Trophy size={18} />
        </div>
        <div>
          <span>Top Yield</span>
          <strong>{highestYieldZone?.name ?? "None"}</strong>
          <p>
            {highestYieldZone
              ? `${formatConquestDecimal(getXpPerKill(highestYieldZone))} XP / kill`
              : "No yield data"}
          </p>
        </div>
      </article>
      <article className={styles.commandCard} data-tone="calm">
        <div className={styles.commandIcon}>
          <Shield size={18} />
        </div>
        <div>
          <span>Controlled</span>
          <strong>{formatConquestNumber(lockedZones.length)} Zones</strong>
          <p>95%+ single-guild control</p>
        </div>
      </article>
    </section>
  );
}
