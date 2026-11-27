"use client";

import type { ForgeState } from "../../types";
import { ForgeRecipeBuilder } from "./ForgeRecipeBuilder";
import { ForgePlanSection } from "./ForgePlanSection";
import { ForgeShoppingSection } from "./ForgeShoppingSection";
import styles from "../../Forge.module.css";

export function CraftItemTab({ state }: { state: ForgeState }) {
  const hasEntries = state.plan.entries.length > 0;

  return (
    <div
      className={styles.craftWorkspace}
      id="forge-tab-panel-craft"
      role="tabpanel"
      aria-labelledby="forge-tab-craft"
    >
      <ForgeRecipeBuilder state={state} />

      {hasEntries ? (
        <div className={styles.craftSplitGrid}>
          <ForgePlanSection state={state} />
          <aside className={styles.craftShoppingRail} aria-label="Shopping requirements and yield">
            <ForgeShoppingSection state={state} />
          </aside>
        </div>
      ) : (
        <ForgePlanSection state={state} />
      )}
    </div>
  );
}
