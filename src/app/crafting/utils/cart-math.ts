import type { CraftingQueuePlan, QueueNeedRow } from "@/lib/crafting-queue";

export interface CartFinancialTotals {
  ownedSavingsGold: number;
  remainingGoldNeeded: number;
  checkedCount: number;
  totalNeedCount: number;
}

export function calculateCartTotals(
  plan: CraftingQueuePlan,
  checkedNeedNames: Record<string, boolean>,
): CartFinancialTotals {
  const allNeeds: QueueNeedRow[] = [...plan.vialList, ...plan.shoppingList];
  let ownedSavingsGold = 0;
  let checkedCount = 0;

  for (const need of allNeeds) {
    if (checkedNeedNames[need.name]) {
      checkedCount += 1;
      ownedSavingsGold += need.totalPrice;
    }
  }

  return {
    ownedSavingsGold,
    remainingGoldNeeded: Math.max(0, plan.totalCost - ownedSavingsGold),
    checkedCount,
    totalNeedCount: allNeeds.length,
  };
}

export function formatShoppingListText(
  plan: CraftingQueuePlan,
  checkedNeedNames: Record<string, boolean>,
): string {
  const lines: string[] = [];
  const toBuyVials = plan.vialList.filter((item) => !checkedNeedNames[item.name]);
  const toBuyMats = plan.shoppingList.filter((item) => !checkedNeedNames[item.name]);

  if (toBuyVials.length > 0) {
    lines.push("Vials (NPC):");
    for (const item of toBuyVials) {
      lines.push(`- ${item.quantity.toLocaleString()}x ${item.name} (${item.totalPrice.toLocaleString()}g)`);
    }
  }

  if (toBuyMats.length > 0) {
    if (lines.length > 0) lines.push("");
    lines.push("Ingredients (Market):");
    for (const item of toBuyMats) {
      const priceLabel =
        item.totalPrice > 0 ? `${item.totalPrice.toLocaleString()}g` : "price missing";
      lines.push(`- ${item.quantity.toLocaleString()}x ${item.name} (${priceLabel})`);
    }
  }

  return lines.join("\n");
}
