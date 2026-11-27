"use client";

import { GameImage } from "@/components/GameImage";
import { GoldIcon } from "@/components/GoldIcon";
import QualityText from "@/components/QualityText";
import {
  Banner,
  Button,
  Card,
  Checkbox,
  EmptyState,
  Icon,
  NumberInput,
} from "@/components/ui";
import { formatGold, formatSignedGold } from "@/lib/alchemy-profit";
import type { CraftingQueuePlan, QueueNeedRow } from "@/lib/crafting-queue";
import type { CartRecipeOption } from "../types";
import type { CartFinancialTotals } from "../utils/cart-math";
import styles from "../page.module.css";

interface CraftingCartViewProps {
  plan: CraftingQueuePlan;
  totals: CartFinancialTotals;
  starterRecipes: CartRecipeOption[];
  vials: QueueNeedRow[];
  ingredients: QueueNeedRow[];
  checkedNeedNames: Record<string, boolean>;
  copiedList: boolean;
  undoSnapshot: Record<string, number> | null;
  onQuickAdd: (name: string, quantity: number) => void;
  onSetQuantity: (name: string, qty: number) => void;
  onRemoveItem: (name: string) => void;
  onClearCart: () => void;
  onUndoClear: () => void;
  onToggleChecked: (name: string) => void;
  onClearChecked: () => void;
  onCopyMarketList: () => void;
  getItemImageUrl: (name: string) => string | undefined;
  getItemQuality: (name: string) => string;
  onInspectItem: (name: string) => void;
  onPrefetchItem: (name: string) => void;
}

export function CraftingCartView({
  plan,
  totals,
  starterRecipes,
  vials,
  ingredients,
  checkedNeedNames,
  copiedList,
  undoSnapshot,
  onQuickAdd,
  onSetQuantity,
  onRemoveItem,
  onClearCart,
  onUndoClear,
  onToggleChecked,
  onClearChecked,
  onCopyMarketList,
  getItemImageUrl,
  getItemQuality,
  onInspectItem,
  onPrefetchItem,
}: CraftingCartViewProps) {
  const renderNeedSection = (label: string, rows: QueueNeedRow[]) => {
    if (rows.length === 0) return null;

    return (
      <div className={styles.needGroup}>
        <div className={styles.needGroupLabel}>{label}</div>
        <div className={styles.needList}>
          {rows.map((item) => {
            const isChecked = Boolean(checkedNeedNames[item.name]);
            const imgUrl = getItemImageUrl(item.name);
            const desc =
              item.unitPrice > 0
                ? `${item.quantity.toLocaleString()}x at ${formatGold(item.unitPrice)}g each`
                : `${item.quantity.toLocaleString()}x (price missing)`;

            return (
              <div
                key={item.name}
                className={`${styles.needRow} ${isChecked ? styles.needRowChecked : ""}`}
              >
                <div className={styles.needCheckCol}>
                  <Checkbox
                    checked={isChecked}
                    onChange={() => onToggleChecked(item.name)}
                    description={<span className={styles.tabularNum}>{desc}</span>}
                    label={
                      <span className={styles.needLabelWrap}>
                        {imgUrl && (
                          <GameImage
                            src={imgUrl}
                            alt=""
                            width={22}
                            height={22}
                            className={styles.thumbSm}
                          />
                        )}
                        <span className={styles.needItemName}>{item.name}</span>
                      </span>
                    }
                  />
                </div>

                <div className={styles.needRightCol}>
                  <span className={`${styles.needPrice} ${styles.tabularNum}`}>
                    <GoldIcon size={12} />
                    <span>{item.totalPrice > 0 ? `${formatGold(item.totalPrice)}g` : "--"}</span>
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={styles.inspectBtn}
                    onClick={() => onInspectItem(item.name)}
                    onMouseEnter={() => onPrefetchItem(item.name)}
                    onFocus={() => onPrefetchItem(item.name)}
                    aria-label={`Inspect ${item.name} market details`}
                  >
                    <Icon name="info" size="xs" aria-hidden="true" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (plan.entries.length === 0) {
    return (
      <>
        {undoSnapshot && (
          <Banner
            variant="info"
            action={{
              label: "Undo clear",
              onClick: onUndoClear,
            }}
          >
            Cleared {Object.keys(undoSnapshot).length} recipes from your cart.
          </Banner>
        )}

        <div className={styles.emptyCartWrap}>
          <EmptyState
            icon="emptyInbox"
            size="md"
            title="Your crafting cart is empty"
            description="Search for an Alchemy recipe above to see exact ingredients, vials, and gold needed."
          >
            {starterRecipes.length > 0 && (
              <div className={styles.starterRow}>
                {starterRecipes.map((opt) => (
                  <Button
                    key={opt.name}
                    variant="secondary"
                    size="sm"
                    icon={<Icon name="plus" size="xs" aria-hidden="true" />}
                    onClick={() => onQuickAdd(opt.name, 50)}
                  >
                    {opt.name} (50)
                  </Button>
                ))}
              </div>
            )}
          </EmptyState>
        </div>
      </>
    );
  }

  return (
    <div className={styles.cartGrid}>
      <Card padding="md" className={styles.cartCard}>
        <div className={styles.cardHeaderRow}>
          <h2 className={styles.cardTitle}>
            <Icon name="alchemy" size="sm" aria-hidden="true" />
            <span>Recipes ({plan.entries.length})</span>
          </h2>
          <Button
            variant="ghost"
            size="sm"
            icon={<Icon name="trash" size="xs" aria-hidden="true" />}
            onClick={onClearCart}
          >
            Clear All
          </Button>
        </div>

        <div className={styles.recipeList}>
          {plan.entries.map((entry) => {
            const imgUrl = getItemImageUrl(entry.name);
            const quality = getItemQuality(entry.name);
            const batchProfit = entry.totalProfit;

            return (
              <div key={entry.name} className={styles.recipeRow}>
                <button
                  type="button"
                  className={styles.recipeIdentityBtn}
                  onClick={() => onInspectItem(entry.name)}
                  onMouseEnter={() => onPrefetchItem(entry.name)}
                  onFocus={() => onPrefetchItem(entry.name)}
                  aria-label={`Inspect ${entry.name} prices and ingredients`}
                >
                  {imgUrl ? (
                    <GameImage src={imgUrl} alt="" width={34} height={34} className={styles.thumb} />
                  ) : (
                    <span className={styles.thumbFallback} aria-hidden="true">
                      <Icon name="alchemy" size="xs" />
                    </span>
                  )}
                  <div className={styles.recipeInfoCol}>
                    <QualityText value={quality} className={styles.recipeName}>
                      {entry.name}
                    </QualityText>
                    <div className={`${styles.recipeSub} ${styles.tabularNum}`}>
                      <span>Cost: {formatGold(entry.inputCostTotal)}g</span>
                      <span className={batchProfit >= 0 ? styles.positive : styles.negative}>
                        Net: {formatSignedGold(batchProfit)}
                      </span>
                    </div>
                  </div>
                </button>

                <div className={styles.recipeControls}>
                  <div className={styles.rowStepper}>
                    <NumberInput
                      ariaLabel={`${entry.name} quantity`}
                      value={entry.quantity}
                      min={1}
                      max={999999}
                      step={1}
                      showSteppers
                      onChange={(val) => onSetQuantity(entry.name, val)}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={styles.removeBtn}
                    onClick={() => onRemoveItem(entry.name)}
                    aria-label={`Remove ${entry.name} from cart`}
                  >
                    <Icon name="trash" size="xs" aria-hidden="true" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <aside className={styles.listColumn} aria-label="Shopping list and cost summary">
        <Card padding="md" className={styles.listCard}>
          <div className={styles.cardHeaderRow}>
            <h2 className={styles.cardTitle}>
              <Icon name="market" size="sm" aria-hidden="true" />
              <span>Shopping List</span>
            </h2>
            <div className={styles.headerActionsGroup}>
              {totals.checkedCount > 0 && (
                <Button variant="ghost" size="sm" onClick={onClearChecked}>
                  Uncheck ({totals.checkedCount})
                </Button>
              )}
              <Button
                variant="primary"
                size="sm"
                icon={<Icon name={copiedList ? "check" : "copy"} size="xs" aria-hidden="true" />}
                onClick={onCopyMarketList}
              >
                {copiedList ? "Copied" : "Copy List"}
              </Button>
            </div>
          </div>

          <div className={styles.totalsStrip}>
            <div className={styles.totalCell}>
              <span className={styles.totalLabel}>To Buy</span>
              <span className={`${styles.totalValue} ${styles.tabularNum}`}>
                <GoldIcon size={13} />
                <span>{formatGold(totals.remainingGoldNeeded)}g</span>
              </span>
              {totals.ownedSavingsGold > 0 && (
                <span className={`${styles.totalNote} ${styles.tabularNum}`}>
                  -{formatGold(totals.ownedSavingsGold)}g owned
                </span>
              )}
            </div>

            <div className={styles.totalCell}>
              <span className={styles.totalLabel}>Est. Return</span>
              <span className={`${styles.totalValue} ${styles.tabularNum}`}>
                <GoldIcon size={13} />
                <span>{formatGold(plan.totalRevenue)}g</span>
              </span>
            </div>

            <div className={styles.totalCell}>
              <span className={styles.totalLabel}>Est. Profit</span>
              <span
                className={`${styles.totalValue} ${styles.tabularNum} ${
                  plan.totalProfit >= 0 ? styles.positive : styles.negative
                }`}
              >
                <GoldIcon size={13} />
                <span>{formatSignedGold(plan.totalProfit)}</span>
              </span>
            </div>
          </div>

          {plan.missingItems.length > 0 && (
            <Banner variant="warning">
              <div>
                <strong>Missing prices ({plan.missingItems.length})</strong>
                <div className={styles.missingLinks}>
                  {plan.missingItems.map((name) => (
                    <Button
                      key={name}
                      variant="secondary"
                      size="sm"
                      onClick={() => onInspectItem(name)}
                      onMouseEnter={() => onPrefetchItem(name)}
                    >
                      {name}
                    </Button>
                  ))}
                </div>
              </div>
            </Banner>
          )}

          {renderNeedSection("Vials (NPC Merchant)", vials)}
          {renderNeedSection("Ingredients (Market)", ingredients)}
        </Card>
      </aside>
    </div>
  );
}
