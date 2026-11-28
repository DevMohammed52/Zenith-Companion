"use client";

import Link from "next/link";
import { Badge, Icon } from "@/components/ui";
import ZenithIcon from "@/components/icons/ZenithIcon";
import { formatGold } from "@/lib/format";
import { GoldIcon, ShardIcon } from "@/components/GoldIcon";
import { useSafeProfiles } from "@/lib/profiles";
import type { ForgeState, ForgeTab } from "../types";
import type { UseForgeLessonsReturn } from "../hooks/useForgeLessons";
import styles from "../Forge.module.css";

export function ForgeHeader({
  state,
  lessons,
  activeTab: explicitActiveTab,
  title,
}: {
  state?: Partial<ForgeState>;
  lessons?: UseForgeLessonsReturn;
  activeTab?: ForgeTab;
  title?: string;
}) {
  const profiles = useSafeProfiles();
  const profileName = state?.activeProfileName || profiles?.activeProfile?.name || "Global settings";
  const activeTab = explicitActiveTab || state?.activeTab || (lessons ? "lessons" : "craft");
  const plan = state?.plan;
  const showCraftMetrics = activeTab === "craft" && plan && plan.totalCrafts > 0;
  const sessionSummary = lessons?.sessionSummary;
  const showLessonMetrics = activeTab === "lessons" && sessionSummary && sessionSummary.queuedItems.length > 0;

  const totalItemsLabel =
    activeTab === "craft"
      ? `${state?.recipes?.length?.toLocaleString() || "0"} recipes`
      : `${lessons?.allCalculatedMaterials?.length?.toLocaleString() || "91"} materials`;

  const headerTitle = title || "Forge Planner";

  return (
    <header className={styles.headerBlock} role="banner">
      <div className={styles.titleRow}>
        <div className={styles.titleGroup}>
          <span className={styles.eyebrow}>
            <ZenithIcon name="forge" size={14} aria-hidden="true" />
            <span>
              {profileName} | {totalItemsLabel}
            </span>
          </span>
          <h1 id="forge-page-title" className={styles.pageTitle}>
            <span>{headerTitle}</span>
          </h1>
        </div>

        <div className={styles.headerActions}>
          {lessons && (
            <Badge
              variant={lessons.hasMembershipBuff ? "success" : "neutral"}
              size="sm"
            >
              {lessons.hasMembershipBuff ? "12% Member tax" : "15% Free tax"}
            </Badge>
          )}
          <Link href="/skill-profit" className={styles.skillProfitLink}>
            <span>Skill Profit</span>
            <Icon name="arrowRight" size="xs" aria-hidden="true" />
          </Link>

          {showCraftMetrics && plan && (
            <div className={styles.heroMetricsStrip} aria-label="Plan summary">
              <span className={styles.inlineMetric}>
                <strong>{plan.totalCrafts.toLocaleString()}</strong> crafts
              </span>
              {plan.totalForgeExp > 0 && (
                <span className={styles.inlineMetric}>
                  <strong>+{plan.totalForgeExp.toLocaleString()}</strong> Forge XP
                </span>
              )}
              {plan.totalMissingCost > 0 && (
                <span className={styles.inlineMetric}>
                  <strong>{formatGold(plan.totalMissingCost)}</strong>
                  <GoldIcon size={12} />
                </span>
              )}
            </div>
          )}

          {showLessonMetrics && sessionSummary && (
            <div className={styles.heroMetricsStrip} aria-label="Lesson summary">
              <span className={styles.inlineMetric}>
                <strong>+{sessionSummary.totalForgeExp.toLocaleString()}</strong> XP
              </span>
              <span className={styles.inlineMetric}>
                Temper ~<strong>{sessionSummary.estimatedTemperBarPercent}%</strong> (~{sessionSummary.estimatedTemperShards}{" "}
                <ShardIcon size={12} />)
              </span>
              {sessionSummary.totalCost > 0 && (
                <span className={styles.inlineMetric}>
                  <strong>{formatGold(sessionSummary.totalCost)}</strong>
                  <GoldIcon size={12} />
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
