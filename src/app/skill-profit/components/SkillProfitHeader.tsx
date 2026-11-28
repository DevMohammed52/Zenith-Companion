"use client";

import Link from "next/link";
import { GameImage } from "@/components/GameImage";
import { GoldIcon } from "@/components/GoldIcon";
import { Badge, Button, Icon, Tab, TabList, Tabs } from "@/components/ui";
import { formatGold } from "@/lib/format";
import { formatHours } from "@/lib/housing";
import type { IconConcept } from "@/lib/icons";
import { SKILLS, type SkillName, type SkillProfitRow } from "@/lib/skill-profit";
import styles from "../page.module.css";
import { Metric } from "./SkillProfitControls";
import { getDisplayProfitPerHour, type RateMode } from "../types";

const SKILL_TAB_ICONS: Record<SkillName, IconConcept> = {
  Woodcutting: "skillWoodcutting",
  Mining: "skillMining",
  Fishing: "skillFishing",
  Alchemy: "alchemy",
  Smelting: "skillSmelting",
  Cooking: "skillCooking",
  Construction: "skillConstruction",
  Forge: "forge",
};

export interface SkillProfitHeaderProps {
  profileLabel: string;
  membership: boolean;
  topRoute: SkillProfitRow | null;
  rowsCount: number;
  filteredCount: number;
  liquidRouteCount: number;
  marketAgeMinutes: number | null;
  buffTotals: { efficiency: number; experience: number };
  baseIdleActionHours: number;
  activeSkillHousingLabel: string;
  activeSkillHousingHours: number;
  housingWindowAllValue: string;
  housingWindowAllSub: string;
  housingWindowSub: string;
  activeSkill: SkillName | "All";
  rateMode: RateMode;
  activeModifierCount: number;
  onOpenDrawer: () => void;
  allItemsDb?: Record<string, any> | null;
  onSelectRow: (row: SkillProfitRow) => void;
  prefetchItem: (name: string) => void;
}

function formatMarketAge(minutes: number | null): string {
  if (minutes === null) return "Loading market";
  if (minutes < 1) return "Fresh market";
  if (minutes >= 60) return `${Math.floor(minutes / 60)}h ${minutes % 60}m ago`;
  return `${minutes}m ago`;
}

export function SkillProfitHeader({
  profileLabel,
  membership,
  topRoute,
  rowsCount,
  filteredCount,
  liquidRouteCount,
  marketAgeMinutes,
  buffTotals,
  baseIdleActionHours,
  activeSkillHousingLabel,
  activeSkillHousingHours,
  housingWindowAllValue,
  housingWindowAllSub,
  housingWindowSub,
  activeSkill,
  rateMode,
  activeModifierCount,
  onOpenDrawer,
  allItemsDb,
  onSelectRow,
  prefetchItem,
}: SkillProfitHeaderProps) {
  const topImage = topRoute ? allItemsDb?.[topRoute.name]?.image_url : undefined;
  const hourlyProfit = topRoute ? getDisplayProfitPerHour(topRoute) : null;
  const topIdleHours = topRoute ? baseIdleActionHours + topRoute.housingWindowHours : baseIdleActionHours;
  const sessionProfit =
    topRoute && hourlyProfit !== null
      ? Math.round(hourlyProfit * topIdleHours)
      : null;

  const spotlightProfitLabel =
    !topRoute || hourlyProfit === null
      ? "Needs price"
      : rateMode === "session" && sessionProfit !== null
        ? `${formatGold(sessionProfit)}g / session`
        : `${formatGold(hourlyProfit)}g/hr`;

  return (
    <header className={styles.headerBlock}>
      <div className={styles.titleRow}>
        <div className={styles.titleGroup}>
          <span className={styles.eyebrow}>
            <Icon name="skillProfit" size="sm" aria-hidden="true" />
            <span>
              {profileLabel} | {rowsCount.toLocaleString()} routes
            </span>
          </span>
          <h1 className={styles.title}>Skill Profit Planner</h1>
        </div>

        <div className={styles.headerActions}>
          <Badge size="sm" variant={membership ? "success" : "neutral"}>
            {membership ? "12% Member tax" : "15% Free tax"}
          </Badge>
          <Link href="/forge" className={styles.forgeLink}>
            <span>Forge Planner</span>
            <Icon name="arrowRight" size="xs" aria-hidden="true" />
          </Link>
          <Button
            variant="secondary"
            size="md"
            icon={<Icon name="filter" size="sm" aria-hidden="true" />}
            onClick={onOpenDrawer}
          >
            Loadout &amp; Boosts{activeModifierCount > 0 ? ` (${activeModifierCount})` : ""}
          </Button>
        </div>
      </div>

      <section className={styles.spotlightCard} aria-label="Recommended route and active bonuses">
        <button
          aria-label={topRoute ? `Open top route ${topRoute.name}` : "Top route loading"}
          className={styles.spotlightBtn}
          disabled={!topRoute}
          onClick={() => topRoute && onSelectRow(topRoute)}
          onMouseEnter={() => topRoute && prefetchItem(topRoute.name)}
          type="button"
        >
          <span className={styles.spotlightThumb} aria-hidden="true">
            <GameImage
              src={topImage}
              alt=""
              width={36}
              height={36}
              sizes="36px"
              loading="eager"
              fallback={<Icon name="skillProfit" size="md" />}
            />
          </span>
          <span className={styles.spotlightMeta}>
            <span className={styles.spotlightKicker}>
              {activeSkill === "All" ? "Best Liquid Route" : `Best ${activeSkill} Route`}
            </span>
            <span className={styles.spotlightTitleRow}>
              <span>{topRoute ? topRoute.name : "Loading routes..."}</span>
              {topRoute && <Icon name="chevronRight" size="sm" aria-hidden="true" />}
            </span>
            <span className={styles.spotlightSub}>
              {topRoute ? (
                <>
                  <span>
                    {topRoute.skill} Lv {topRoute.level}
                  </span>
                  <span aria-hidden="true">|</span>
                  <GoldIcon size={12} />
                  <strong>{spotlightProfitLabel}</strong>
                </>
              ) : (
                <span>Syncing market snapshot</span>
              )}
            </span>
          </span>
        </button>

        <div className={styles.statStrip}>
          <Metric
            label="Active Buffs"
            value={`+${buffTotals.efficiency}% / +${buffTotals.experience}%`}
            sub={activeSkill === "Construction" ? "Ascension excluded" : "Eff / EXP stack"}
          />
          <Metric
            label="Idle Window"
            value={
              activeSkill === "All"
                ? housingWindowAllValue
                : activeSkillHousingHours > 0
                  ? `${activeSkillHousingLabel} +${formatHours(activeSkillHousingHours)}`
                  : `${formatHours(baseIdleActionHours)} base`
            }
            sub={activeSkill === "All" ? housingWindowAllSub : housingWindowSub}
          />
          <Metric
            label="Market"
            value={formatMarketAge(marketAgeMinutes)}
            sub={membership ? "Member rate active" : "Standard tax rate"}
          />
          <Metric
            label="Shown"
            value={`${filteredCount.toLocaleString()} routes`}
            sub={`${liquidRouteCount.toLocaleString()} liquid`}
          />
        </div>
      </section>
    </header>
  );
}

export interface SkillProfitTabsProps {
  activeSkill: SkillName | "All";
  onSelectSkill: (skill: SkillName | "All") => void;
  counts?: Map<SkillName, number>;
  rowsCount?: number;
}

export function SkillProfitTabs({
  activeSkill,
  onSelectSkill,
  counts,
  rowsCount,
}: SkillProfitTabsProps) {
  return (
    <section className={styles.tabsBar} aria-label="Skill category tabs">
      <Tabs
        value={activeSkill}
        onValueChange={(next) => onSelectSkill(next as SkillName | "All")}
        variant="pill"
        sharedPanelId="skill-profit-results"
        className={styles.tabsContainer}
      >
        <TabList aria-label="Filter routes by skill" className={styles.tabsList}>
          <Tab value="All" badge={rowsCount}>
            All
          </Tab>
          {SKILLS.map((skill) => (
            <Tab
              key={skill}
              value={skill}
              icon={<Icon name={SKILL_TAB_ICONS[skill]} size="xs" />}
              badge={counts?.get(skill)}
            >
              {skill}
            </Tab>
          ))}
        </TabList>
      </Tabs>
    </section>
  );
}
