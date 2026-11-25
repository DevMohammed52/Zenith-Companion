"use client";

import { ShardIcon } from "@/components/GoldIcon";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Select, type SelectOption } from "@/components/ui/Select";
import { formatAssaultCountdown, formatConquestAge, formatConquestNumber } from "@/lib/conquest";
import type { UseConquestStateReturn } from "../types";
import styles from "../page.module.css";

export default function ConquestHero({
  state,
  onOpenRewards,
}: {
  state: Pick<
    UseConquestStateReturn,
    | "data"
    | "seasonIndex"
    | "selectedSeason"
    | "setSelectedSeason"
    | "isHistoricalSeason"
    | "seasonLoading"
    | "activeAssaults"
  >;
  onOpenRewards: () => void;
}) {
  const {
    data,
    seasonIndex,
    selectedSeason,
    setSelectedSeason,
    isHistoricalSeason,
    seasonLoading,
    activeAssaults,
  } = state;
  if (!data) return null;

  const currentSeasonNum = seasonIndex?.current_season ?? data.meta.season_number;
  const currentSummary = seasonIndex?.seasons.find((s) => s.season_number === currentSeasonNum);
  const seasonOptions: SelectOption[] = [
    {
      value: "current",
      label: currentSeasonNum ? `Season ${currentSeasonNum} (Current)` : "Current Season",
      description: currentSummary
        ? `${formatConquestNumber(currentSummary.zones_count)} zones · Live`
        : "Live season standings",
    },
    ...(seasonIndex?.seasons ?? [])
      .filter((s) => s.season_number !== currentSeasonNum)
      .map((s) => ({
        value: String(s.season_number),
        label: `Season ${s.season_number}`,
        description: s.top_guild?.name ? `Top guild: ${s.top_guild.name}` : "Archived season",
      })),
  ];

  const activeSeasonLabel = isHistoricalSeason
    ? `Season ${selectedSeason} Archive`
    : currentSeasonNum
      ? `Season ${currentSeasonNum}`
      : "Current season";

  const firstAssault = activeAssaults[0];
  const assaultCountdown = firstAssault ? formatAssaultCountdown(firstAssault.assault.ends_at) : null;
  const liveStatusText = isHistoricalSeason
    ? "Completed season"
    : activeAssaults.length > 0
      ? `${activeAssaults.length} active assault${activeAssaults.length === 1 ? "" : "s"}${assaultCountdown ? ` (${assaultCountdown})` : ""}`
      : "No active assaults";

  return (
    <section className={styles.hero}>
      <div className={styles.heroMain}>
        <div className={styles.eyebrow}>
          <Icon name="conquest" size="sm" aria-hidden="true" />
          <span>Guild Conquest</span>
        </div>
        <h1 id="conquest-page-title" className={styles.title}>Conquest</h1>
        <p className={styles.subtitle}>
          Territory control, active assault timers, guild standings, and archived seasons.
        </p>
        <div className={styles.heroStrip} aria-label="Season summary">
          <span>{activeSeasonLabel}</span>
          <span>{liveStatusText}</span>
          {!isHistoricalSeason && <span>Updated {formatConquestAge(data.meta.generated_at)}</span>}
        </div>
      </div>

      <div className={styles.heroControls}>
        <Button
          variant="secondary"
          size="md"
          onClick={onOpenRewards}
          icon={<ShardIcon size={14} />}
        >
          Buffs &amp; Shards
        </Button>
        <div className={styles.seasonPicker}>
          <Select
            options={seasonOptions}
            value={selectedSeason}
            onChange={(val) => setSelectedSeason(val)}
            disabled={seasonLoading}
            aria-label="Select conquest season"
          />
        </div>
      </div>
    </section>
  );
}
