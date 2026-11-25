"use client";

import { ShardIcon } from "@/components/GoldIcon";
import { ModalSheet } from "@/components/ui/ModalSheet";
import { CONQUEST_RULER_TIERS, CONQUEST_SHARD_REWARDS, formatConquestNumber } from "@/lib/conquest";
import styles from "../page.module.css";

export default function ConquestRewardsModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return (
    <ModalSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Conquest Territory Buffs & Shards"
      description="Applies across all conquest zones. Buffs and shard payouts depend on final season rank."
      maxWidth="md"
    >
      <div className={styles.rewardsPanel}>
        <section className={styles.rewardsBlock}>
          <div className={styles.rewardsHeading}>
            <h3>Territory Ruling Buffs (Top 10 Guilds)</h3>
            <p>
              Top 10 guilds at season end rule a zone for the next season. Combat EXP applies during
              the 14-day assault cooldown window.
            </p>
          </div>
          <div className={styles.rewardsGrid}>
            {CONQUEST_RULER_TIERS.map((tier) => (
              <div key={tier.rankLabel} className={styles.rewardRow}>
                <strong>{tier.rankLabel}</strong>
                <span>+{tier.primaryExpPercent}% Primary / Dungeon / WB / Combat / Hunt / Slayer EXP</span>
                <small>
                  +{tier.primaryEffPercent}% Eff · +{tier.dungeonMagicFindPercent}% Dungeon &amp; WB MF
                </small>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.rewardsBlock}>
          <div className={styles.rewardsHeading}>
            <h3>Individual Zone Shards (Ranks 1–25)</h3>
            <p>
              Rewards are awarded separately for the zone EXP Leaderboard and Kills Leaderboard at season end.
            </p>
          </div>
          <div className={styles.shardTable} role="table" aria-label="Individual Zone Shards by rank and leaderboard">
            <div className={styles.shardHeaderRow} role="row">
              <span role="columnheader">Rank</span>
              <span role="columnheader">EXP Leaderboard</span>
              <span role="columnheader">Kills Leaderboard</span>
            </div>
            {CONQUEST_SHARD_REWARDS.map((tier) => (
              <div key={tier.rankLabel} className={styles.shardRow} role="row">
                <strong role="cell">{tier.rankLabel}</strong>
                <span className={styles.inlineShard} role="cell">
                  <ShardIcon size={12} />
                  <span>{formatConquestNumber(tier.expShards)} shards</span>
                </span>
                <span className={styles.inlineShard} role="cell">
                  <ShardIcon size={12} />
                  <span>{formatConquestNumber(tier.killsShards)} shards</span>
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </ModalSheet>
  );
}
