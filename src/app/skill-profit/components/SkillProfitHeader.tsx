"use client";

import { Filter } from "lucide-react";
import { formatGold } from "@/lib/format";
import { formatHours } from "@/lib/housing";
import ZenithIcon from "@/components/icons/ZenithIcon";
import { SKILLS, type SkillName, type SkillProfitRow } from "@/lib/skill-profit";
import styles from "../page.module.css";
import { Metric } from "./SkillProfitControls";
import { getProfitCardValue, getProfitSummary } from "../types";

export interface SkillProfitHeaderProps {
  profileLabel: string;
  scopeLabel: string;
  saleModeLabel: string;
  topRoute: SkillProfitRow | null;
  rowsCount: number;
  filteredCount: number;
  marketAgeMinutes: number | null;
  buffTotals: { efficiency: number; experience: number };
  housingWindowAllValue: string;
  housingWindowAllSub: string;
  activeSkillHousingLabel: string;
  activeSkillHousingHours: number;
  housingWindowSub: string;
  activeSkill: SkillName | "All";
  onSelectSkill: (skill: SkillName | "All") => void;
  topBySkill: Map<SkillName, SkillProfitRow>;
  counts: Map<SkillName, number>;
  forgeRecipesCount: number;
  onSelectRow: (row: SkillProfitRow) => void;
  prefetchItem: (name: string) => void;
}

export function SkillProfitHeader({
  profileLabel,
  scopeLabel,
  saleModeLabel,
  topRoute,
  rowsCount,
  filteredCount,
  marketAgeMinutes,
  buffTotals,
  housingWindowAllValue,
  housingWindowAllSub,
  activeSkillHousingLabel,
  activeSkillHousingHours,
  housingWindowSub,
  activeSkill,
  onSelectSkill,
  topBySkill,
  counts,
  forgeRecipesCount,
  onSelectRow,
  prefetchItem,
}: SkillProfitHeaderProps) {
  return (
    <>
      <section className={styles.hero}>
        <div className={styles.heroIntro}>
          <div className={styles.heroCopy}>
            <div className={styles.eyebrow}>Skill Profit Finder</div>
            <h1 className={styles.title}>
              Skill Profit Routes <ZenithIcon name="skill" size={22} />
            </h1>
            <p className={styles.heroSubtitle}>
              Rank gathering, crafting, cooking, and construction routes with taxes, tools, buffs, and costs.
            </p>
          </div>
          <div className={styles.heroChips} aria-label="Current skill profit inputs">
            <span>{profileLabel}</span>
            <span>{scopeLabel}</span>
            <span>{saleModeLabel} sell</span>
          </div>
        </div>
        <button
          aria-label={topRoute ? `Open best liquid route ${topRoute.name}` : "Best liquid route is waiting for data"}
          className={styles.spotlightCard}
          disabled={!topRoute}
          onClick={() => topRoute && onSelectRow(topRoute)}
          onMouseEnter={() => topRoute && prefetchItem(topRoute.name)}
          type="button"
        >
          <span className={styles.spotlightLabel}>Best liquid route</span>
          <strong>{topRoute?.name || "Waiting for data"}</strong>
          <small>{topRoute ? `${topRoute.skill} Lvl ${topRoute.level} - ${getProfitSummary(topRoute)}` : "Market data is loading"}</small>
          <span className={styles.spotlightMetrics}>
            <span>
              <em>Profit</em>
              <strong>{topRoute ? getProfitCardValue(topRoute) : "0g/hr"}</strong>
            </span>
            <span>
              <em>Cost</em>
              <strong>{topRoute ? `${formatGold(topRoute.inputCost)}g` : "0g"}</strong>
            </span>
            <span>
              <em>Volume</em>
              <strong>{topRoute ? topRoute.stableVolume3d.toLocaleString() : "0"}</strong>
            </span>
          </span>
        </button>
        <div className={styles.heroStats}>
          <Metric label="Market age" value={marketAgeMinutes === null ? "Waiting" : marketAgeMinutes < 1 ? "Fresh" : `${marketAgeMinutes}m`} sub={`${rowsCount.toLocaleString()} rows`} />
          <Metric label="Buff totals" value={`+${buffTotals.efficiency}% eff / +${buffTotals.experience}% exp`} sub={activeSkill === "Construction" ? "ascension ignored" : "active buffs"} />
          <Metric
            label="Housing Idle Buffs"
            value={activeSkill === "All"
              ? housingWindowAllValue
              : activeSkillHousingHours > 0 ? `${activeSkillHousingLabel} +${formatHours(activeSkillHousingHours)}` : "None"}
            sub={activeSkill === "All"
              ? housingWindowAllSub
              : housingWindowSub}
          />
          <Metric label="Results" value={filteredCount.toLocaleString()} sub={`${scopeLabel} routes`} />
        </div>
      </section>

      <section className={styles.overviewGrid}>
        {SKILLS.map((skill) => {
          const top = topBySkill.get(skill);
          return (
            <button
              aria-pressed={activeSkill === skill}
              className={`${styles.skillCard} ${activeSkill === skill ? styles.skillCardActive : ""}`}
              key={skill}
              onClick={() => onSelectSkill(skill)}
              title={skill === "Forge" ? `${forgeRecipesCount} forge recipes loaded for display only` : top ? `${top.name}: ${getProfitSummary(top)}` : "No liquid route"}
              type="button"
            >
              <div className={styles.skillCardTop}>
                <span>{skill}</span>
                <span>{(counts.get(skill) || 0).toLocaleString()}</span>
              </div>
              <div className={styles.skillCardBody}>
                <span>{skill === "Forge" ? "Info only" : top?.name || "No liquid route"}</span>
                <strong>{skill === "Forge" ? `${forgeRecipesCount} recipes` : top ? getProfitCardValue(top) : "0g/hr"}</strong>
              </div>
            </button>
          );
        })}
      </section>
      <div className={styles.forgeHandoff}>
        <span>Forge recipes are informational here and hidden from All results by default.</span>
        <a href="/forge">Open Forge Planner</a>
      </div>
    </>
  );
}

export interface SkillProfitTabsProps {
  activeSkill: SkillName | "All";
  onSelectSkill: (skill: SkillName | "All") => void;
  filteredCount: number;
}

export function SkillProfitTabs({
  activeSkill,
  onSelectSkill,
  filteredCount,
}: SkillProfitTabsProps) {
  return (
    <section className={styles.tableHeader}>
      <div className={styles.tabRow}>
        {(["All", ...SKILLS] as const).map((skill) => (
          <button
            key={skill}
            aria-pressed={activeSkill === skill}
            className={`${styles.tab} ${activeSkill === skill ? styles.tabActive : ""}`}
            onClick={() => onSelectSkill(skill)}
            type="button"
          >
            {skill}
          </button>
        ))}
      </div>
      <div className={styles.panelMeta}>
        <Filter size={13} /> {filteredCount.toLocaleString()} rows
      </div>
    </section>
  );
}
