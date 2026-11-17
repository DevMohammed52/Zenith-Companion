"use client";

import type { ForgeState } from "../../types";
import { ForgeRecipeBuilder } from "./ForgeRecipeBuilder";
import { ForgePlanSection } from "./ForgePlanSection";
import { ForgeShoppingSection } from "./ForgeShoppingSection";

export function CraftItemTab({ state }: { state: ForgeState }) {
  return (
    <div className="craft-item-tab" id="forge-tab-panel-craft" role="tabpanel" aria-labelledby="forge-tab-craft">
      <ForgeRecipeBuilder state={state} />
      <ForgePlanSection state={state} />
      <ForgeShoppingSection state={state} />
    </div>
  );
}
