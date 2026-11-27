"use client";

import React from "react";
import {
  BackToTop,
  Banner,
  Button,
  Skeleton,
  SkeletonContainer,
  Tab,
  TabList,
  TabPanel,
  Tabs,
} from "@/components/ui";
import { Icon } from "@/components/ui/Icon";
import { useBisState } from "./hooks/useBisState";
import { BisTableTab } from "./components/BisTableTab";
import { BisUpgradesTab } from "./components/BisUpgradesTab";
import { BisCompareModal } from "./components/BisCompareModal";
import { BisLoadoutDrawer } from "./components/BisLoadoutDrawer";
import type { BisTab } from "./types";
import styles from "./page.module.css";

export default function BisPage() {
  const state = useBisState();

  return (
    <main className={styles.page} aria-labelledby="bis-page-title">
      <header className={styles.headerRow}>
        <div className={styles.titleGroup}>
          <div className={styles.titleLine}>
            <Icon name="bis" size="xl" className={styles.titleIcon} aria-hidden="true" />
            <h1 id="bis-page-title" className={styles.pageTitle}>
              Best-in-Slot Gear
            </h1>
          </div>
          <p className={styles.pageSubtitle}>
            Compare equipment stats by slot, check optimal upgrade tiers, and plan your next gear upgrades.
          </p>
        </div>

        <div className={styles.headerActions}>
          {state.hasWhatIfChanges && (
            <span className={styles.whatIfPill}>What-If Active</span>
          )}
          <Button
            variant="secondary"
            size="md"
            onClick={() => state.setIsLoadoutOpen(true)}
          >
            <Icon name="filter" size="sm" aria-hidden="true" />
            Loadout Setup
          </Button>
        </div>
      </header>

      <div className={styles.contextStrip} aria-label="Character loadout summary">
        <span className={styles.contextStat}>
          <strong>{state.activeProfileName}</strong>
        </span>
        <span className={styles.hairlineV} aria-hidden="true" />
        <span className={styles.contextStat}>
          Combat <strong>Lv. {state.levels.combat}</strong>
        </span>
        <span className={styles.hairlineV} aria-hidden="true" />
        <span className={styles.contextStat}>
          Str <strong>{state.levels.strength}</strong>
        </span>
        <span className={styles.hairlineV} aria-hidden="true" />
        <span className={styles.contextStat}>
          Dex <strong>{state.levels.dexterity}</strong>
        </span>
        <span className={styles.hairlineV} aria-hidden="true" />
        <span className={styles.contextStat}>
          Def <strong>{state.levels.defence}</strong>
        </span>
        <span className={styles.hairlineV} aria-hidden="true" />
        <span className={styles.contextStat}>
          <strong>{state.activeStyleLabel}</strong> ({state.equippedTotals.filledCount}/{state.equippedTotals.totalSlots} equipped)
        </span>
      </div>

      {state.fallbackError && state.combatItems.length === 0 && (
        <Banner variant="error">
          Could not load combat gear catalog. Check your offline cache or refresh once connected.
        </Banner>
      )}

      <div className={styles.workspaceStage}>
        {state.isLoading ? (
          <SkeletonContainer busy={true} className={styles.workspaceTabs}>
            <Skeleton height={48} />
            <Skeleton height={48} />
            <Skeleton height={540} />
          </SkeletonContainer>
        ) : (
          <Tabs
            value={state.activeTab}
            onValueChange={(val) => state.setActiveTab(val as BisTab)}
            variant="pill"
            className={styles.workspaceTabs}
          >
            <TabList aria-label="Gear planner sections">
              <Tab value="table">Gear Table</Tab>
              <Tab value="upgrades" badge={state.actionableUpgradeCount || undefined}>
                Next Upgrades
              </Tab>
            </TabList>

            <TabPanel value="table">
              <BisTableTab state={state} />
            </TabPanel>

            <TabPanel value="upgrades">
              <BisUpgradesTab state={state} />
            </TabPanel>
          </Tabs>
        )}
      </div>

      <BisCompareModal state={state} />
      <BisLoadoutDrawer state={state} />
      <BackToTop />
    </main>
  );
}
